#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

import httpx
from bs4 import BeautifulSoup
from pydantic import BaseModel, Field

API_URL = "https://scap-panama.com/wp-json/wp/v2/posts?categories=3&per_page=100"
SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = SCRIPT_DIR / "output"
OUTPUT_PATH = OUTPUT_DIR / "scap_farms_raw.json"
USER_AGENT = "panama-coffee-atlas/1.0 (+https://github.com/)"

FIELD_PATTERNS: dict[str, str] = {
    "producer": r"(?:Producer|Contact|Productor)[\s:*]+([^\n*\[<]+)",
    "elevation": r"(?:Elevation|Altitud|Elevaci[oó]n)[:\s*]+([^\n*<]+)",
    "varieties": r"(?:Varieties|Variedades|Varietals)[:\s*]+([^\n*<]+)",
    "region": r"(?:Region|Regi[oó]n|Location|Ubicaci[oó]n)[:\s*]+([^\n*<]+)",
    "email": r"[\w.-]+@[\w.-]+\.\w+",
    "instagram": r"(?:Instagram|IG)[:\s@*]+([^\s\n,<]+)",
    "website": r"(?:Website|Web|www\.)[:\s]*((?:https?://)?[\w.-]+\.[a-z]{2,}[^\s<]*)",
    "processing_methods": r"(?:Processing(?:\s+Methods?)?|Process(?:ing)?|Proceso|Procesamiento)[:\s*]+([^\n*<]+)",
}
ELEVATION_RE = re.compile(
    r"(\d[\d,]*)\s*[-–—to\s]+\s*(\d[\d,]*)\s*(?:m\.?a\.?s\.?l\.?|masl|msnm|m)",
    re.IGNORECASE,
)
SINGLE_ELEVATION_RE = re.compile(
    r"(\d[\d,]*)\s*(?:m\.?a\.?s\.?l\.?|masl|msnm|m)\b",
    re.IGNORECASE,
)
PHONE_RE = re.compile(r"(?:\+?\d[\d().\-\s]{6,}\d)")
COMPILED_FIELD_PATTERNS = {
    name: re.compile(pattern, re.IGNORECASE) for name, pattern in FIELD_PATTERNS.items()
}


class ScapFarmRecord(BaseModel):
    post_id: int
    farm_name: str
    slug: str
    post_url: str | None = None
    featured_image_url: str | None = None
    producer: str | None = None
    region: str | None = None
    elevation_text: str | None = None
    elevation_min_masl: int | None = None
    elevation_max_masl: int | None = None
    varieties: str | None = None
    processing_methods: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    instagram: str | None = None
    source: dict[str, Any] = Field(default_factory=dict)


def clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = re.sub(r"\s+", " ", value.replace("\xa0", " ")).strip(" \t\r\n:|-")
    return cleaned or None


def parse_number(value: str) -> int:
    return int(value.replace(",", ""))


def parse_title(rendered_title: str) -> str:
    soup = BeautifulSoup(rendered_title, "html.parser")
    return clean_text(soup.get_text(" ", strip=True)) or "Untitled Farm"


def build_search_text(soup: BeautifulSoup) -> str:
    lines: list[str] = []

    for table in soup.select("figure.wp-block-table table, table"):
        for row in table.select("tr"):
            cells = [clean_text(cell.get_text(" ", strip=True)) for cell in row.find_all(["th", "td"])]
            cells = [cell for cell in cells if cell]
            if len(cells) >= 2:
                lines.append(f"{cells[0]}: {' | '.join(cells[1:])}")

    for node in soup.select("p, li"):
        text = clean_text(node.get_text(" ", strip=True))
        if not text:
            continue

        label_node = node.find(["strong", "b"])
        if label_node:
            label = clean_text(label_node.get_text(" ", strip=True))
            if label:
                label = label.rstrip(":")
                value = clean_text(text.removeprefix(label_node.get_text(" ", strip=True)).lstrip(" :"))
                if value:
                    lines.append(f"{label}: {value}")
                    continue

        if ":" in text and len(text.split(":", 1)[0]) <= 40:
            lines.append(text)

    full_text = clean_text(soup.get_text("\n", strip=True))
    if full_text:
        lines.append(full_text)

    return "\n".join(dict.fromkeys(lines))


def parse_elevation_range(elevation_text: str | None) -> tuple[int | None, int | None]:
    if not elevation_text:
        return None, None

    range_match = ELEVATION_RE.search(elevation_text)
    if range_match:
        low = parse_number(range_match.group(1))
        high = parse_number(range_match.group(2))
        return min(low, high), max(low, high)

    singles = [parse_number(match.group(1)) for match in SINGLE_ELEVATION_RE.finditer(elevation_text)]
    if not singles:
        return None, None
    return min(singles), max(singles)


