#!/usr/bin/env python3
"""Build the local football-manager snapshot used by the game.

Wikidata is CC0. This script intentionally runs during data maintenance, never
inside the browser, so the game has no runtime dependency on the SPARQL API.
"""
from __future__ import annotations

import argparse
import json
import os
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = "FM2-manager-import/1.0 (offline snapshot; Wikidata CC0 data)"
DEFAULT_OUTPUT = Path("data/wikidataManagers.json")
PAGE_SIZE = 250
MAX_QID = "Q999999999999999"


def query_page(cursor: str, page_size: int) -> list[dict]:
    query = f"""
    SELECT DISTINCT ?manager ?managerLabel WHERE {{
      ?manager wdt:P31 wd:Q5;
               wdt:P106 wd:Q628099.
      FILTER(STRAFTER(STR(?manager), \"/entity/\") > \"{cursor}\")
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language \"en\". }}
    }}
    ORDER BY ?manager
    LIMIT {page_size}
    """
    body = urllib.parse.urlencode({"query": query, "format": "json"}).encode()
    request = urllib.request.Request(
        ENDPOINT,
        data=body,
        headers={
            "Accept": "application/sparql-results+json",
            "User-Agent": USER_AGENT,
        },
    )
    last_error: Exception | None = None
    for attempt in range(1, 7):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                payload = json.loads(response.read())
            return payload.get("results", {}).get("bindings", [])
        except Exception as error:  # noqa: BLE001 - retry transient WDQS failures
            last_error = error
            if attempt < 6:
                time.sleep(min(30, attempt * 5))
    raise RuntimeError(f"Wikidata page failed after retries at cursor {cursor}: {last_error}")


def read_checkpoint(path: Path) -> tuple[str, dict[str, dict]]:
    if not path.exists():
        return "Q0", {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        return payload.get("cursor", "Q0"), {
            item["wikidataId"]: item
            for item in payload.get("managers", [])
            if item.get("wikidataId")
        }
    except (OSError, json.JSONDecodeError, TypeError):
        return "Q0", {}


def write_checkpoint(path: Path, cursor: str, records: dict[str, dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    payload = {
        "source": "https://www.wikidata.org/",
        "license": "CC0 1.0",
        "cursor": cursor,
        "managers": sorted(records.values(), key=lambda item: (item["surname"].casefold(), item["name"].casefold())),
    }
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def normalize_row(row: dict) -> dict | None:
    uri = row.get("manager", {}).get("value", "")
    qid = uri.rsplit("/", 1)[-1]
    label = row.get("managerLabel", {}).get("value", "").strip()
    if not qid.startswith("Q") or not label or len(label.split()) < 2:
        return None
    parts = label.split()
    return {
        "wikidataId": qid,
        "name": parts[0],
        "surname": " ".join(parts[1:]),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--page-size", type=int, default=PAGE_SIZE)
    parser.add_argument("--max-pages", type=int, default=1000)
    args = parser.parse_args()

    checkpoint = args.output.with_suffix(args.output.suffix + ".checkpoint")
    cursor, records = read_checkpoint(checkpoint)
    page_size = args.page_size
    completed = False
    for page in range(args.max_pages):
        try:
            rows = query_page(cursor, page_size)
        except RuntimeError:
            if page_size <= 25:
                raise
            page_size //= 2
            print(f"Reducing page size to {page_size} after transient endpoint failures")
            continue
        if not rows:
            completed = True
            break
        before = len(records)
        for row in rows:
            normalized = normalize_row(row)
            if normalized:
                records[normalized["wikidataId"]] = normalized
        cursor = rows[-1].get("manager", {}).get("value", "").rsplit("/", 1)[-1] or cursor
        write_checkpoint(checkpoint, cursor, records)
        print(f"page={page + 1} rows={len(rows)} records={len(records)} cursor={cursor} pageSize={page_size}")
        if len(records) == before and len(rows) < page_size:
            completed = True
            break
        if len(rows) < page_size:
            completed = True
            break
        time.sleep(2)

    managers = sorted(records.values(), key=lambda item: (item["surname"].casefold(), item["name"].casefold()))
    result = {
        "source": "https://www.wikidata.org/",
        "license": "CC0 1.0",
        "query": "Humans with occupation association football coach (Q628099)",
        "complete": completed,
        "cursor": cursor,
        "recordCount": len(managers),
        "retrievedAt": datetime.now(timezone.utc).isoformat(),
        "managers": managers,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix(args.output.suffix + ".tmp")
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, args.output)
    if completed and checkpoint.exists():
        checkpoint.unlink()
    print(f"Wrote {len(managers)} managers to {args.output} (complete={completed}, cursor={cursor})")


if __name__ == "__main__":
    main()
