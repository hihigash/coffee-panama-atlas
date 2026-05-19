#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = SCRIPT_DIR / "output"
DATA_DIR = SCRIPT_DIR.parent / "src" / "data"
SCAP_RAW_PATH = OUTPUT_DIR / "scap_farms_raw.json"
BOP_RAW_PATH = OUTPUT_DIR / "bop_auction_lots_raw.json"
ROASTDB_RAW_PATH = OUTPUT_DIR / "roastdb_beans_raw.json"

ELEVATION_RANGE_RE = re.compile(
    r"(\d[\d,]*)\s*[-–—to\s]+\s*(\d[\d,]*)\s*(?:m\.?a\.?s\.?l\.?|masl|msnm|m)",
    re.IGNORECASE,
)
SINGLE_ELEVATION_RE = re.compile(
    r"(\d[\d,]*)\s*(?:m\.?a\.?s\.?l\.?|masl|msnm|m)\b",
    re.IGNORECASE,
)
FLOAT_RE = re.compile(r"-?\d+(?:\.\d+)?")

REGION_KEYWORDS: dict[str, tuple[str, ...]] = {
    "boquete": ("boquete", "jaramillo", "alto quiel", "palo alto", "caldera", "bajo mono"),
    "tierras-altas": ("tierras altas", "volcan", "volcan baru", "cerro punta", "paso ancho", "nueva california"),
    "renacimiento": ("renacimiento", "rio sereno", "santa clara"),
}
VARIETY_PATTERNS: list[tuple[str, tuple[str, ...]]] = [
    ("geisha", ("geisha", "gesha")),
    ("pacamara", ("pacamara",)),
    ("catuai", ("catuai", "catuai")),
    ("caturra", ("caturra",)),
    ("bourbon", ("bourbon", "red bourbon", "yellow bourbon")),
    ("typica", ("typica", "tipica", "typica mejorado")),
    ("maragogype", ("maragogype",)),
    ("mundo-novo", ("mundo novo", "mundonovo")),
    ("java", ("java",)),
    ("san-ramon", ("san ramon", "san ramon")),
    ("sl28", ("sl28", "sl-28")),
    ("heirloom", ("heirloom",)),
    ("varietal", ("varietal", "varietals", "traditional")),
]
PROCESSING_PATTERNS: list[tuple[str, tuple[str, ...]]] = [
    ("anaerobic-natural", ("anaerobic natural",)),
    ("anaerobic-washed", ("anaerobic washed",)),
    ("carbonic-maceration", ("carbonic", "carbonic maceration")),
    ("black-honey", ("black honey",)),
    ("red-honey", ("red honey",)),
    ("yellow-honey", ("yellow honey",)),
    ("honey", ("honey", "miel")),
    ("washed", ("washed", "lavado", "traditional washed")),
    ("natural", ("natural", "seco", "traditional natural")),
    ("special-process", ("special process", "special processes", "experimental")),
    ("lactic", ("lactic",)),
]


class Coordinates(BaseModel):
    lat: float = 0.0
    lng: float = 0.0


class ElevationRange(BaseModel):
    minMASL: int | None = None
    maxMASL: int | None = None


class PriceInfo(BaseModel):
    value: float | None = None
    unit: str | None = None
    usdPerLb: float | None = None
    raw: str | None = None


class WeightInfo(BaseModel):
    value: float | None = None
    unit: str | None = None
    raw: str | None = None


class NormalizedFarm(BaseModel):
    id: str
    slug: str
    name: str
    producer: str | None = None
    regionId: str | None = None
    regionText: str | None = None
    elevation: ElevationRange = Field(default_factory=ElevationRange)
    varieties: list[str] = Field(default_factory=list)
    processingMethods: list[str] = Field(default_factory=list)
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    instagram: str | None = None
    featuredImageUrl: str | None = None
    coordinates: Coordinates = Field(default_factory=Coordinates)
    source: dict[str, Any] = Field(default_factory=dict)


class NormalizedAuctionLot(BaseModel):
    id: str
    year: int
    lotNumber: str
    categoryCode: str | None = None
    title: str | None = None
    producer: str | None = None
    regionText: str | None = None
    regionId: str | None = None
    varietyIds: list[str] = Field(default_factory=list)
    processingMethodIds: list[str] = Field(default_factory=list)
    score: float | None = None
    price: PriceInfo = Field(default_factory=PriceInfo)
    weight: WeightInfo = Field(default_factory=WeightInfo)
    totalBids: int | None = None
    farmId: str | None = None
    farmMatchScore: float | None = None
    source: dict[str, Any] = Field(default_factory=dict)


