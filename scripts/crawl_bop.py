#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any

import httpx
from pydantic import BaseModel, Field

SEARCH_INDEX_URL = "https://framerusercontent.com/sites/6rJhKxDS6Bw4KXTedZ77cO/searchIndex-55MwA5U7OXaA.json"
SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = SCRIPT_DIR / "output"
OUTPUT_PATH = OUTPUT_DIR / "bop_auction_lots_raw.json"
USER_AGENT = "panama-coffee-atlas/1.0 (+https://github.com/)"

AUCTION_PATH_RE = re.compile(r"^/auction-(\d{4})/?$")
LOT_NUMBER_RE = re.compile(r"^(BOP-)?[A-Z]{1,4}[NW]?\-\d{1,3}$")
PRICE_VALUE_RE = re.compile(r"\$?\s*([\d,]+(?:\.\d+)?)")
WEIGHT_RE = re.compile(r"([\d,]+(?:\.\d+)?)\s*(lbs?|pounds?|kgs?|kg)\b", re.IGNORECASE)
SCORE_RE = re.compile(r"\b(\d{2}(?:\.\d+)?)\b")
INTEGER_RE = re.compile(r"^\d[\d,]*$")

HEADER_TOKENS = {
    "lot",
    "lot no",
    "lot no.",
    "lot number",
    "farm",
    "farm lot name",
    "farm name",
    "producer",
    "owner",
    "region",
    "district",
    "variety",
    "varietal",
    "process",
    "processing",
    "score",
    "weight",
    "price",
    "bags",
    "total bids",
}
PROCESS_KEYWORDS = ("washed", "natural", "honey", "anaerobic", "carbonic", "special")
VARIETY_KEYWORDS = ("geisha", "gesha", "pacamara", "caturra", "catuai", "bourbon", "typica", "varietal")


class HeadingMeta(BaseModel):
    raw: str
    code: str | None = None
    variety: str | None = None
    processing_method: str | None = None


class AuctionLotRecord(BaseModel):
    source_path: str
    year: int
    auction_title: str | None = None
    category_heading: str | None = None
    category_code: str | None = None
    lot_number: str
    lot_title: str | None = None
    producer: str | None = None
    region: str | None = None
    variety: str | None = None
    processing_method: str | None = None
    score: float | None = None
    score_text: str | None = None
    bags: int | None = None
    bags_text: str | None = None
    weight: float | None = None
    weight_unit: str | None = None
    weight_text: str | None = None
    price: float | None = None
    price_unit: str | None = None
    price_unit_inferred: bool = False
    price_text: str | None = None
    total_bids: int | None = None
    extra_tokens: list[str] = Field(default_factory=list)
    raw_tokens: list[str]


def clean_text(value: Any) -> str | None:
    if value is None:
        return None
    text = re.sub(r"\s+", " ", str(value).replace("\xa0", " ")).strip(" \t\r\n|-")
    return text or None


def normalize_label(text: str | None) -> str:
    if not text:
        return ""
    lowered = clean_text(text)
    if not lowered:
        return ""
    return re.sub(r"[^a-z0-9]+", " ", lowered.lower()).strip()


def standardize_category(raw_heading: str | None) -> HeadingMeta | None:
    heading = clean_text(raw_heading)
    if not heading:
        return None

    normalized = normalize_label(heading)
    code: str | None = None
    variety: str | None = None
    processing_method: str | None = None

    if "geisha" in normalized:
        variety = "Geisha"
    if "pacamara" in normalized:
        variety = "Pacamara"
    if "washed" in normalized:
        processing_method = "Washed"
    elif "natural" in normalized:
        processing_method = "Natural"
    elif "special processes" in normalized:
        processing_method = "Special Process"

    if "geisha" in normalized and "washed" in normalized:
        code = "GW"
    elif "geisha" in normalized:
        code = "GN"
    elif any(keyword in normalized for keyword in ("varietal", "traditional", "pacamara")):
        code = "V"

    return HeadingMeta(raw=heading, code=code, variety=variety, processing_method=processing_method)


