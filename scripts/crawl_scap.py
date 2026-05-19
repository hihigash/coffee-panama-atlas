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
PRODUCER_GROUP_OUTPUT_PATH = OUTPUT_DIR / "scap_producer_groups_raw.json"
FARM_OUTPUT_PATH = OUTPUT_DIR / "scap_farms_raw.json"
USER_AGENT = "panama-coffee-atlas/1.0 (+https://github.com/)"

FIELD_PATTERNS: dict[str, str] = {
    "producer": r"(?:Producer|Owner|Contact|Productor)[\s:*]+([^\n*\[<]+)",
    "elevation": r"(?:Elevation|Altitud|Elevaci[oó]n|Growing altitude)[:\s*]+([^\n*<]+)",
    "varieties": r"(?:Varieties|Variedades|Varietals|Varietal)[:\s*]+([^\n*<]+)",
    "region": r"(?:Growing Region|Region|Regi[oó]n|Location|Ubicaci[oó]n)[:\s*]+([^\n*<]+)",
    "email": r"[\w.-]+@[\w.-]+\.\w+",
    "instagram": r"(?:Instagram|IG)[:\s@*]+([^\s\n,<]+)",
    "website": r"(?:Website|Web|www\.)[:\s]*((?:https?://)?[\w.-]+\.[a-z]{2,}[^\s<]*)",
    "processing_methods": r"(?:Processing(?:\s+Methods?)?|Process(?:ing)?|Proceso|Procesamiento)[:\s*]+([^\n*<]+)",
}
ELEVATION_RE = re.compile(
    r"(\d[\d,]*)\s*(?:m\.?a\.?s\.?l\.?|masl|msnm|m)?\s*[-–—to\s]+\s*(\d[\d,]*)\s*(?:m\.?a\.?s\.?l\.?|masl|msnm|m)\b",
    re.IGNORECASE,
)
SINGLE_ELEVATION_RE = re.compile(
    r"(\d[\d,]*)\s*(?:m\.?a\.?s\.?l\.?|masl|msnm|m)\b",
    re.IGNORECASE,
)
PHONE_RE = re.compile(r"(?:\+?\d[\d().\-\s]{6,}\d)")
YEAR_RE = re.compile(r"\b(19\d{2}|20\d{2})\b")
COMPILED_FIELD_PATTERNS = {
    name: re.compile(pattern, re.IGNORECASE) for name, pattern in FIELD_PATTERNS.items()
}

VARIETY_LABELS: list[tuple[str, tuple[str, ...]]] = [
    ("Gesha", ("gesha", "geisha")),
    ("Pacamara", ("pacamara",)),
    ("Catuai", ("catuai", "catuari")),
    ("Caturra", ("caturra",)),
    ("Typica", ("typica", "tipica", "typica mejorado")),
    ("Bourbon", ("bourbon",)),
    ("Maragogipe", ("maragogipe", "maragogype")),
    ("Mundo Novo", ("mundo novo", "mundonovo")),
    ("Java", ("java",)),
    ("SL-28", ("sl28", "sl-28")),
    ("SL-34", ("sl34", "sl-34")),
    ("Laurina", ("laurina",)),
    ("Ethiopian Landrace", ("ethiopian wild", "ethiopian wild varieties", "ethiopia landrace")),
]
PROCESSING_LABELS: list[tuple[str, tuple[str, ...]]] = [
    ("Anaerobic Natural", ("anaerobic natural",)),
    ("Anaerobic Washed", ("anaerobic washed",)),
    ("Carbonic Maceration", ("carbonic", "carbonic maceration")),
    ("Black Honey", ("black honey",)),
    ("Red Honey", ("red honey",)),
    ("Yellow Honey", ("yellow honey",)),
    ("White Honey", ("white honey",)),
    ("Honey", ("honey",)),
    ("Washed", ("washed", "lavado")),
    ("Natural", ("natural", "seco")),
    ("Lactic Fermentation", ("lactic", "lactic fermentation")),
    ("NT Yeast", ("nt yeast",)),
]
FARM_SECTION_MARKERS = {"our farms", "farms"}
NON_FARM_HEADINGS = {
    "acknowledgments",
    "coffee plantations",
    "environment",
    "beneficio",
    "cup character",
    "tour the farm",
}
FIELD_HEADING_PREFIXES = (
    "producer",
    "owner",
    "contact",
    "varietal",
    "varieties",
    "process",
    "processing",
    "growing region",
    "growing altitude",
    "rainfall",
    "temperature",
    "url",
    "dates of harvest",
    "email",
    "website",
    "instagram",
    "facebook",
    "tel",
)
BLOCK_NAME_PATTERNS = [
    re.compile(r"names such as ([^.]+)", re.IGNORECASE),
    re.compile(r"(?:blocks?|lots?) (?:named|such as) ([^.]+)", re.IGNORECASE),
]
LOCATION_PATTERNS = [
    re.compile(r"(?:Growing Region|Location|Region|Ubicaci[oó]n)[:\s]+([^\n.]+)", re.IGNORECASE),
    re.compile(r"(?:is located in|located in|located at)\s+([^.;]+)", re.IGNORECASE),
    re.compile(r"(?:north eastern side of|northern side of|western side of|south -western side of|south-western side of)\s+([^.;]+)", re.IGNORECASE),
]
ESTABLISHED_PATTERNS = [
    re.compile(r"\b(?:established|founded|since|holdings since|newest .* since)\s+(?:in\s+)?(19\d{2}|20\d{2})\b", re.IGNORECASE),
]
FARM_SIZE_PATTERNS = [
    re.compile(r"(?:total of|around|about|approximately|roughly)\s+(\d+(?:\.\d+)?)\s*(?:ha|hectares?)\b", re.IGNORECASE),
    re.compile(r"(\d+(?:\.\d+)?)\s*[- ]hectare\b", re.IGNORECASE),
    re.compile(r"(\d+(?:\.\d+)?)\s*(?:ha|hectares?)\b", re.IGNORECASE),
]


