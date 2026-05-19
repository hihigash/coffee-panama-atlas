#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import json
import re
import sys
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup
from pydantic import BaseModel, Field

try:
    from crawl4ai import (
        AsyncWebCrawler,
        BrowserConfig,
        CacheMode,
        CrawlerRunConfig,
        JsonCssExtractionStrategy,
        RateLimiter,
    )
    from crawl4ai.async_dispatcher import MemoryAdaptiveDispatcher
except ImportError:  # pragma: no cover - handled at runtime when deps are missing.
    AsyncWebCrawler = None  # type: ignore[assignment]
    BrowserConfig = None  # type: ignore[assignment]
    CacheMode = None  # type: ignore[assignment]
    CrawlerRunConfig = None  # type: ignore[assignment]
    JsonCssExtractionStrategy = None  # type: ignore[assignment]
    MemoryAdaptiveDispatcher = None  # type: ignore[assignment]
    RateLimiter = None  # type: ignore[assignment]

PANAMA_URL = "https://roastdb.com/origin/panama"
SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = SCRIPT_DIR / "output"
OUTPUT_PATH = OUTPUT_DIR / "roastdb_beans_raw.json"
USER_AGENT = "panama-coffee-atlas/1.0 (+https://github.com/)"

HEAD_RE = re.compile(r"<head[^>]*>(.*?)</head>", re.IGNORECASE | re.DOTALL)
JSONLD_SCRIPT_RE = re.compile(
    r"<script[^>]+type=[\"']application/ld\+json[\"'][^>]*>(.*?)</script>",
    re.IGNORECASE | re.DOTALL,
)

BEAN_SCHEMA = {
    "name": "RoastDB Bean",
    "baseSelector": "main",
    "fields": [
        {"name": "bean_name", "selector": "h1", "type": "text"},
        {"name": "taste_notes", "selector": ".note-tag", "type": "text", "multiple": True},
        {"name": "origin_chain", "selector": ".origin-chain a", "type": "text", "multiple": True},
        {"name": "elevation", "selector": ".elevation", "type": "text"},
        {"name": "score", "selector": ".detail-badge.score, .score", "type": "text"},
        {"name": "price", "selector": ".price-amount", "type": "text"},
        {"name": "description", "selector": ".detail-about-text, .about-text", "type": "text"},
    ],
}


class RoastDBBeanRecord(BaseModel):
    url: str
    bean_name: str | None = None
    taste_notes: list[str] = Field(default_factory=list)
    origin_chain: list[str] = Field(default_factory=list)
    elevation: str | None = None
    score: str | None = None
    price: str | None = None
    description: str | None = None
    product_jsonld: dict[str, Any] | None = None
    source: dict[str, Any] = Field(default_factory=dict)


def clean_text(value: Any) -> str | None:
    if value is None:
        return None
    text = re.sub(r"\s+", " ", str(value).replace("\xa0", " ")).strip()
    return text or None


