"""
Pricing Engine — Calculates suggested prices for kicknap listings.
"""

import json
import logging
from datetime import datetime
from typing import Optional
from dataclasses import dataclass

from config import GUEST_FEE_PERCENT, HOST_FEE_PERCENT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class PricingResult:
    listing_id: str
    suggested_price: float
    previous_price: Optional[float]
    price_change_percent: float
    comparable_count: int
    confidence: str  # "low", "medium", "high"
    factors: dict


def calculate_suggested_price(
    listing: dict,
    comparable_listings: list[dict],
    our_bookings: list[dict] = None,
) -> PricingResult:
    """
    Calculate the suggested price for a single listing.

    Args:
        listing: The listing to price (from our database)
        comparable_listings: Similar listings scraped from Airbnb
        our_bookings: Our own booking data (for conversion signals)

    Returns:
        PricingResult with suggested price and metadata
    """
    listing_id = listing["id"]
    current_price = listing.get("price_per_hour", 0)
    space_type = listing.get("space_type", "bedroom")
    neighborhood = listing.get("neighborhood", "")
    max_guests = listing.get("max_guests", 1)
    amenities = listing.get("amenities", [])

    # Step 1: Filter comparable listings
    comparables = _filter_comparables(
        comparable_listings, space_type, neighborhood, max_guests
    )

    if len(comparables) < 3:
        # Not enough data — use simple average
        if comparables:
            base_price = _calculate_average(comparables)
        else:
            base_price = 12.00  # Amsterdam default
        confidence = "low"
    else:
        base_price = _calculate_weighted_average(comparables)
        confidence = "medium"

    # Step 2: Apply multipliers
    factors = {}

    # Day of week multiplier
    dow_multiplier = _get_day_of_week_multiplier()
    factors["day_of_week"] = dow_multiplier

    # Time of day multiplier
    tod_multiplier = _get_time_of_day_multiplier()
    factors["time_of_day"] = tod_multiplier

    # Amenity multiplier
    amenity_multiplier = _get_amenity_multiplier(amenities)
    factors["amenities"] = amenity_multiplier

    # Demand multiplier (based on our own bookings if available)
    demand_multiplier = _get_demand_multiplier(neighborhood, our_bookings)
    factors["demand"] = demand_multiplier

    # Calculate final price
    suggested = base_price * dow_multiplier * tod_multiplier * amenity_multiplier * demand_multiplier

    # Round to nearest €0.50
    suggested = round(suggested * 2) / 2

    # Ensure minimum price
    suggested = max(suggested, 5.00)

    # Calculate change
    price_change = 0.0
    if current_price and current_price > 0:
        price_change = (suggested - current_price) / current_price

    return PricingResult(
        listing_id=listing_id,
        suggested_price=suggested,
        previous_price=current_price,
        price_change_percent=price_change,
        comparable_count=len(comparables),
        confidence=confidence,
        factors=factors,
    )


def _filter_comparables(
    all_listings: list[dict],
    space_type: str,
    neighborhood: str,
    max_guests: int,
) -> list[dict]:
    """Filter comparable listings by space type and location."""
    filtered = []

    for listing in all_listings:
        # Match space type (loose match)
        listing_type = listing.get("room_type", "").lower()
        if space_type == "bedroom" and "private" not in listing_type:
            continue
        if space_type == "office" and "entire" not in listing_type:
            continue

        # Match neighborhood (loose match)
        listing_neighborhood = listing.get("neighborhood", "").lower()
        if neighborhood.lower() not in listing_neighborhood and listing_neighborhood not in neighborhood.lower():
            continue

        # Match capacity (within 2x)
        listing_capacity = listing.get("person_capacity", 1)
        if listing_capacity > max_guests * 2:
            continue

        filtered.append(listing)

    return filtered


def _calculate_average(comparables: list[dict]) -> float:
    """Simple average of comparable prices."""
    prices = [c.get("price_per_hour", 0) for c in comparables if c.get("price_per_hour", 0) > 0]
    return sum(prices) / len(prices) if prices else 12.00


