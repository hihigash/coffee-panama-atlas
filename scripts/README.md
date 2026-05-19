# Panama Coffee Atlas Data Collection Scripts

One-time data collection and normalization scripts for Panama Coffee Atlas.

## Prerequisites

- Python 3.11+
- A virtual environment

## Setup

Run from the `scripts/` directory:

```bash
python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && crawl4ai-setup
```

## Usage

Run each script individually. Raw crawler output is written to `scripts/output/`, and the normalization script writes final JSON files to `src/data/`.

```bash
cd scripts
python crawl_scap.py
python crawl_bop.py
python crawl_roastdb.py
python normalize_data.py
```

## Scripts

- `crawl_scap.py` — Fetches all SCAP member farm profiles from the WordPress REST API and extracts farm metadata from HTML content.
- `crawl_bop.py` — Downloads the Best of Panama Framer search index and converts flat auction-page tokens into structured lot records for 2017-2024.
- `crawl_roastdb.py` — Discovers Panama bean pages from RoastDB and crawls them with Crawl4AI to capture JSON-LD product data plus CSS-based page details.
- `normalize_data.py` — Loads all raw crawler outputs, normalizes fields, links related entities, and writes final JSON datasets to `src/data/`.

## Output locations

- Raw crawler output: `scripts/output/`
- Final normalized data: `src/data/`
