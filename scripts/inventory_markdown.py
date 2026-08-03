#!/usr/bin/env python3
"""Read-only Markdown inventory for the elementary science-fair evaluator."""
from __future__ import annotations

import argparse
import csv
import hashlib
import os
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path

EXCLUDED_DIRS = {"node_modules", ".git", "results", "output", "archive"}
ENCODINGS = ("utf-8-sig", "utf-8", "cp950", "big5")


def decode_file(path: Path) -> tuple[str | None, str | None, str | None]:
    try:
        raw = path.read_bytes()
    except OSError as exc:
        return None, None, f"read error: {exc}"
    for encoding in ENCODINGS:
        try:
            return raw.decode(encoding), encoding, None
        except UnicodeDecodeError:
            continue
    return None, None, "unable to decode as utf-8, cp950, or big5"


def text_count(text: str) -> int:
    # Count non-whitespace characters; this is meaningful for Chinese prose.
    return len(re.sub(r"\s+", "", text))


def sha256(path: Path) -> str | None:
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()
    except OSError:
        return None


def discover(root: Path) -> list[Path]:
    found: list[Path] = []
    for current, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d.casefold() not in EXCLUDED_DIRS]
        base = Path(current)
        for name in files:
            if Path(name).suffix.casefold() == ".md":
                found.append(base / name)
    return sorted(found, key=lambda p: str(p.relative_to(root)).casefold())


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a read-only Markdown inventory.")
    parser.add_argument("--root", required=True, help="Folder to scan")
    parser.add_argument("--results", required=True, help="Results folder to create/update")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    results = Path(args.results).resolve()
    if not root.is_dir():
        raise SystemExit(f"Root folder does not exist: {root}")
    results.mkdir(parents=True, exist_ok=True)

    paths = discover(root)
    rows: list[dict[str, object]] = []
    hashes: defaultdict[str, list[int]] = defaultdict(list)
    unreadable: list[dict[str, object]] = []
    for number, path in enumerate(paths, start=1):
        text, encoding, error = decode_file(path)
        relative = path.relative_to(root).as_posix()
        stat = path.stat()
        digest = sha256(path)
        row: dict[str, object] = {
            "編號": number,
            "檔名": path.name,
            "相對路徑": relative,
            "檔案大小_位元組": stat.st_size,
            "修改日期": datetime.fromtimestamp(stat.st_mtime).astimezone().isoformat(timespec="seconds"),
            "字數_非空白字元": text_count(text) if text is not None else "",
            "是否成功解析": "是" if error is None else "否",
            "編碼": encoding or "",
            "解析錯誤": error or "",
            "空白檔案": "是" if text is not None and not text.strip() else "否",
            "SHA256": digest or "",
            "完全重複檔": "否",
            "與哪一檔完全重複": "",
            "疑似同題不同版本": "待語意評估",
        }
        if digest:
            hashes[digest].append(len(rows))
        if error:
            unreadable.append(row)
        rows.append(row)

    for matching_rows in hashes.values():
        if len(matching_rows) < 2:
            continue
        canonical = str(rows[matching_rows[0]]["相對路徑"])
        for index in matching_rows:
            rows[index]["完全重複檔"] = "是"
            rows[index]["與哪一檔完全重複"] = canonical

    inventory_path = results / "file_inventory.csv"
    with inventory_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()) if rows else ["編號", "檔名", "相對路徑"])
        writer.writeheader()
        writer.writerows(rows)

    unreadable_path = results / "unreadable_files.md"
    lines = ["# 無法解析的 Markdown 檔案", "", f"掃描到 {len(paths)} 個 MD 檔，其中 {len(unreadable)} 個無法解析。", ""]
    if unreadable:
        lines += ["| 相對路徑 | 原因 |", "| --- | --- |"]
        lines += [f"| {row['相對路徑']} | {row['解析錯誤']} |" for row in unreadable]
    else:
        lines.append("沒有無法解析的檔案。")
    unreadable_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"SCANNED_MD_COUNT={len(paths)}")
    print(f"PARSEABLE_COUNT={len(paths) - len(unreadable)}")
    print(f"UNREADABLE_COUNT={len(unreadable)}")
    print(f"INVENTORY={inventory_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