def extract_featured_image(post: dict[str, Any], soup: BeautifulSoup) -> str | None:
    featured = post.get("rttpg_featured_image_url")
    if isinstance(featured, dict):
        large = featured.get("large")
        if isinstance(large, list) and large:
            return clean_text(str(large[0]))
        for value in featured.values():
            if isinstance(value, list) and value:
                candidate = clean_text(str(value[0]))
                if candidate and candidate.startswith("http"):
                    return candidate
            if isinstance(value, str) and value.startswith("http"):
                return clean_text(value)
    elif isinstance(featured, str) and featured.startswith("http"):
        return clean_text(featured)

    image = soup.find("img")
    if image and image.get("src"):
        return clean_text(str(image["src"]))
    return None


def extract_anchor_fallbacks(soup: BeautifulSoup) -> dict[str, str | None]:
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    instagram: str | None = None

    for anchor in soup.find_all("a", href=True):
        href = clean_text(str(anchor["href"]))
        if not href:
            continue

        if href.startswith("mailto:") and not email:
            email = clean_text(href.removeprefix("mailto:"))
        elif href.startswith("tel:") and not phone:
            phone = clean_text(href.removeprefix("tel:"))
        elif "instagram.com" in href and not instagram:
            handle = href.rstrip("/").split("/")[-1]
            instagram = clean_text(handle or href)
        elif href.startswith("http") and "scap-panama.com" not in href and not website:
            website = href

    return {
        "email": email,
        "phone": phone,
        "website": website,
        "instagram": instagram,
    }


def extract_field(name: str, search_text: str) -> str | None:
    pattern = COMPILED_FIELD_PATTERNS[name]
    match = pattern.search(search_text)
    if not match:
        return None

    if name == "email":
        return clean_text(match.group(0))
    if name in {"instagram", "website"} and match.lastindex is None:
        return clean_text(match.group(0))
    return clean_text(match.group(1) if match.lastindex else match.group(0))


def normalize_website(value: str | None) -> str | None:
    if not value:
        return None
    if value.startswith(("http://", "https://")):
        return value
    return f"https://{value}"


def normalize_instagram(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = value.strip().lstrip("@").rstrip("/")
    if "instagram.com" in cleaned:
        cleaned = cleaned.split("instagram.com/")[-1].strip("/")
    return clean_text(cleaned)


def extract_post_record(post: dict[str, Any]) -> ScapFarmRecord:
    content_html = str(post.get("content", {}).get("rendered", ""))
    soup = BeautifulSoup(content_html, "html.parser")
    search_text = build_search_text(soup)
    fallbacks = extract_anchor_fallbacks(soup)

    elevation_text = extract_field("elevation", search_text)
    min_masl, max_masl = parse_elevation_range(elevation_text)

    phone_match = PHONE_RE.search(search_text)
    phone = clean_text(phone_match.group(0)) if phone_match else None

    return ScapFarmRecord(
        post_id=int(post.get("id", 0)),
        farm_name=parse_title(str(post.get("title", {}).get("rendered", ""))),
        slug=clean_text(str(post.get("slug", ""))) or f"post-{post.get('id', 'unknown')}",
        post_url=clean_text(str(post.get("link", ""))) or None,
        featured_image_url=extract_featured_image(post, soup),
        producer=extract_field("producer", search_text),
        region=extract_field("region", search_text),
        elevation_text=elevation_text,
        elevation_min_masl=min_masl,
        elevation_max_masl=max_masl,
        varieties=extract_field("varieties", search_text),
        processing_methods=extract_field("processing_methods", search_text),
        email=extract_field("email", search_text) or fallbacks["email"],
        phone=phone or fallbacks["phone"],
        website=normalize_website(extract_field("website", search_text) or fallbacks["website"]),
        instagram=normalize_instagram(extract_field("instagram", search_text) or fallbacks["instagram"]),
        source={
            "api_url": API_URL,
            "post_date": post.get("date"),
            "content_html": content_html,
        },
    )


def fetch_posts() -> list[dict[str, Any]]:
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    with httpx.Client(headers=headers, follow_redirects=True, timeout=30.0) as client:
        response = client.get(API_URL)
        response.raise_for_status()
        payload = response.json()

    if not isinstance(payload, list):
        raise ValueError("SCAP API returned an unexpected payload; expected a list of posts.")
    return payload


def save_records(records: list[ScapFarmRecord]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps([record.model_dump(mode="json") for record in records], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> int:
    try:
        posts = fetch_posts()
    except (httpx.HTTPError, ValueError) as exc:
        print(f"Failed to fetch SCAP posts: {exc}", file=sys.stderr)
        return 1

    records: list[ScapFarmRecord] = []
    for post in posts:
        try:
            records.append(extract_post_record(post))
        except Exception as exc:
            post_id = post.get("id", "unknown")
            print(f"Skipping SCAP post {post_id}: {exc}", file=sys.stderr)

    try:
        save_records(records)
    except OSError as exc:
        print(f"Failed to write {OUTPUT_PATH}: {exc}", file=sys.stderr)
        return 1

    print(f"Saved {len(records)} SCAP farm profiles to {OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