def _calculate_weighted_average(comparables: list[dict]) -> float:
    """Weighted average — higher weight for listings with more reviews."""
    weighted_sum = 0
    weight_total = 0

    for listing in comparables:
        price = listing.get("price_per_hour", 0)
        reviews = listing.get("reviews_count", 0)
        rating = listing.get("avg_rating", 0)

        if price <= 0:
            continue

        # Weight = reviews * rating (more reviews + higher rating = more trusted)
        weight = max(reviews * max(rating, 1), 1)
        weighted_sum += price * weight
        weight_total += weight

    return weighted_sum / weight_total if weight_total > 0 else 12.00


def _get_day_of_week_multiplier() -> float:
    """Adjust price based on day of week."""
    day = datetime.now().weekday()

    multipliers = {
        0: 0.95,  # Monday
        1: 0.90,  # Tuesday (lowest demand)
        2: 0.95,  # Wednesday
        3: 1.00,  # Thursday
        4: 1.10,  # Friday (weekend starts)
        5: 1.15,  # Saturday (peak)
        6: 1.05,  # Sunday
    }

    return multipliers.get(day, 1.0)


def _get_time_of_day_multiplier() -> float:
    """Adjust price based on current hour."""
    hour = datetime.now().hour

    if 0 <= hour < 6:
        return 0.80  # Late night — lower demand
    elif 6 <= hour < 9:
        return 1.05  # Early morning — moderate
    elif 9 <= hour < 12:
        return 1.10  # Morning — high demand
    elif 12 <= hour < 14:
        return 1.05  # Lunch — moderate
    elif 14 <= hour < 17:
        return 1.00  # Afternoon — baseline
    elif 17 <= hour < 20:
        return 0.95  # Evening — slightly lower
    else:
        return 0.85  # Night — low demand


def _get_amenity_multiplier(amenities: list[str]) -> float:
    """Adjust price based on amenities."""
    multiplier = 1.0

    premium_amenities = {
        "shower": 0.10,
        "wifi": 0.05,
        "parking": 0.08,
        "kitchen": 0.05,
        "coffee": 0.03,
        "blackout_curtains": 0.05,
        "desk": 0.03,
        "elevator": 0.03,
    }

    for amenity in amenities:
        if amenity in premium_amenities:
            multiplier += premium_amenities[amenity]

    return min(multiplier, 1.50)  # Cap at 50% increase


def _get_demand_multiplier(
    neighborhood: str, our_bookings: list[dict] = None
) -> float:
    """Adjust price based on demand signals."""
    multiplier = 1.0

    if our_bookings:
        # Count bookings in this neighborhood in last 7 days
        recent_bookings = [
            b for b in our_bookings
            if b.get("neighborhood") == neighborhood
            and b.get("created_at", "") >= (datetime.now().isoformat()[:10])
        ]

        if len(recent_bookings) > 10:
            multiplier = 1.15  # High demand
        elif len(recent_bookings) > 5:
            multiplier = 1.08  # Moderate demand
        elif len(recent_bookings) < 2:
            multiplier = 0.92  # Low demand

    return multiplier


def calculate_guest_price(price_per_hour: float, duration_hours: float) -> dict:
    """Calculate full price breakdown for a guest."""
    subtotal = price_per_hour * duration_hours
    guest_fee = round(subtotal * GUEST_FEE_PERCENT, 2)
    total = round(subtotal + guest_fee, 2)

    return {
        "price_per_hour": price_per_hour,
        "duration_hours": duration_hours,
        "subtotal": subtotal,
        "guest_fee": guest_fee,
        "total_price": total,
    }


def calculate_host_payout(price_per_hour: float, duration_hours: float) -> dict:
    """Calculate host payout breakdown."""
    subtotal = price_per_hour * duration_hours
    host_fee = round(subtotal * HOST_FEE_PERCENT, 2)
    host_payout = round(subtotal - host_fee, 2)

    return {
        "price_per_hour": price_per_hour,
        "duration_hours": duration_hours,
        "subtotal": subtotal,
        "host_fee": host_fee,
        "host_payout": host_payout,
    }