def code_from_lot_number(lot_number: str) -> str | None:
    match = re.match(r"^(?:BOP-)?([A-Z]{1,4}[NW]?)\-\d{1,3}$", lot_number)
    if not match:
        return None

    prefix = match.group(1).upper()
    if prefix.startswith("GW"):
        return "GW"
    if prefix.startswith("GN"):
        return "GN"
    if prefix.startswith("V") or prefix.startswith("PAC"):
        return "V"
    return prefix


def looks_like_process(token: str) -> bool:
    lowered = token.lower()
    return any(keyword in lowered for keyword in PROCESS_KEYWORDS)


def looks_like_variety(token: str) -> bool:
    lowered = token.lower()
    return any(keyword in lowered for keyword in VARIETY_KEYWORDS)


def looks_like_header(token: str) -> bool:
    normalized = normalize_label(token)
    if normalized in HEADER_TOKENS:
        return True
    return normalized.endswith(" price") or normalized.endswith(" score")


def fetch_search_index() -> dict[str, Any]:
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    with httpx.Client(headers=headers, follow_redirects=True, timeout=30.0) as client:
        response = client.get(SEARCH_INDEX_URL)
        response.raise_for_status()
        payload = response.json()

    if not isinstance(payload, dict):
        raise ValueError("Framer search index returned an unexpected payload; expected an object.")
    return payload


def extract_pages(payload: dict[str, Any]) -> list[tuple[str, int, dict[str, Any]]]:
    pages: list[tuple[str, int, dict[str, Any]]] = []
    for path, entry in payload.items():
        if not isinstance(entry, dict):
            continue
        match = AUCTION_PATH_RE.match(path)
        if not match:
            continue
        pages.append((path, int(match.group(1)), entry))
    pages.sort(key=lambda item: item[1])
    return pages


def parse_rows(tokens: list[Any]) -> list[list[str]]:
    rows: list[list[str]] = []
    current_row: list[str] | None = None

    for raw_token in tokens:
        token = clean_text(raw_token)
        if not token:
            continue

        if LOT_NUMBER_RE.match(token):
            if current_row:
                rows.append(current_row)
            current_row = [token]
            continue

        if current_row is not None:
            current_row.append(token)

    if current_row:
        rows.append(current_row)
    return rows


def assign_headings(rows: list[list[str]], raw_headings: list[Any]) -> list[tuple[HeadingMeta | None, list[str]]]:
    headings = [meta for meta in (standardize_category(clean_text(heading)) for heading in raw_headings) if meta]
    if not headings:
        return [(None, row) for row in rows]

    assigned_rows: list[tuple[HeadingMeta | None, list[str]]] = []
    current_index = 0
    current_heading = headings[0]

    for row in rows:
        lot_code = code_from_lot_number(row[0])
        selected = current_heading

        if lot_code and current_heading.code != lot_code:
            for index in range(current_index, len(headings)):
                if headings[index].code == lot_code:
                    current_index = index
                    current_heading = headings[index]
                    selected = current_heading
                    break
        assigned_rows.append((selected, row))

    return assigned_rows


def parse_decimal(value: str) -> float:
    return float(value.replace(",", ""))


def parse_int(value: str) -> int:
    return int(value.replace(",", ""))


def parse_price_token(token: str, year: int) -> tuple[float, str, bool] | None:
    lowered = token.lower()
    if WEIGHT_RE.search(token) and all(marker not in lowered for marker in ("$", "usd", "/lb", "/kg", "per lb", "per kg")):
        return None

    match = PRICE_VALUE_RE.search(token)
    if not match:
        return None

    value = parse_decimal(match.group(1))
    inferred = False
    if "/kg" in lowered or "per kg" in lowered or "usd/kg" in lowered:
        unit = "USD_PER_KG"
    elif "/lb" in lowered or "per lb" in lowered or "usd/lb" in lowered:
        unit = "USD_PER_LB"
    else:
        unit = "USD_PER_KG" if year >= 2023 else "USD_PER_LB"
        inferred = True
    return value, unit, inferred