def unique_texts(values: list[Any]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        cleaned = clean_text(value)
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            result.append(cleaned)
    return result


def fetch_panama_html() -> str:
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html"}
    with httpx.Client(headers=headers, follow_redirects=True, timeout=30.0) as client:
        response = client.get(PANAMA_URL)
        response.raise_for_status()
        return response.text


def iter_jsonld_nodes(value: Any) -> list[dict[str, Any]]:
    nodes: list[dict[str, Any]] = []
    if isinstance(value, dict):
        nodes.append(value)
        if isinstance(value.get("@graph"), list):
            nodes.extend(iter_jsonld_nodes(value["@graph"]))
    elif isinstance(value, list):
        for item in value:
            nodes.extend(iter_jsonld_nodes(item))
    return nodes


def extract_item_list_urls(html: str) -> list[str]:
    head_match = HEAD_RE.search(html)
    if not head_match:
        raise ValueError("Could not find a <head> section on the RoastDB Panama page.")

    urls: list[str] = []
    for script_match in JSONLD_SCRIPT_RE.finditer(head_match.group(1)):
        raw_json = clean_text(script_match.group(1))
        if not raw_json:
            continue
        try:
            payload = json.loads(raw_json)
        except json.JSONDecodeError:
            continue

        for node in iter_jsonld_nodes(payload):
            node_type = node.get("@type")
            if node_type != "ItemList":
                continue
            item_list = node.get("itemListElement")
            if not isinstance(item_list, list):
                continue
            for item in item_list:
                candidate: str | None = None
                if isinstance(item, dict):
                    if isinstance(item.get("url"), str):
                        candidate = item["url"]
                    elif isinstance(item.get("item"), dict):
                        nested_item = item["item"]
                        candidate = nested_item.get("url") or nested_item.get("@id")
                elif isinstance(item, str):
                    candidate = item

                if candidate:
                    urls.append(urljoin(PANAMA_URL, candidate))

    deduped_urls = list(dict.fromkeys(urls))
    if not deduped_urls:
        raise ValueError("No bean URLs were discovered in RoastDB ItemList JSON-LD.")
    return deduped_urls


def extract_product_jsonld(html: str) -> dict[str, Any] | None:
    soup = BeautifulSoup(html, "html.parser")
    for script in soup.find_all("script", type="application/ld+json"):
        raw_json = script.string or script.get_text(strip=True)
        if not raw_json:
            continue
        try:
            payload = json.loads(raw_json)
        except json.JSONDecodeError:
            continue

        for node in iter_jsonld_nodes(payload):
            node_type = node.get("@type")
            if node_type == "Product":
                return node
            if isinstance(node_type, list) and "Product" in node_type:
                return node
    return None


def parse_extracted_content(extracted_content: Any) -> dict[str, Any]:
    if extracted_content is None:
        return {}
    if isinstance(extracted_content, str):
        try:
            parsed = json.loads(extracted_content)
        except json.JSONDecodeError:
            return {}
    else:
        parsed = extracted_content

    if isinstance(parsed, list):
        for item in parsed:
            if isinstance(item, dict):
                return item
        return {}
    return parsed if isinstance(parsed, dict) else {}


def merge_result(result: Any) -> RoastDBBeanRecord:
    extracted = parse_extracted_content(getattr(result, "extracted_content", None))
    html = getattr(result, "html", None) or getattr(result, "cleaned_html", None) or ""
    product_jsonld = extract_product_jsonld(html)

    bean_name = clean_text(extracted.get("bean_name"))
    if not bean_name and product_jsonld:
        bean_name = clean_text(product_jsonld.get("name"))

    return RoastDBBeanRecord(
        url=str(getattr(result, "url", "")),
        bean_name=bean_name,
        taste_notes=unique_texts(extracted.get("taste_notes") or []),
        origin_chain=unique_texts(extracted.get("origin_chain") or []),
        elevation=clean_text(extracted.get("elevation")),
        score=clean_text(extracted.get("score")),
        price=clean_text(extracted.get("price")),
        description=clean_text(extracted.get("description")),
        product_jsonld=product_jsonld,
        source={
            "status_code": getattr(result, "status_code", None),
            "success": getattr(result, "success", None),
        },
    )


async def crawl_beans(bean_urls: list[str]) -> tuple[list[RoastDBBeanRecord], int]:
    if not all(
        dependency is not None
        for dependency in (
            AsyncWebCrawler,
            BrowserConfig,
            CacheMode,
            CrawlerRunConfig,
            JsonCssExtractionStrategy,
            MemoryAdaptiveDispatcher,
            RateLimiter,
        )
    ):
        raise RuntimeError("crawl4ai is not installed. Run `pip install -r requirements.txt && crawl4ai-setup` first.")

    extraction_strategy = JsonCssExtractionStrategy(BEAN_SCHEMA, verbose=False)
    browser_config = BrowserConfig(headless=True, verbose=False)
    run_config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        extraction_strategy=extraction_strategy,
        stream=False,
    )
    dispatcher = MemoryAdaptiveDispatcher(
        max_session_permit=5,
        rate_limiter=RateLimiter(base_delay=(1.5, 3.0), max_delay=20.0, max_retries=2),
    )

    async with AsyncWebCrawler(config=browser_config) as crawler:
        results = await crawler.arun_many(urls=bean_urls, config=run_config, dispatcher=dispatcher)

    records: list[RoastDBBeanRecord] = []
    failures = 0
    for result in results:
        if not getattr(result, "success", False):
            failures += 1
            print(
                f"Failed to crawl {getattr(result, 'url', 'unknown URL')}: {getattr(result, 'error_message', 'unknown error')}",
                file=sys.stderr,
            )
            continue
        try:
            records.append(merge_result(result))
        except Exception as exc:
            failures += 1
            print(f"Failed to parse RoastDB bean page {getattr(result, 'url', 'unknown URL')}: {exc}", file=sys.stderr)

    return records, failures


def save_records(records: list[RoastDBBeanRecord]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps([record.model_dump(mode="json") for record in records], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> int:
    try:
        html = fetch_panama_html()
        bean_urls = extract_item_list_urls(html)
    except (httpx.HTTPError, ValueError) as exc:
        print(f"Failed during RoastDB discovery: {exc}", file=sys.stderr)
        return 1

    print(f"Discovered {len(bean_urls)} RoastDB bean URLs from {PANAMA_URL}")

    try:
        records, failures = asyncio.run(crawl_beans(bean_urls))
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"RoastDB crawl failed: {exc}", file=sys.stderr)
        return 1

    try:
        save_records(records)
    except OSError as exc:
        print(f"Failed to write {OUTPUT_PATH}: {exc}", file=sys.stderr)
        return 1

    print(f"Saved {len(records)} RoastDB bean records to {OUTPUT_PATH}")
    print(f"Crawl summary: {len(records)} succeeded, {failures} failed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