class NormalizedRoastDBBean(BaseModel):
    id: str
    url: str
    name: str
    farmId: str | None = None
    farmMatchScore: float | None = None
    tasteNotes: list[str] = Field(default_factory=list)
    originChain: list[str] = Field(default_factory=list)
    elevationText: str | None = None
    elevation: ElevationRange = Field(default_factory=ElevationRange)
    score: float | None = None
    priceText: str | None = None
    description: str | None = None
    product: dict[str, Any] | None = None
    source: dict[str, Any] = Field(default_factory=dict)


class FarmAlias(BaseModel):
    farmId: str
    aliases: list[str] = Field(default_factory=list)


def clean_text(value: Any) -> str | None:
    if value is None:
        return None
    text = re.sub(r"\s+", " ", str(value).replace("\xa0", " ")).strip()
    return text or None


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = "".join(char for char in normalized if not unicodedata.combining(char))
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_text.lower()).strip("-")
    return slug or "item"


def ensure_unique_slug(base_slug: str, used_slugs: set[str]) -> str:
    slug = base_slug
    index = 2
    while slug in used_slugs:
        slug = f"{base_slug}-{index}"
        index += 1
    used_slugs.add(slug)
    return slug


def canonical_text(value: Any) -> str:
    text = clean_text(value)
    if not text:
        return ""

    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = "".join(char for char in normalized if not unicodedata.combining(char)).lower()
    ascii_text = re.sub(r"[^a-z0-9]+", " ", ascii_text)
    stopwords = {"finca", "farm", "estate", "lot", "coffee", "panama", "auction", "best", "of"}
    tokens = [token for token in ascii_text.split() if token and token not in stopwords]
    return " ".join(tokens)