def parse_weight_token(token: str) -> tuple[float, str] | None:
    match = WEIGHT_RE.search(token)
    if not match:
        return None

    value = parse_decimal(match.group(1))
    unit_token = match.group(2).lower()
    if unit_token.startswith("lb") or unit_token.startswith("pound"):
        unit = "LB"
    else:
        unit = "KG"
    return value, unit


def parse_score_token(token: str) -> float | None:
    if any(marker in token.lower() for marker in ("$", "kg", "lb", "bid")):
        return None

    match = SCORE_RE.search(token)
    if not match:
        return None

    score = float(match.group(1))
    if 80.0 <= score <= 100.0:
        return score
    return None


def parse_bags_token(token: str) -> int | None:
    normalized = token.replace(",", "")
    if not INTEGER_RE.match(normalized):
        return None
    value = int(normalized)
    if 0 < value < 1000:
        return value
    return None


def parse_total_bids_token(token: str) -> int | None:
    lowered = token.lower()
    if "bid" in lowered:
        match = re.search(r"(\d[\d,]*)", lowered)
        return parse_int(match.group(1)) if match else None
    if INTEGER_RE.match(token.replace(",", "")):
        value = parse_int(token)
        if 0 <= value <= 10000:
            return value
    return None


def locate_special_indices(tokens: list[str], year: int) -> dict[str, int]:
    indices: dict[str, int] = {}

    search_end = len(tokens) - 1
    if year >= 2024 and tokens:
        total_bids = parse_total_bids_token(tokens[-1])
        if total_bids is not None:
            indices["total_bids"] = len(tokens) - 1
            search_end -= 1

    for index in range(search_end, -1, -1):
        if parse_price_token(tokens[index], year):
            indices["price"] = index
            break

    if "price" in indices:
        for index in range(indices["price"] - 1, -1, -1):
            if parse_weight_token(tokens[index]):
                indices["weight"] = index
                break

    score_search_end = indices.get("weight", indices.get("price", len(tokens))) - 1
    for index in range(score_search_end, -1, -1):
        if parse_score_token(tokens[index]) is not None:
            indices["score"] = index
            break

    if year <= 2018 and "weight" in indices:
        for index in range(indices["weight"] - 1, -1, -1):
            if parse_bags_token(tokens[index]) is not None:
                indices["bags"] = index
                break

    return indices


def assign_text_columns(
    year: int,
    text_tokens: list[str],
    heading: HeadingMeta | None,
) -> tuple[str | None, str | None, str | None, str | None, str | None, list[str]]:
    tokens = [token for token in text_tokens if token and not looks_like_header(token)]
    if not tokens:
        return None, None, None, heading.variety if heading else None, heading.processing_method if heading else None, []

    lot_title = tokens[0] if len(tokens) >= 1 else None
    producer = tokens[1] if len(tokens) >= 2 else None
    region = tokens[2] if len(tokens) >= 3 else None
    remainder = tokens[3:]
    variety = heading.variety if heading else None
    processing_method = heading.processing_method if heading else None
    extras: list[str] = []

    for token in remainder:
        if processing_method is None and looks_like_process(token):
            processing_method = token
        elif variety is None and looks_like_variety(token):
            variety = token
        elif variety is None:
            variety = token
        elif processing_method is None:
            processing_method = token
        else:
            extras.append(token)

    if year >= 2024 and heading:
        variety = variety or heading.variety
        processing_method = processing_method or heading.processing_method

    return lot_title, producer, region, variety, processing_method, extras


