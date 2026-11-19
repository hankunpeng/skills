#!/usr/bin/env python3
"""Preview or permanently delete other saved Codex sessions in this directory."""

import argparse
import json
import os
from pathlib import Path
from queue import Empty, Queue
import subprocess
import sys
from threading import Thread
from time import monotonic
from uuid import UUID


INTERACTIVE_SOURCES = ["cli", "vscode"]
ALL_SOURCES = INTERACTIVE_SOURCES + [
    "exec", "appServer", "subAgent", "subAgentReview", "subAgentCompact",
    "subAgentThreadSpawn", "subAgentOther", "unknown",
]


class AppServer:
    def __init__(self, process):
        self.process = process
        self.responses = Queue()
        self.request_id = 0
        Thread(target=self.read_responses, daemon=True).start()

    def read_responses(self):
        for line in self.process.stdout:
            self.responses.put(line)
        self.responses.put(None)

    def send(self, message):
        self.process.stdin.write(json.dumps(message) + "\n")
        self.process.stdin.flush()

    def request(self, method, **params):
        self.request_id += 1
        self.send({"id": self.request_id, "method": method, "params": params})
        deadline = monotonic() + 30
        while (remaining := deadline - monotonic()) > 0:
            try:
                line = self.responses.get(timeout=remaining)
            except Empty:
                break
            if line is None:
                raise RuntimeError(f"Codex App Server exited during {method}")
            response = json.loads(line)
            if response.get("id") != self.request_id or "method" in response:
                continue
            if "error" in response:
                raise RuntimeError(f"{method}: {response['error']['message']}")
            return response["result"]
        raise RuntimeError(f"{method} timed out")

    def list_threads(self, **filters):
        cursor = None
        seen_cursors = set()
        while True:
            page = self.request("thread/list", cursor=cursor, limit=100, **filters)
            yield from page["data"]
            cursor = page["nextCursor"]
            if cursor is None:
                return
            if cursor in seen_cursors:
                raise RuntimeError("Codex repeated a pagination cursor")
            seen_cursors.add(cursor)


def same_directory(thread, cwd):
    thread_cwd = Path(thread["cwd"])
    return thread_cwd.is_absolute() and thread_cwd.resolve() == cwd


def scoped_threads(server, cwd, current):
    threads = {}
    for thread in server.list_threads(
        cwd=str(cwd),
        archived=False,
        currentAccountOnly=True,
        includeAttachedThreads=False,
        modelProviders=[],
        sourceKinds=INTERACTIVE_SOURCES,
    ):
        if (
            not same_directory(thread, cwd)
            or thread["source"] not in INTERACTIVE_SOURCES
            or thread["ephemeral"]
            or thread.get("attachedThreadParentId") is not None
        ):
            raise RuntimeError("Codex returned a session outside the requested scope")
        threads[str(UUID(thread["id"]))] = thread
    if current not in threads:
        raise RuntimeError("CODEX_THREAD_ID is absent from this directory's active /resume scope")
    return threads


def check_descendants(server, session_id, cwd, current):
    filters = {
        "ancestorThreadId": session_id,
        "sourceKinds": ALL_SOURCES,
        "modelProviders": [],
    }
    for archived in (False, True):
        for child in server.list_threads(archived=archived, **filters):
            if archived or str(UUID(child["id"])) == current or not same_directory(child, cwd):
                raise RuntimeError(f"{session_id} has a descendant outside the deletion scope")


def cleanup(server, cwd, current, approved):
    threads = scoped_threads(server, cwd, current)
    targets = threads.keys() - {current}
    if approved is None:
        preview = [
            {"id": sid, "title": (threads[sid]["name"] or threads[sid]["preview"])[:160]}
            for sid in sorted(targets)
        ]
        print(json.dumps({"cwd": str(cwd), "keep": current, "targets": preview}, ensure_ascii=False))
        return

    if approved != targets:
        raise RuntimeError("The target IDs differ from the preview. Preview the current scope again.")
    for session_id in sorted(targets):
        check_descendants(server, session_id, cwd, current)
    if scoped_threads(server, cwd, current).keys() - {current} != targets:
        raise RuntimeError("The target IDs changed during validation. Preview the current scope again.")

    deleted = []
    try:
        for session_id in sorted(targets):
            server.request("thread/delete", threadId=session_id)
            deleted.append(session_id)
            print(f"Deleted {session_id}", flush=True)
    finally:
        remaining = scoped_threads(server, cwd, current).keys() - {current}
        print(json.dumps({"kept": current, "deleted": deleted, "remaining": sorted(remaining)}))
    if remaining:
        raise RuntimeError("Other sessions remain in the current directory")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--delete", metavar="UUID", type=UUID, nargs="+",
        help="permanently delete the exact UUIDs from the preview",
    )
    args = parser.parse_args()
    try:
        current = str(UUID(os.environ.get("CODEX_THREAD_ID", "")))
    except ValueError:
        parser.error("run from the Codex conversation to keep; CODEX_THREAD_ID must be a UUID")
    approved = None if args.delete is None else {str(value) for value in args.delete}
    cwd = Path.cwd().resolve()
    with subprocess.Popen(
        ["codex", "app-server", "--listen", "stdio://"],
        cwd=cwd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, encoding="utf-8",
    ) as process:
        try:
            server = AppServer(process)
            server.request(
                "initialize",
                clientInfo={"name": "codex_resume_cleanup", "version": "1.0.0"},
                capabilities={"experimentalApi": True},
            )
            server.send({"method": "initialized"})
            cleanup(server, cwd, current, approved)
        finally:
            process.stdin.close()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()


if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, ValueError, KeyError) as exc:
        sys.exit(f"Resume cleanup stopped: {exc}")
