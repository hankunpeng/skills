import os
import sys
import json
import httpx
import contextlib

def set_process_name(name):
    try:
        import setproctitle
        setproctitle.setproctitle(name)
    except ImportError:
        pass

def print_streaming_response(generator):
    full_response = []
    for chunk in generator:
        if chunk is not None:
            sys.stdout.write(chunk)
            sys.stdout.flush()
            full_response.append(chunk)
    print()
    return full_response

class App:
    @staticmethod
    def _get_zshrc_key():
        zshrc_path = os.path.expanduser("~/.zshrc")
        if os.path.exists(zshrc_path):
            try:
                gemini_key = None
                google_key = None
                with open(zshrc_path) as f:
                    for line in f:
                        if "GEMINI_API_KEY=" in line:
                            clean_line = line.lstrip("#").strip()
                            parts = clean_line.split("=", 1)
                            if len(parts) == 2:
                                val = parts[1].strip().strip('"').strip("'")
                                if val:
                                    gemini_key = val
                        elif "GOOGLE_API_KEY=" in line:
                            clean_line = line.lstrip("#").strip()
                            parts = clean_line.split("=", 1)
                            if len(parts) == 2:
                                val = parts[1].strip().strip('"').strip("'")
                                if val:
                                    google_key = val
                return gemini_key or google_key
            except Exception:
                pass
        return None

    @staticmethod
    def _get_cli_api_key():
        for i, arg in enumerate(sys.argv):
            if arg == '--api-key' and i + 1 < len(sys.argv):
                return sys.argv[i+1]
        return None

    @classmethod
    def add_common_argument(cls, parser, default_api='gemini'):
        parser.add_argument('--api', default=default_api, help='API provider (gemini, deepseek, openai)')
        parser.add_argument('--model', help='Model name')
        parser.add_argument('--api-key', help='API Key override')

    def __init__(self, api, model):
        self.api = api.lower() if api else 'gemini'
        self.model = model
        
        # If API is default 'gemini' but the model name explicitly points to deepseek or openai
        if self.api == 'gemini' and self.model:
            if 'deepseek' in self.model.lower():
                self.api = 'deepseek'
            elif 'gpt' in self.model.lower():
                self.api = 'openai'
                
        self.api_key = self._get_cli_api_key()
        
        if not self.api_key:
            if self.api == 'gemini':
                self.api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or self._get_zshrc_key()
            elif self.api == 'deepseek':
                self.api_key = os.environ.get("DS_API_KEY")
            elif self.api == 'openai':
                self.api_key = os.environ.get("OPENAI_API_KEY")

        # Resolve model defaults if not specified or mismatched
        if self.api == 'deepseek':
            if not self.model or 'gemini' in self.model.lower() or self.model == 'deepseek-chat':
                self.model = 'deepseek-v4-pro'
        elif self.api == 'openai':
            if not self.model or 'gemini' in self.model.lower():
                self.model = 'gpt-4o'
        elif self.api == 'gemini':
            if not self.model:
                self.model = 'gemini-3.5-flash'

    @contextlib.contextmanager
    def stream(self, parts):
        yield self._call_api(parts)

    def _call_api(self, parts):
        if not self.api_key:
            yield f"Error: API Key not found for API provider '{self.api}'. Please configure your environment variables or pass --api-key.\n"
            return

        if self.api == 'gemini':
            # Determine models to try: gemini-3.5-flash first, then gemini-3.1-flash-lite
            models_to_try = []
            if self.model == 'gemini-3.5-flash':
                models_to_try = ['gemini-3.5-flash', 'gemini-3.1-flash-lite']
            elif self.model == 'gemini-3.1-flash-lite':
                models_to_try = ['gemini-3.1-flash-lite']
            else:
                models_to_try = [self.model, 'gemini-3.1-flash-lite']
            
            # Format contents for SDKs
            sdk_contents = []
            for msg in parts:
                role = msg['role']
                if role == 'assistant':
                    role = 'model'
                sdk_contents.append({
                    "role": role,
                    "parts": [{"text": msg['content']}]
                })

            for model_name in models_to_try:
                # 1. Try Google GenAI SDK (New standard SDK)
                try:
                    from google import genai
                    client = genai.Client(api_key=self.api_key)
                    response = client.models.generate_content_stream(
                        model=model_name,
                        contents=sdk_contents
                    )
                    iterator = iter(response)
                    first_chunk = next(iterator)
                    if first_chunk.text:
                        yield first_chunk.text
                    for chunk in iterator:
                        if chunk.text:
                            yield chunk.text
                    return  # Success!
                except (ImportError, Exception):
                    pass

                # 2. Try Google GenerativeAI SDK (Legacy SDK)
                try:
                    import google.generativeai as legacy_genai
                    legacy_genai.configure(api_key=self.api_key)
                    model = legacy_genai.GenerativeModel(model_name)
                    response = model.generate_content(sdk_contents, stream=True)
                    iterator = iter(response)
                    first_chunk = next(iterator)
                    if first_chunk.text:
                        yield first_chunk.text
                    for chunk in iterator:
                        if chunk.text:
                            yield chunk.text
                    return  # Success!
                except (ImportError, Exception):
                    pass

                # 3. Fallback to HTTP via httpx
                http_model_name = model_name
                if "/" not in http_model_name:
                    http_model_name = f"models/{http_model_name}"
                
                url = f"https://generativelanguage.googleapis.com/v1beta/{http_model_name}:streamGenerateContent?key={self.api_key}"
                headers = {"Content-Type": "application/json"}
                body = {"contents": sdk_contents}
                
                try:
                    with httpx.Client() as client:
                        with client.stream("POST", url, headers=headers, json=body, timeout=60.0) as response:
                            if response.status_code == 200:
                                brace_count = 0
                                json_str = ""
                                in_string = False
                                escaped = False
                                for chunk in response.iter_text():
                                    for char in chunk:
                                        if escaped:
                                            escaped = False
                                            if brace_count > 0:
                                                json_str += char
                                        elif char == '\\':
                                            escaped = True
                                            if brace_count > 0:
                                                json_str += char
                                        elif char == '"':
                                            in_string = not in_string
                                            if brace_count > 0:
                                                json_str += char
                                        elif char == '{' and not in_string:
                                            brace_count += 1
                                            json_str += char
                                        elif char == '}' and not in_string:
                                            brace_count -= 1
                                            json_str += char
                                            if brace_count == 0:
                                                try:
                                                    data = json.loads(json_str)
                                                    parts_list = data['candidates'][0]['content']['parts']
                                                    for part in parts_list:
                                                        if 'text' in part:
                                                            yield part['text']
                                                except Exception:
                                                    pass
                                                json_str = ""
                                                in_string = False
                                                escaped = False
                                        elif brace_count > 0:
                                            json_str += char
                                return  # Success!
                            else:
                                if model_name == models_to_try[-1]:
                                    error_msg = response.read().decode('utf-8')
                                    yield f"\n[Error from Gemini API: {response.status_code} - {error_msg}]\n"
                                    return
                except Exception as e:
                    if model_name == models_to_try[-1]:
                        yield f"\n[Network/Request Error: {e}]\n"
                        return

        elif self.api == 'deepseek':
            url = "https://api.deepseek.com/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            messages = [{'role': m['role'], 'content': m['content']} for m in parts]
            
            # Determine models to try: deepseek-v4-pro first, then deepseek-v4-flash
            models_to_try = []
            if self.model == 'deepseek-v4-pro':
                models_to_try = ['deepseek-v4-pro', 'deepseek-v4-flash']
            elif self.model == 'deepseek-v4-flash':
                models_to_try = ['deepseek-v4-flash']
            else:
                models_to_try = [self.model, 'deepseek-v4-flash']
                
            for model_name in models_to_try:
                body = {
                    "model": model_name,
                    "messages": messages,
                    "stream": True
                }
                
                try:
                    with httpx.Client() as client:
                        with client.stream("POST", url, headers=headers, json=body, timeout=60.0) as response:
                            if response.status_code == 200:
                                for line in response.iter_lines():
                                    if line.startswith("data: "):
                                        data_str = line[6:].strip()
                                        if data_str == "[DONE]":
                                            break
                                        try:
                                            data = json.loads(data_str)
                                            delta = data['choices'][0]['delta']
                                            if delta.get('content'):
                                                yield delta['content']
                                        except Exception:
                                            pass
                                return  # Success, exit the loop!
                            else:
                                if model_name == models_to_try[-1]:
                                    error_msg = response.read().decode('utf-8')
                                    yield f"\n[Error from DeepSeek API: {response.status_code} - {error_msg}]\n"
                                    return
                except Exception as e:
                    if model_name == models_to_try[-1]:
                        yield f"\n[Network/Request Error: {e}]\n"
                        return

        elif self.api == 'openai':
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            messages = [{'role': m['role'], 'content': m['content']} for m in parts]
            body = {
                "model": self.model,
                "messages": messages,
                "stream": True
            }
            
            try:
                with httpx.Client() as client:
                    with client.stream("POST", url, headers=headers, json=body, timeout=60.0) as response:
                        if response.status_code != 200:
                            error_msg = response.read().decode('utf-8')
                            yield f"\n[Error from OpenAI API: {response.status_code} - {error_msg}]\n"
                            return
                        
                        for line in response.iter_lines():
                            if line.startswith("data: "):
                                data_str = line[6:].strip()
                                if data_str == "[DONE]":
                                    break
                                try:
                                    data = json.loads(data_str)
                                    delta = data['choices'][0]['delta']
                                    if delta.get('content'):
                                        yield delta['content']
                                except Exception:
                                    pass
            except Exception as e:
                yield f"\n[Network/Request Error: {e}]\n"
        else:
            yield f"Error: Unsupported API provider '{self.api}'\n"

    def interact(self, parts):
        print("\n=== Entering Interactive Chat Mode (type 'exit' or 'quit' to exit) ===")
        while True:
            try:
                user_input = input("\nUser > ")
                if user_input.strip().lower() in ('exit', 'quit'):
                    break
                if not user_input.strip():
                    continue
                parts.append({'role': 'user', 'content': user_input})
                
                print("AI > ", end="")
                sys.stdout.flush()
                
                full_resp = []
                generator = self._call_api(parts)
                for chunk in generator:
                    if chunk is not None:
                        sys.stdout.write(chunk)
                        sys.stdout.flush()
                        full_resp.append(chunk)
                print()
                parts.append({'role': 'assistant', 'content': ''.join(full_resp)})
            except (KeyboardInterrupt, EOFError):
                print("\nExiting interactive chat mode.")
                break
            except Exception as e:
                print(f"\nError: {e}")
