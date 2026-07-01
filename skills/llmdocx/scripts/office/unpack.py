"""Unpack Office files (DOCX, PPTX, XLSX) for editing.

Extracts the ZIP archive, pretty-prints XML files, and optionally:
- Merges adjacent runs with identical formatting (DOCX only)
- Simplifies adjacent tracked changes from same author (DOCX only)

Usage:
    python unpack.py <office_file> <output_dir> [options]

Examples:
    python unpack.py document.docx unpacked/
    python unpack.py presentation.pptx unpacked/
    python unpack.py document.docx unpacked/ --merge-runs false
"""

import sys
from pathlib import Path
# Insert current directory into sys.path to support relative imports in different cwds
sys.path.insert(0, str(Path(__file__).parent))

import argparse
import zipfile
import defusedxml.minidom

from helpers.merge_runs import merge_runs as do_merge_runs
from helpers.simplify_redlines import simplify_redlines as do_simplify_redlines

SMART_QUOTE_REPLACEMENTS = {
    "\u201c": "&#x201C;",  
    "\u201d": "&#x201D;",  
    "\u2018": "&#x2018;",  
    "\u2019": "&#x2019;",  
}


def escape_text(text: str) -> str:
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    for char, entity in SMART_QUOTE_REPLACEMENTS.items():
        text = text.replace(char, entity)
    return text


def escape_attr(val: str) -> str:
    val = val.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")
    for char, entity in SMART_QUOTE_REPLACEMENTS.items():
        val = val.replace(char, entity)
    return val


def serialize_node(node, indent="  ", level=0) -> str:
    if node.nodeType == node.TEXT_NODE:
        return escape_text(node.nodeValue or "")
    if node.nodeType == node.COMMENT_NODE:
        return f"<!--{escape_text(node.nodeValue or '')}-->"
    if node.nodeType == node.DOCUMENT_NODE:
        res = []
        for child in node.childNodes:
            res.append(serialize_node(child, indent, level))
        return "".join(res)

    tag = node.tagName
    local_name = tag.split(":")[-1]
    is_text_bearing = local_name in ("t", "delText", "instrText")

    attrs = []
    for name, val in node.attributes.items():
        attrs.append(f' {name}="{escape_attr(val)}"')
    attrs_str = "".join(attrs)

    if not node.childNodes:
        return f"<{tag}{attrs_str}/>"

    if len(node.childNodes) == 1 and node.childNodes[0].nodeType == node.TEXT_NODE:
        text_val = node.childNodes[0].nodeValue or ""
        return f"<{tag}{attrs_str}>{escape_text(text_val)}</{tag}>"

    child_strings = []
    for child in node.childNodes:
        child_strings.append(serialize_node(child, indent, level + 1))

    if is_text_bearing:
        content = "".join(child_strings)
        return f"<{tag}{attrs_str}>{content}</{tag}>"

    content_parts = []
    for child_str in child_strings:
        if child_str.startswith("<") or child_str.startswith("<!--"):
            content_parts.append("\n" + (indent * (level + 1)) + child_str)
        else:
            content_parts.append(child_str)

    content = "".join(content_parts)
    return f"<{tag}{attrs_str}>{content}\n{(indent * level)}</{tag}>"


def unpack(
    input_file: str,
    output_directory: str,
    merge_runs: bool = True,
    simplify_redlines: bool = True,
) -> tuple[None, str]:
    input_path = Path(input_file)
    output_path = Path(output_directory)
    suffix = input_path.suffix.lower()

    if not input_path.exists():
        return None, f"Error: {input_file} does not exist"

    if suffix not in {".docx", ".pptx", ".xlsx"}:
        return None, f"Error: {input_file} must be a .docx, .pptx, or .xlsx file"

    try:
        output_path.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(input_path, "r") as zf:
            zf.extractall(output_path)

        xml_files = list(output_path.rglob("*.xml")) + list(output_path.rglob("*.rels"))
        for xml_file in xml_files:
            _pretty_print_and_escape_xml(xml_file)

        message = f"Unpacked {input_file} ({len(xml_files)} XML files)"

        if suffix == ".docx":
            if simplify_redlines:
                simplify_count, _ = do_simplify_redlines(str(output_path))
                message += f", simplified {simplify_count} tracked changes"

            if merge_runs:
                merge_count, _ = do_merge_runs(str(output_path))
                message += f", merged {merge_count} runs"

        return None, message

    except zipfile.BadZipFile:
        return None, f"Error: {input_file} is not a valid Office file"
    except Exception as e:
        return None, f"Error unpacking: {e}"


def _pretty_print_and_escape_xml(xml_file: Path) -> None:
    try:
        content = xml_file.read_text(encoding="utf-8")
        dom = defusedxml.minidom.parseString(content)
        serialized = serialize_node(dom)
        xml_decl = ""
        if content.startswith("<?xml"):
            end_idx = content.find("?>")
            if end_idx != -1:
                xml_decl = content[:end_idx + 2] + "\n"

        if xml_decl and not serialized.startswith("<?xml"):
            serialized = xml_decl + serialized

        xml_file.write_text(serialized, encoding="utf-8")
    except Exception:
        pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Unpack an Office file (DOCX, PPTX, XLSX) for editing"
    )
    parser.add_argument("input_file", help="Office file to unpack")
    parser.add_argument("output_directory", help="Output directory")
    parser.add_argument(
        "--merge-runs",
        type=lambda x: x.lower() == "true",
        default=True,
        metavar="true|false",
        help="Merge adjacent runs with identical formatting (DOCX only, default: true)",
    )
    parser.add_argument(
        "--simplify-redlines",
        type=lambda x: x.lower() == "true",
        default=True,
        metavar="true|false",
        help="Merge adjacent tracked changes from same author (DOCX only, default: true)",
    )
    args = parser.parse_args()

    _, message = unpack(
        args.input_file,
        args.output_directory,
        merge_runs=args.merge_runs,
        simplify_redlines=args.simplify_redlines,
    )
    print(message)

    if "Error" in message:
        sys.exit(1)
