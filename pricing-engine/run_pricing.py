"""
run_pricing.py — Main script. Runs the full pricing pipeline.
Execute every 6 hours via cron/scheduler.

Usage:
    python run_pricing.py              # Run full pipeline
    python run_pricing.py --scrape     # Only scrape data
    python run_pricing.py --price      # Only calculate prices
    python run_pricing.py --notify     # Only send notifications
"""

import sys
import json
import logging
import argparse
from datetime import datetime
from pathlib import Path

from config import DATABASE_URL, AMSTERDAM_NEIGHBORHOODS
from scrapers.airbnb_scraper import scrape_amsterdam_listings, save_scraped_data
from pricing_engine import calculate_suggested_price, calculate_host_payout
from email_notifier import send_price_notification

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("pricing_engine.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)


def step1_scrape() -> list[dict]:
    """Step 1: Scrape Airbnb data for Amsterdam."""
    logger.info("=" * 50)
    logger.info("STEP 1: Scraping Airbnb data for Amsterdam")
    logger.info("=" * 50)

    all_listings = []

    for neighborhood in AMSTERDAM_NEIGHBORHOODS:
        logger.info(f"Scraping {neighborhood}...")
        listings = scrape_amsterdam_listings(neighborhood=neighborhood, max_pages=2)
        all_listings.extend(listings)
        logger.info(f"  Found {len(listings)} listings in {neighborhood}")

    # Save to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = DATA_DIR / f"scraped_{timestamp}.json"
    save_scraped_data(all_listings, str(filepath))

    # Also save as latest
    save_scraped_data(all_listings, str(DATA_DIR / "latest.json"))

    logger.info(f"Total scraped: {len(all_listings)} listings")
    return all_listings


def step2_calculate_prices(scraped_data: list[dict] = None) -> list[dict]:
    """Step 2: Calculate suggested prices for all active listings."""
    logger.info("=" * 50)
    logger.info("STEP 2: Calculating suggested prices")
    logger.info("=" * 50)

    # Load scraped data if not provided
    if not scraped_data:
        latest_file = DATA_DIR / "latest.json"
        if latest_file.exists():
            with open(latest_file) as f:
                scraped_data = json.load(f)
            logger.info(f"Loaded {len(scraped_data)} scraped listings")
        else:
            logger.warning("No scraped data found. Using hardcoded defaults.")
            scraped_data = []

    # Load our listings from database (or mock data for now)
    our_listings = _load_our_listings()

    results = []

    for listing in our_listings:
        result = calculate_suggested_price(
            listing=listing,
            comparable_listings=scraped_data,
            our_bookings=None,  # Will use our DB later
        )

        results.append({
            "listing_id": result.listing_id,
            "suggested_price": result.suggested_price,
            "previous_price": result.previous_price,
            "change_percent": result.price_change_percent,
            "comparable_count": result.comparable_count,
            "confidence": result.confidence,
            "factors": result.factors,
        })

        logger.info(
            f"  {listing.get('title', listing['id'])}: "
            f"€{result.previous_price} -> €{result.suggested_price} "
            f"({result.price_change_percent:+.1%}) "
            f"[{result.confidence}, {result.comparable_count} comparables]"
        )

    # Save results
    results_file = DATA_DIR / "pricing_results.json"
    with open(results_file, "w") as f:
        json.dump(results, f, indent=2)

    logger.info(f"Calculated prices for {len(results)} listings")
    return results


def step3_notify(pricing_results: list[dict]) -> int:
    """Step 3: Send email notifications for significant price changes."""
    logger.info("=" * 50)
    logger.info("STEP 3: Sending price notifications")
    logger.info("=" * 50)

    our_listings = _load_our_listings()
    listing_map = {l["id"]: l for l in our_listings}
    notifications_sent = 0

    for result in pricing_results:
        listing_id = result["listing_id"]
        listing = listing_map.get(listing_id, {})

        # Calculate host payout
        payout = calculate_host_payout(result["suggested_price"], 3)

        # Send notification if price changed significantly
        sent = send_price_notification(
            host_email=listing.get("host_email", "test@kicknap.com"),
            host_name=listing.get("host_name", "Host"),
            listing_id=listing_id,
            listing_title=listing.get("title", "Your listing"),
            old_price=result.get("previous_price", 0),
            new_price=result["suggested_price"],
            comparable_count=result["comparable_count"],
            confidence=result["confidence"],
            factors=result["factors"],
            host_payout=payout["host_payout"],
        )

        if sent:
            notifications_sent += 1

    logger.info(f"Sent {notifications_sent} notifications")
    return notifications_sent


def _load_our_listings() -> list[dict]:
    """
    Load our active listings from database.
    TODO: Replace with actual database query.
    """
    # Mock data for development — replace with PostgreSQL query
    return [
        {
            "id": "mock-1",
            "title": "Quiet room near Centraal",
            "space_type": "bedroom",
            "neighborhood": "Centrum",
            "price_per_hour": 13.00,
            "max_guests": 1,
            "amenities": ["wifi", "shower", "coffee", "blackout_curtains"],
            "host_email": "maria@example.com",
            "host_name": "Maria",
        },
        {
            "id": "mock-2",
            "title": "Sunny office in De Pijp",
            "space_type": "office",
            "neighborhood": "De Pijp",
            "price_per_hour": 11.00,
            "max_guests": 2,
            "amenities": ["wifi", "desk", "coffee", "parking"],
            "host_email": "jan@example.com",
            "host_name": "Jan",
        },
    ]


def run_full_pipeline():
    """Run the complete pricing pipeline."""
    start_time = datetime.now()
    logger.info(f"Starting pricing pipeline at {start_time}")

    # Step 1: Scrape
    scraped_data = step1_scrape()

    # Step 2: Calculate
    results = step2_calculate_prices(scraped_data)

    # Step 3: Notify
    notifications = step3_notify(results)

    elapsed = (datetime.now() - start_time).total_seconds()
    logger.info(f"Pipeline complete. {len(results)} prices calculated, {notifications} notifications sent in {elapsed:.1f}s")


def main():
    parser = argparse.ArgumentParser(description="kicknap Pricing Engine")
    parser.add_argument("--scrape", action="store_true", help="Only scrape data")
    parser.add_argument("--price", action="store_true", help="Only calculate prices")
    parser.add_argument("--notify", action="store_true", help="Only send notifications")
    args = parser.parse_args()

    if args.scrape:
        step1_scrape()
    elif args.price:
        step2_calculate_prices()
    elif args.notify:
        results_file = DATA_DIR / "pricing_results.json"
        if results_file.exists():
            with open(results_file) as f:
                results = json.load(f)
            step3_notify(results)
        else:
            logger.error("No pricing results found. Run full pipeline first.")
    else:
        run_full_pipeline()


if __name__ == "__main__":
    main()