def parse_row(
    year: int,
    path: str,
    auction_title: str | None,
    heading: HeadingMeta | None,
    row: list[str],
) -> AuctionLotRecord:
    payload_tokens = [token for token in row[1:] if token and not looks_like_header(token)]
    indices = locate_special_indices(payload_tokens, year)
    reserved = set(indices.values())

    price_value: float | None = None
    price_unit: str | None = None
    price_unit_inferred = False
    price_text: str | None = None
    if "price" in indices:
        price_text = payload_tokens[indices["price"]]
        parsed_price = parse_price_token(price_text, year)
        if parsed_price:
            price_value, price_unit, price_unit_inferred = parsed_price

    weight_value: float | None = None
    weight_unit: str | None = None
    weight_text: str | None = None
    if "weight" in indices:
        weight_text = payload_tokens[indices["weight"]]
        parsed_weight = parse_weight_token(weight_text)
        if parsed_weight:
            weight_value, weight_unit = parsed_weight

    score_value: float | None = None
    score_text: str | None = None
    if "score" in indices:
        score_text = payload_tokens[indices["score"]]
        score_value = parse_score_token(score_text)

    bags_value: int | None = None
    bags_text: str | None = None
    if "bags" in indices:
        bags_text = payload_tokens[indices["bags"]]
        bags_value = parse_bags_token(bags_text)

    total_bids: int | None = None
    if "total_bids" in indices:
        total_bids = parse_total_bids_token(payload_tokens[indices["total_bids"]])

    text_tokens = [token for index, token in enumerate(payload_tokens) if index not in reserved]
    lot_title, producer, region, variety, processing_method, extra_tokens = assign_text_columns(year, text_tokens, heading)

    return AuctionLotRecord(
        source_path=path,
        year=year,
        auction_title=auction_title,
        category_heading=heading.raw if heading else None,
        category_code=(heading.code if heading and heading.code else code_from_lot_number(row[0])),
        lot_number=row[0],
        lot_title=lot_title,
        producer=producer,
        region=region,
        variety=variety,
        processing_method=processing_method,
        score=score_value,
        score_text=score_text,
        bags=bags_value,
        bags_text=bags_text,
        weight=weight_value,
        weight_unit=weight_unit,
        weight_text=weight_text,
        price=price_value,
        price_unit=price_unit,
        price_unit_inferred=price_unit_inferred,
        price_text=price_text,
        total_bids=total_bids,
        extra_tokens=extra_tokens,
        raw_tokens=row,
    )


def parse_page(path: str, year: int, entry: dict[str, Any]) -> list[AuctionLotRecord]:
    raw_tokens = entry.get("p") or []
    if not isinstance(raw_tokens, list):
        return []

    auction_title = clean_text(entry.get("h1"))
    rows = parse_rows(raw_tokens)
    row_assignments = assign_headings(rows, entry.get("h2") or [])

    records: list[AuctionLotRecord] = []
    for heading, row in row_assignments:
        records.append(parse_row(year, path, auction_title, heading, row))
    return records


def save_records(records: list[AuctionLotRecord]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps([record.model_dump(mode="json") for record in records], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> int:
    try:
        payload = fetch_search_index()
        pages = extract_pages(payload)
    except (httpx.HTTPError, ValueError) as exc:
        print(f"Failed to fetch Best of Panama auction data: {exc}", file=sys.stderr)
        return 1

    records: list[AuctionLotRecord] = []
    for path, year, entry in pages:
        try:
            records.extend(parse_page(path, year, entry))
        except Exception as exc:
            print(f"Skipping auction page {path}: {exc}", file=sys.stderr)

    records.sort(key=lambda item: (item.year, item.lot_number))

    try:
        save_records(records)
    except OSError as exc:
        print(f"Failed to write {OUTPUT_PATH}: {exc}", file=sys.stderr)
        return 1

    counts = Counter(record.year for record in records)
    summary = ", ".join(f"{year}: {counts[year]}" for year in sorted(counts))
    print(f"Saved {len(records)} Best of Panama lots to {OUTPUT_PATH}")
    print(f"Lots per year: {summary}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