def dedupe_preserve(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            result.append(value)
    return result


def split_multi_value(value: Any) -> list[str]:
    text = clean_text(value)
    if not text:
        return []
    parts = re.split(r"\s*(?:,|/|;|\||\band\b|\by\b|&|\+)\s*", text, flags=re.IGNORECASE)
    return [part.strip() for part in parts if part.strip()]


def parse_int(value: str) -> int:
    return int(value.replace(",", ""))


def parse_elevation_range(value: Any) -> ElevationRange:
    text = clean_text(value)
    if not text:
        return ElevationRange()

    range_match = ELEVATION_RANGE_RE.search(text)
    if range_match:
        low = parse_int(range_match.group(1))
        high = parse_int(range_match.group(2))
        return ElevationRange(minMASL=min(low, high), maxMASL=max(low, high))

    singles = [parse_int(match.group(1)) for match in SINGLE_ELEVATION_RE.finditer(text)]
    if not singles:
        return ElevationRange()
    return ElevationRange(minMASL=min(singles), maxMASL=max(singles))


def parse_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = clean_text(value)
    if not text:
        return None
    match = FLOAT_RE.search(text.replace(",", ""))
    return float(match.group(0)) if match else None


def round_or_none(value: float | None, digits: int = 4) -> float | None:
    return round(value, digits) if value is not None else None


def detect_region_id(value: Any) -> str | None:
    normalized = canonical_text(value)
    if not normalized:
        return None
    for region_id, keywords in REGION_KEYWORDS.items():
        if any(keyword in normalized for keyword in keywords):
            return region_id
    return None


def map_ids(value: Any, patterns: list[tuple[str, tuple[str, ...]]]) -> list[str]:
    text = clean_text(value)
    if not text:
        return []

    normalized_text = canonical_text(text)
    matches: list[str] = []
    for item_id, keywords in patterns:
        if any(keyword in normalized_text for keyword in keywords):
            matches.append(item_id)

    if matches:
        return dedupe_preserve(matches)

    fallback_matches: list[str] = []
    for part in split_multi_value(text):
        normalized_part = canonical_text(part)
        if not normalized_part:
            continue
        matched = False
        for item_id, keywords in patterns:
            if any(keyword in normalized_part for keyword in keywords):
                fallback_matches.append(item_id)
                matched = True
                break
        if not matched:
            fallback_matches.append(slugify(part))

    return dedupe_preserve(fallback_matches)


def normalize_price(value: Any, unit: Any, raw: Any) -> PriceInfo:
    numeric_value = parse_float(value)
    normalized_unit = clean_text(unit)
    usd_per_lb: float | None = None
    if numeric_value is not None:
        if normalized_unit == "USD_PER_KG":
            usd_per_lb = numeric_value / 2.2046226218
        elif normalized_unit == "USD_PER_LB":
            usd_per_lb = numeric_value

    return PriceInfo(
        value=numeric_value,
        unit=normalized_unit,
        usdPerLb=round_or_none(usd_per_lb),
        raw=clean_text(raw),
    )


def normalize_weight(value: Any, unit: Any, raw: Any) -> WeightInfo:
    return WeightInfo(
        value=parse_float(value),
        unit=clean_text(unit),
        raw=clean_text(raw),
    )


def similarity(left: str, right: str) -> float:
    if not left or not right:
        return 0.0
    if left == right:
        return 1.0
    if left in right or right in left:
        shorter = min(len(left), len(right))
        longer = max(len(left), len(right))
        if shorter >= 5:
            return max(0.9, shorter / longer)
    return SequenceMatcher(None, left, right).ratio()


def build_farm_aliases(farms: list[NormalizedFarm]) -> list[FarmAlias]:
    aliases: list[FarmAlias] = []
    for farm in farms:
        farm_aliases = dedupe_preserve(
            [
                canonical_text(farm.name),
                canonical_text(farm.producer),
                canonical_text(f"{farm.name} {farm.producer or ''}"),
            ]
        )
        aliases.append(FarmAlias(farmId=farm.id, aliases=[alias for alias in farm_aliases if alias]))
    return aliases


def match_farm(candidate_values: list[Any], farm_aliases: list[FarmAlias], threshold: float) -> tuple[str | None, float | None]:
    normalized_candidates = [canonical_text(value) for value in candidate_values]
    normalized_candidates = [candidate for candidate in normalized_candidates if candidate]
    if not normalized_candidates:
        return None, None

    best_farm_id: str | None = None
    best_score = 0.0
    for farm in farm_aliases:
        for candidate in normalized_candidates:
            for alias in farm.aliases:
                score = similarity(candidate, alias)
                if score > best_score:
                    best_farm_id = farm.farmId
                    best_score = score

    if best_score >= threshold:
        return best_farm_id, round_or_none(best_score)
    return None, round_or_none(best_score) if best_score > 0 else None


def load_json(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"Missing input file: {path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError(f"Expected a list in {path}")
    return [item for item in payload if isinstance(item, dict)]


def save_json(path: Path, payload: list[BaseModel]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps([item.model_dump(mode="json") for item in payload], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def code_from_lot_number(lot_number: str | None) -> str | None:
    if not lot_number:
        return None
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


def normalize_farms(raw_farms: list[dict[str, Any]]) -> list[NormalizedFarm]:
    used_slugs: set[str] = set()
    farms: list[NormalizedFarm] = []

    for item in raw_farms:
        name = clean_text(item.get("farm_name")) or clean_text(item.get("producer")) or "Unknown Farm"
        slug = ensure_unique_slug(slugify(name), used_slugs)
        region_text = clean_text(item.get("region"))
        elevation = parse_elevation_range(item.get("elevation_text"))
        varieties = map_ids(item.get("varieties"), VARIETY_PATTERNS)
        processing_methods = map_ids(item.get("processing_methods"), PROCESSING_PATTERNS)

        farms.append(
            NormalizedFarm(
                id=slug,
                slug=slug,
                name=name,
                producer=clean_text(item.get("producer")),
                regionId=detect_region_id(region_text or name),
                regionText=region_text,
                elevation=elevation,
                varieties=varieties,
                processingMethods=processing_methods,
                email=clean_text(item.get("email")),
                phone=clean_text(item.get("phone")),
                website=clean_text(item.get("website")),
                instagram=clean_text(item.get("instagram")),
                featuredImageUrl=clean_text(item.get("featured_image_url")),
                coordinates=Coordinates(lat=0.0, lng=0.0),
                source={
                    "scapPostId": item.get("post_id"),
                    "postUrl": clean_text(item.get("post_url")),
                    "slug": clean_text(item.get("slug")),
                },
            )
        )

    farms.sort(key=lambda farm: farm.name.lower())
    return farms


def normalize_lots(raw_lots: list[dict[str, Any]], farm_aliases: list[FarmAlias]) -> list[NormalizedAuctionLot]:
    lots: list[NormalizedAuctionLot] = []
    for item in raw_lots:
        year = int(item.get("year", 0))
        lot_number = clean_text(item.get("lot_number")) or "unknown"
        category_code = clean_text(item.get("category_code")) or code_from_lot_number(lot_number)
        title = clean_text(item.get("lot_title"))
        producer = clean_text(item.get("producer"))
        region_text = clean_text(item.get("region"))
        variety_ids = map_ids(item.get("variety") or item.get("category_heading"), VARIETY_PATTERNS)
        processing_method_ids = map_ids(item.get("processing_method") or item.get("category_heading"), PROCESSING_PATTERNS)
        farm_id, farm_match_score = match_farm([title, producer, f"{title or ''} {producer or ''}"], farm_aliases, threshold=0.74)

        lots.append(
            NormalizedAuctionLot(
                id=f"bop-{year}-{(category_code or 'unknown').lower()}-{slugify(lot_number)}",
                year=year,
                lotNumber=lot_number,
                categoryCode=category_code,
                title=title,
                producer=producer,
                regionText=region_text,
                regionId=detect_region_id(region_text),
                varietyIds=variety_ids,
                processingMethodIds=processing_method_ids,
                score=parse_float(item.get("score") if item.get("score") is not None else item.get("score_text")),
                price=normalize_price(item.get("price"), item.get("price_unit"), item.get("price_text")),
                weight=normalize_weight(item.get("weight"), item.get("weight_unit"), item.get("weight_text")),
                totalBids=(int(item["total_bids"]) if item.get("total_bids") is not None else None),
                farmId=farm_id,
                farmMatchScore=farm_match_score,
                source={
                    "path": clean_text(item.get("source_path")),
                    "categoryHeading": clean_text(item.get("category_heading")),
                    "rawTokens": item.get("raw_tokens", []),
                },
            )
        )

    lots.sort(key=lambda lot: (lot.year, lot.lotNumber))
    return lots


def extract_brand_name(product: dict[str, Any] | None) -> str | None:
    if not product:
        return None
    brand = product.get("brand")
    if isinstance(brand, dict):
        return clean_text(brand.get("name"))
    if isinstance(brand, str):
        return clean_text(brand)
    return None


def normalize_beans(raw_beans: list[dict[str, Any]], farm_aliases: list[FarmAlias]) -> list[NormalizedRoastDBBean]:
    used_slugs: set[str] = set()
    beans: list[NormalizedRoastDBBean] = []

    for item in raw_beans:
        product = item.get("product_jsonld") if isinstance(item.get("product_jsonld"), dict) else None
        name = clean_text(item.get("bean_name")) or clean_text(product.get("name") if product else None) or "Unknown Bean"
        bean_id = ensure_unique_slug(slugify(name), used_slugs)
        origin_chain = [clean_text(value) for value in item.get("origin_chain", []) if clean_text(value)]
        taste_notes = [clean_text(value) for value in item.get("taste_notes", []) if clean_text(value)]
        farm_id, farm_match_score = match_farm(
            [name, *origin_chain, extract_brand_name(product)],
            farm_aliases,
            threshold=0.78,
        )

        beans.append(
            NormalizedRoastDBBean(
                id=bean_id,
                url=clean_text(item.get("url")) or "",
                name=name,
                farmId=farm_id,
                farmMatchScore=farm_match_score,
                tasteNotes=dedupe_preserve([note for note in taste_notes if note]),
                originChain=dedupe_preserve([value for value in origin_chain if value]),
                elevationText=clean_text(item.get("elevation")),
                elevation=parse_elevation_range(item.get("elevation")),
                score=parse_float(item.get("score")),
                priceText=clean_text(item.get("price")),
                description=clean_text(item.get("description")),
                product=product,
                source={"status": item.get("source", {})},
            )
        )

    beans.sort(key=lambda bean: bean.name.lower())
    return beans


def main() -> int:
    try:
        raw_farms = load_json(SCAP_RAW_PATH)
        raw_lots = load_json(BOP_RAW_PATH)
        raw_beans = load_json(ROASTDB_RAW_PATH)
    except (FileNotFoundError, ValueError, json.JSONDecodeError) as exc:
        print(f"Failed to load raw inputs: {exc}", file=sys.stderr)
        return 1

    farms = normalize_farms(raw_farms)
    farm_aliases = build_farm_aliases(farms)
    lots = normalize_lots(raw_lots, farm_aliases)
    beans = normalize_beans(raw_beans, farm_aliases)

    try:
        save_json(DATA_DIR / "farms.json", farms)
        save_json(DATA_DIR / "auction-lots.json", lots)
        save_json(DATA_DIR / "roastdb-beans.json", beans)
    except OSError as exc:
        print(f"Failed to write normalized data: {exc}", file=sys.stderr)
        return 1

    linked_lots = sum(1 for lot in lots if lot.farmId)
    linked_beans = sum(1 for bean in beans if bean.farmId)
    print(f"Saved {len(farms)} farms, {len(lots)} auction lots, and {len(beans)} RoastDB beans to {DATA_DIR}")
    print(f"Link stats: {linked_lots}/{len(lots)} auction lots linked, {linked_beans}/{len(beans)} beans linked")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