class ContentBlock(BaseModel):
    tag: str
    level: int | None = None
    text: str


class ScapFarmBlockRecord(BaseModel):
    name: str
    altitude_text: str | None = None
    varieties: list[str] = Field(default_factory=list)
    notes: str | None = None


class ScapProducerGroupRecord(BaseModel):
    post_id: int
    producer_group_name: str
    slug: str
    post_url: str | None = None
    featured_image_url: str | None = None
    region: str | None = None
    description: str | None = None
    principals: list[str] = Field(default_factory=list)
    established: int | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    instagram: str | None = None
    farm_names: list[str] = Field(default_factory=list)
    source: dict[str, Any] = Field(default_factory=dict)


class ScapFarmRecord(BaseModel):
    post_id: int
    producer_group_name: str
    producer_group_slug: str
    farm_name: str
    farm_slug: str
    post_url: str | None = None
    featured_image_url: str | None = None
    region: str | None = None
    sub_region: str | None = None
    elevation_text: str | None = None
    elevation_min_masl: int | None = None
    elevation_max_masl: int | None = None
    varieties: list[str] = Field(default_factory=list)
    processing_methods: list[str] = Field(default_factory=list)
    cup_character: str | None = None
    description: str | None = None
    blocks: list[ScapFarmBlockRecord] = Field(default_factory=list)
    farm_size_ha: float | None = None
    established: int | None = None
    source: dict[str, Any] = Field(default_factory=dict)


def clean_text(value: Any) -> str | None:
    if value is None:
        return None
    cleaned = re.sub(r"\s+", " ", str(value).replace("\xa0", " ")).strip(" \t\r\n:|-")
    return cleaned or None


def normalize_label(value: str | None) -> str:
    text = clean_text(value)
    if not text:
        return ""
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def slugify(value: str) -> str:
    text = clean_text(value) or "item"
    ascii_text = text.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-") or "item"


