"""
Airbnb Public Data Scraper for Amsterdam

NOTE: Airbnb listings are priced per NIGHT. kicknap is priced per HOUR.
This scraper provides a BASELINE for what spaces are worth in Amsterdam.
We convert nightly prices to hourly equivalents (÷ 24) as a rough benchmark.

This data is used ONLY as a starting point. Once kicknap has its own booking
data (100+ bookings), this scraper becomes irrelevant — we'll use our own
conversion rates and demand signals instead.

The scraper does NOT copy Airbnb's UI, branding, or proprietary data.
It only reads publicly visible listing prices and basic details.
"""

import requests
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Optional

from config import SCRAPE_DELAY, MAX_PAGES, AMSTERDAM_NEIGHBORHOODS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Airbnb's public search API (no auth needed for public data)
AIRBNB_SEARCH_URL = "https://www.airbnb.com/api/v3/StaysSearch"

# Headers to mimic a browser request
HEADERS = {
    "accept": "application/json",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "x-airbnb-api-key": "d306zoyjsyarp7ifhu67rjxn52tv0t20",  # public API key
}


def scrape_amsterdam_listings(
    neighborhood: Optional[str] = None,
    checkin: Optional[str] = None,
    checkout: Optional[str] = None,
    max_pages: int = MAX_PAGES,
) -> list[dict]:
    """
    Scrape Airbnb listings in Amsterdam.

    Args:
        neighborhood: Filter by neighborhood (e.g., "Centrum")
        checkin: Check-in date (YYYY-MM-DD)
        checkout: Check-out date (YYYY-MM-DD)
        max_pages: Maximum pages to scrape

    Returns:
        List of listing dicts with price, location, amenities, etc.
    """
    if not checkin:
        checkin = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    if not checkout:
        checkout = (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d")

    all_listings = []

    for page in range(1, max_pages + 1):
        try:
            logger.info(f"Scraping page {page} for {neighborhood or 'all Amsterdam'}...")

            variables = {
                "staysSearchRequest": {
                    "requestedPageType": "STAYS_SEARCH",
                    "metadataOnly": False,
                    "searchType": "filter_change",
                    "treatmentFlags": [],
                    "rawParams": [
                        {"filterName": "cdnCacheSafe", "filterValues": ["false"]},
                        {"filterName": "channel", "filterValues": ["EXPLORE"]},
                        {"filterName": "checkin", "filterValues": [checkin]},
                        {"filterName": "checkout", "filterValues": [checkout]},
                        {"filterName": "datePickerType", "filterValues": ["calendar"]},
                        {"filterName": "placeId", "filterValues": ["ChIJV8JImHnJxkcRFSRlMIIrgUw"]},  # Amsterdam
                        {"filterName": "adults", "filterValues": ["1"]},
                        {"filterName": "page", "filterValues": [str(page)]},
                        {"filterName": "itemsPerGrid", "filterValues": ["20"]},
                    ],
                },
                "staysMapSearchRequestV2": {
                    "requestedPageType": "STAYS_SEARCH",
                    "metadataOnly": False,
                    "searchType": "filter_change",
                },
            }

            response = requests.post(
                AIRBNB_SEARCH_URL,
                headers=HEADERS,
                json={"operationName": "StaysSearch", "variables": variables},
                timeout=15,
            )

            if response.status_code != 200:
                logger.warning(f"Request failed with status {response.status_code}")
                break

            data = response.json()
            sections = (
                data.get("data", {})
                .get("presentation", {})
                .get("staysSearch", {})
                .get("results", {})
                .get("searchResults", [])
            )

            if not sections:
                logger.info("No more results found")
                break

            for section in sections:
                listing = section.get("listing", {})
                pricing = section.get("pricingQuote", {})

                if not listing or not pricing:
                    continue

                # Extract price
                price_string = pricing.get("structuredStayDisplayPrice", {}).get(
                    "primaryLine", {}
                ).get("price", "")

                # Parse price from string like "€125 per night"
                price_numeric = None
                if price_string:
                    price_numeric = _extract_price(price_string)

                # Also try the rate amount
                if not price_numeric:
                    rate = pricing.get("rate", {})
                    price_numeric = rate.get("amount")

                if not price_numeric:
                    continue

                # Extract location
                city = listing.get("city", "")
                if neighborhood and neighborhood.lower() not in city.lower():
                    continue

                listing_data = {
                    "airbnb_id": listing.get("id"),
                    "title": listing.get("name", ""),
                    "city": city,
                    "neighborhood": neighborhood or city,
                    "price_per_night": float(price_numeric),
                    "price_per_hour": round(float(price_numeric) / 24, 2),
                    "room_type": listing.get("roomType", ""),
                    "person_capacity": listing.get("personCapacity", 1),
                    "reviews_count": listing.get("reviewsCount", 0),
                    "avg_rating": listing.get("avgRating", 0),
                    "lat": listing.get("lat"),
                    "lng": listing.get("lng"),
                    "amenities": _extract_amenities(pricing),
                    "scraped_at": datetime.utcnow().isoformat(),
                }

                all_listings.append(listing_data)

            logger.info(f"Page {page}: found {len(sections)} listings")
            time.sleep(SCRAPE_DELAY)

        except Exception as e:
            logger.error(f"Error scraping page {page}: {e}")
            break

    logger.info(f"Total scraped: {len(all_listings)} listings")
    return all_listings


def scrape_all_neighborhoods() -> dict[str, list[dict]]:
    """
    Scrape all Amsterdam neighborhoods.

    Returns:
        Dict mapping neighborhood name to list of listings.
    """
    results = {}

    for neighborhood in AMSTERDAM_NEIGHBORHOODS:
        logger.info(f"Scraping {neighborhood}...")
        listings = scrape_amsterdam_listings(neighborhood=neighborhood, max_pages=2)
        results[neighborhood] = listings
        time.sleep(SCRAPE_DELAY * 2)  # extra delay between neighborhoods

    return results


def _extract_price(price_string: str) -> Optional[float]:
    """Extract numeric price from strings like '€125 per night' or '$89'."""
    import re

    # Remove currency symbols and text
    cleaned = re.sub(r"[^\d.,]", "", price_string)
    cleaned = cleaned.replace(",", "")

    try:
        return float(cleaned)
    except ValueError:
        return None


def _extract_amenities(pricing: dict) -> list[str]:
    """Extract amenity list from pricing quote."""
    amenities = []
    # Airbnb includes some amenity info in the pricing response
    # This is a simplified extraction
    return amenities


def save_scraped_data(listings: list[dict], filepath: str = "scraped_data.json"):
    """Save scraped data to JSON file."""
    with open(filepath, "w") as f:
        json.dump(listings, f, indent=2)
    logger.info(f"Saved {len(listings)} listings to {filepath}")


if __name__ == "__main__":
    # Test scraping
    listings = scrape_amsterdam_listings(neighborhood="Centrum", max_pages=1)
    print(f"Found {len(listings)} listings in Centrum")
    for listing in listings[:3]:
        print(f"  {listing['title']}: €{listing['price_per_hour']}/hour")