def dedupe_preserve(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        cleaned = clean_text(value)
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            result.append(cleaned)
    return result


def split_multi_value(value: Any) -> list[str]:
    text = clean_text(value)
    if not text:
        return []
    parts = re.split(r"\s*(?:,|/|;|\||\band\b|&|\+)\s*", text, flags=re.IGNORECASE)
    return [part for part in (clean_text(part) for part in parts) if part]


def parse_number(value: str) -> int:
    return int(value.replace(",", ""))


def normalize_elevation_bound(low: int, high: int) -> tuple[int, int]:
    if high > 4000 and low <= 2500:
        reduced = high // 10
        if low <= reduced <= 2500:
            high = reduced
    return min(low, high), max(low, high)


def parse_elevation_range(elevation_text: str | None) -> tuple[int | None, int | None]:
    if not elevation_text:
        return None, None

    normalized = re.sub(r"/\s*[\d,]+\s*(?:ft|feet)\b", "", elevation_text, flags=re.IGNORECASE)
    range_match = ELEVATION_RE.search(normalized)
    if range_match:
        low = parse_number(range_match.group(1))
        high = parse_number(range_match.group(2))
        return normalize_elevation_bound(low, high)

    singles = [parse_number(match.group(1)) for match in SINGLE_ELEVATION_RE.finditer(normalized)]
    if not singles:
        return None, None
    return min(singles), max(singles)


def parse_title(rendered_title: str) -> str:
    soup = BeautifulSoup(rendered_title, "html.parser")
    return clean_text(soup.get_text(" ", strip=True)) or "Untitled Producer Group"


def build_content_blocks(soup: BeautifulSoup) -> list[ContentBlock]:
    blocks: list[ContentBlock] = []

    for table in soup.select("figure.wp-block-table table, table"):
        for row in table.select("tr"):
            cells = [clean_text(cell.get_text(" ", strip=True)) for cell in row.find_all(["th", "td"])]
            cells = [cell for cell in cells if cell]
            if len(cells) >= 2:
                blocks.append(ContentBlock(tag="tr", text=f"{cells[0]}: {' | '.join(cells[1:])}"))

    for node in soup.select("h1, h2, h3, h4, p, li"):
        text = clean_text(node.get_text(" ", strip=True))
        if not text or text.lower() == "default":
            continue
        level = int(node.name[1]) if node.name.startswith("h") else None
        block = ContentBlock(tag=node.name, level=level, text=text)
        if not blocks or blocks[-1].text != block.text or blocks[-1].tag != block.tag:
            blocks.append(block)

    return blocks


def build_search_text(blocks: list[ContentBlock]) -> str:
    return "\n".join(dict.fromkeys(block.text for block in blocks if block.text))


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


def extract_year(value: str | None) -> int | None:
    text = clean_text(value)
    if not text:
        return None
    for pattern in ESTABLISHED_PATTERNS:
        match = pattern.search(text)
        if match:
            return int(match.group(1))
    year_match = YEAR_RE.search(text)
    return int(year_match.group(1)) if year_match else None


def looks_like_contact_line(text: str) -> bool:
    normalized = normalize_label(text)
    return (
        bool(PHONE_RE.search(text))
        or "@" in text
        or "www." in text.lower()
        or normalized.startswith(("tel", "email", "website", "instagram", "facebook", "tour the farm"))
    )


def build_description(blocks: list[ContentBlock], max_blocks: int | None = None) -> str | None:
    lines: list[str] = []
    for block in blocks:
        if looks_like_contact_line(block.text):
            continue
        if len(block.text) < 4:
            continue
        lines.append(block.text)
        if max_blocks is not None and len(lines) >= max_blocks:
            break
    return clean_text(" ".join(dedupe_preserve(lines)))


def extract_value_labels(text: str, patterns: list[tuple[str, tuple[str, ...]]]) -> list[str]:
    normalized_text = normalize_label(text)
    matches: list[str] = []
    for label, keywords in patterns:
        if any(keyword in normalized_text for keyword in keywords):
            matches.append(label)
    return dedupe_preserve(matches)


def extract_varieties(text: str) -> list[str]:
    field_value = extract_field("varieties", text)
    if field_value:
        explicit_values = dedupe_preserve(split_multi_value(field_value))
        inferred = extract_value_labels(field_value, VARIETY_LABELS)
        return inferred or explicit_values
    return extract_value_labels(text, VARIETY_LABELS)


def extract_processing_methods(text: str) -> list[str]:
    field_value = extract_field("processing_methods", text)
    if field_value:
        explicit_values = dedupe_preserve(split_multi_value(field_value))
        inferred = extract_value_labels(field_value, PROCESSING_LABELS)
        return inferred or explicit_values
    return extract_value_labels(text, PROCESSING_LABELS)


def extract_elevation_text(text: str) -> str | None:
    labeled = extract_field("elevation", text)
    if labeled:
        return labeled
    normalized = re.sub(r"/\s*[\d,]+\s*(?:ft|feet)\b", "", text, flags=re.IGNORECASE)
    range_match = ELEVATION_RE.search(normalized)
    if range_match:
        return clean_text(range_match.group(0))
    single_match = SINGLE_ELEVATION_RE.search(normalized)
    return clean_text(single_match.group(0)) if single_match else None


def clean_location_text(value: str | None) -> str | None:
    text = clean_text(value)
    if not text:
        return None
    text = re.split(r"\b(?:between|that|which|where|with|and has|and is)\b", text, maxsplit=1, flags=re.IGNORECASE)[0]
    return clean_text(text.rstrip(",.;"))


def extract_location_text(text: str) -> str | None:
    labeled = extract_field("region", text)
    if labeled:
        return clean_location_text(labeled)
    for pattern in LOCATION_PATTERNS:
        match = pattern.search(text)
        if match:
            return clean_location_text(match.group(1))
    return None


def extract_sub_region(location_text: str | None) -> str | None:
    text = clean_text(location_text)
    if not text:
        return None
    parts = [part for part in (clean_text(part) for part in re.split(r",|/|;|\|", text)) if part]
    skip_labels = {"boquete", "volcan", "tierras altas", "renacimiento", "chiriqui", "panama"}
    for part in reversed(parts):
        if normalize_label(part) not in skip_labels and not normalize_label(part).isdigit():
            return part
    return parts[0] if parts else text


def extract_farm_size(text: str) -> float | None:
    for pattern in FARM_SIZE_PATTERNS:
        match = pattern.search(text)
        if match:
            return float(match.group(1))
    return None


def extract_principals(search_text: str, intro_blocks: list[ContentBlock], producer_group_name: str) -> list[str]:
    principals: list[str] = []
    explicit = extract_field("producer", search_text)
    if explicit:
        principals.append(explicit)

    ownership_match = re.search(r"owned by (?:the )?([^.,]+)", search_text, re.IGNORECASE)
    if ownership_match:
        principals.append(ownership_match.group(1))

    group_label = normalize_label(producer_group_name)
    for block in intro_blocks[:3]:
        text = block.text
        if ":" in text or looks_like_contact_line(text):
            continue
        if normalize_label(text) == group_label:
            continue
        if 1 <= len(text.split()) <= 4 and re.fullmatch(r"[A-Za-zÁÉÍÓÚÑáéíóúñ.'’\- ]+", text):
            principals.append(text)
            break

    return dedupe_preserve(principals)


def split_named_farms(value: str | None) -> list[str]:
    text = clean_text(value)
    if not text:
        return []
    parts = re.split(r"\s*(?:,|/|;|\band\b|&)\s*", text, flags=re.IGNORECASE)
    names: list[str] = []
    for part in parts:
        candidate = clean_text(part)
        if not candidate:
            continue
        if len(candidate.split()) > 6:
            continue
        if re.search(r"\b(goal|quality|production|harmony|micromanaged|balance|using|we|our)\b", candidate, re.IGNORECASE):
            continue
        if not re.search(r"[A-Za-z]", candidate):
            continue
        names.append(candidate)
    return dedupe_preserve(names)


def extract_listed_farm_names(search_text: str, blocks: list[ContentBlock]) -> list[str]:
    names: list[str] = []

    owner_match = re.search(r"owner of the ([^.]+?) coffee", search_text, re.IGNORECASE)
    if owner_match:
        names.extend(split_named_farms(owner_match.group(1)))

    for block in blocks:
        if normalize_label(block.text).startswith("farms") and ":" in block.text:
            names.extend(split_named_farms(block.text.split(":", 1)[1]))

    return dedupe_preserve(names)


def is_farm_heading(block: ContentBlock, in_farm_area: bool) -> bool:
    text = clean_text(block.text)
    if not text:
        return False

    normalized = normalize_label(text.rstrip(":"))
    if normalized in FARM_SECTION_MARKERS or normalized in NON_FARM_HEADINGS:
        return False
    if any(normalized.startswith(prefix) for prefix in FIELD_HEADING_PREFIXES):
        return False

    short_heading = len(text.split()) <= 6
    has_farm_keyword = any(keyword in normalized for keyword in ("farm", "estate", "finca", "hacienda"))
    all_caps = text.upper() == text and re.search(r"[A-Z]", text) is not None
    colon_heading = text.endswith(":")
    heading_tag = block.tag.startswith("h")

    if has_farm_keyword and short_heading:
        return True
    if heading_tag and in_farm_area and short_heading:
        return True
    if colon_heading and short_heading and (all_caps or in_farm_area or heading_tag):
        return True
    return False


def extract_farm_sections(blocks: list[ContentBlock]) -> list[dict[str, Any]]:
    sections: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    in_farm_area = False

    for index, block in enumerate(blocks):
        normalized = normalize_label(block.text)
        if normalized in FARM_SECTION_MARKERS:
            in_farm_area = True
            continue

        if is_farm_heading(block, in_farm_area):
            current = {
                "name": clean_text(block.text.rstrip(":")) or block.text,
                "start_index": index,
                "blocks": [],
            }
            sections.append(current)
            in_farm_area = True
            continue

        if current is not None:
            current["blocks"].append(block)

    return sections


def extract_cup_character(blocks: list[ContentBlock]) -> str | None:
    for index, block in enumerate(blocks):
        if normalize_label(block.text) != "cup character":
            continue
        notes: list[str] = []
        for follow in blocks[index + 1 :]:
            normalized = normalize_label(follow.text)
            if normalized in FARM_SECTION_MARKERS or is_farm_heading(follow, True):
                break
            if any(normalized.startswith(prefix) for prefix in FIELD_HEADING_PREFIXES if prefix != "cup character"):
                if notes:
                    break
                continue
            notes.append(follow.text)
        return clean_text(" ".join(notes))
    return None


def extract_block_names(text: str) -> list[ScapFarmBlockRecord]:
    block_records: list[ScapFarmBlockRecord] = []
    for pattern in BLOCK_NAME_PATTERNS:
        for match in pattern.finditer(text):
            for name in split_named_farms(match.group(1)):
                block_records.append(ScapFarmBlockRecord(name=name))
    return block_records


def extract_post_records(post: dict[str, Any]) -> tuple[ScapProducerGroupRecord, list[ScapFarmRecord]]:
    content_html = str(post.get("content", {}).get("rendered", ""))
    soup = BeautifulSoup(content_html, "html.parser")
    blocks = build_content_blocks(soup)
    search_text = build_search_text(blocks)
    fallbacks = extract_anchor_fallbacks(soup)
    title = parse_title(str(post.get("title", {}).get("rendered", "")))
    slug = clean_text(str(post.get("slug", ""))) or f"post-{post.get('id', 'unknown')}"
    featured_image_url = extract_featured_image(post, soup)
    farm_sections = extract_farm_sections(blocks)
    listed_farm_names = extract_listed_farm_names(search_text, blocks)

    if farm_sections:
        intro_limit = farm_sections[0]["start_index"]
        intro_blocks = blocks[:intro_limit]
    else:
        intro_blocks = blocks[:4]

    group_region = extract_location_text(search_text)
    phone_match = PHONE_RE.search(search_text)
    phone = clean_text(phone_match.group(0)) if phone_match else None

    farm_specs: list[tuple[str, list[ContentBlock], str]] = []
    if len(farm_sections) >= 2:
        farm_specs.extend((section["name"], section["blocks"], "section") for section in farm_sections)
        known_section_names = {normalize_label(section["name"]) for section in farm_sections}
        for farm_name in listed_farm_names:
            if normalize_label(farm_name) not in known_section_names:
                farm_specs.append((farm_name, blocks, "list"))
    elif len(listed_farm_names) >= 2:
        farm_specs.extend((farm_name, blocks, "list") for farm_name in listed_farm_names)
    elif len(farm_sections) == 1:
        farm_specs.append((farm_sections[0]["name"], farm_sections[0]["blocks"] or blocks, "section"))
    else:
        farm_specs.append((title, blocks, "single"))

    producer_group = ScapProducerGroupRecord(
        post_id=int(post.get("id", 0)),
        producer_group_name=title,
        slug=slug,
        post_url=clean_text(str(post.get("link", ""))) or None,
        featured_image_url=featured_image_url,
        region=group_region,
        description=build_description(intro_blocks, max_blocks=3) or build_description(blocks, max_blocks=3),
        principals=extract_principals(search_text, intro_blocks, title),
        established=extract_year(build_description(intro_blocks) or search_text),
        email=extract_field("email", search_text) or fallbacks["email"],
        phone=phone or fallbacks["phone"],
        website=normalize_website(extract_field("website", search_text) or fallbacks["website"]),
        instagram=normalize_instagram(extract_field("instagram", search_text) or fallbacks["instagram"]),
        farm_names=[farm_name for farm_name, _, _ in farm_specs],
        source={
            "api_url": API_URL,
            "post_date": post.get("date"),
            "farm_detection_modes": [mode for _, _, mode in farm_specs],
            "content_html": content_html,
        },
    )

    shared_processing_methods = extract_processing_methods(search_text)
    shared_varieties = extract_varieties(search_text)
    farms: list[ScapFarmRecord] = []

    for farm_name, farm_blocks, parsing_mode in farm_specs:
        farm_search_text = build_search_text(farm_blocks) or search_text
        elevation_text = extract_elevation_text(farm_search_text)
        min_masl, max_masl = parse_elevation_range(elevation_text)
        blocks_for_farm = extract_block_names(farm_search_text)
        varieties = extract_varieties(farm_search_text) or shared_varieties
        processing_methods = extract_processing_methods(farm_search_text) or shared_processing_methods
        farm_region = extract_location_text(farm_search_text) or group_region

        farms.append(
            ScapFarmRecord(
                post_id=int(post.get("id", 0)),
                producer_group_name=title,
                producer_group_slug=slug,
                farm_name=farm_name,
                farm_slug=slugify(farm_name),
                post_url=clean_text(str(post.get("link", ""))) or None,
                featured_image_url=featured_image_url,
                region=farm_region,
                sub_region=extract_sub_region(farm_region),
                elevation_text=elevation_text,
                elevation_min_masl=min_masl,
                elevation_max_masl=max_masl,
                varieties=varieties,
                processing_methods=processing_methods,
                cup_character=extract_cup_character(farm_blocks),
                description=build_description(farm_blocks) or producer_group.description,
                blocks=blocks_for_farm,
                farm_size_ha=extract_farm_size(farm_search_text),
                established=extract_year(farm_search_text) or producer_group.established,
                source={
                    "post_url": clean_text(str(post.get("link", ""))) or None,
                    "parsing_mode": parsing_mode,
                    "section_text": farm_search_text,
                },
            )
        )

    return producer_group, farms


def fetch_posts() -> list[dict[str, Any]]:
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    with httpx.Client(headers=headers, follow_redirects=True, timeout=30.0) as client:
        response = client.get(API_URL)
        response.raise_for_status()
        payload = response.json()

    if not isinstance(payload, list):
        raise ValueError("SCAP API returned an unexpected payload; expected a list of posts.")
    return payload


def save_records(producer_groups: list[ScapProducerGroupRecord], farms: list[ScapFarmRecord]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PRODUCER_GROUP_OUTPUT_PATH.write_text(
        json.dumps([record.model_dump(mode="json") for record in producer_groups], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    FARM_OUTPUT_PATH.write_text(
        json.dumps([record.model_dump(mode="json") for record in farms], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> int:
    try:
        posts = fetch_posts()
    except (httpx.HTTPError, ValueError) as exc:
        print(f"Failed to fetch SCAP posts: {exc}", file=sys.stderr)
        return 1

    producer_groups: list[ScapProducerGroupRecord] = []
    farms: list[ScapFarmRecord] = []
    for post in posts:
        try:
            producer_group, farm_records = extract_post_records(post)
            producer_groups.append(producer_group)
            farms.extend(farm_records)
        except Exception as exc:
            post_id = post.get("id", "unknown")
            print(f"Skipping SCAP post {post_id}: {exc}", file=sys.stderr)

    try:
        save_records(producer_groups, farms)
    except OSError as exc:
        print(f"Failed to write SCAP outputs: {exc}", file=sys.stderr)
        return 1

    print(
        f"Saved {len(producer_groups)} SCAP producer groups to {PRODUCER_GROUP_OUTPUT_PATH} "
        f"and {len(farms)} farms to {FARM_OUTPUT_PATH}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
