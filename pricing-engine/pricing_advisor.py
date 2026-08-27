"""
Pricing Advisor — Real-time pricing feedback for hosts.
Gives instant feedback when a host enters a price on the listing form.
"""

import math
import logging
from datetime import datetime
from typing import Optional
from dataclasses import dataclass

from config import GUEST_FEE_PERCENT, HOST_FEE_PERCENT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class PricingAdvice:
    """Real-time pricing feedback for a host."""
    price_per_hour: float
    booking_probability: float  # 0.0 to 1.0 (0% to 100%)
    booking_probability_label: str  # "Low", "Moderate", "High", "Very High"
    estimated_days_to_first_booking: int
    comparable_average: float
    comparable_min: float
    comparable_max: float
    earnings_per_3h: float
    earnings_per_day_8h: float
    earnings_per_month_20d: float
    recommendation: str  # human-readable advice
    recommendation_color: str  # green, yellow, red
    tip: str  # contextual tip
    is_competitive: bool  # is this price competitive in the market?
    booking_mode_tip: str  # tip about booking mode (instant vs request)
    min_hours_tip: str  # tip about minimum hours setting


def get_pricing_advice(
    price_per_hour: float,
    space_type: str,
    neighborhood: str,
    amenities: list[str],
    comparable_listings: list[dict] = None,
    our_bookings: list[dict] = None,
    booking_mode: str = "instant",
    min_hours: float = 1,
) -> PricingAdvice:
    """
    Get real-time pricing advice when a host enters a price.

    Called via API when host types a price in the listing form.
    Returns instant feedback.
    """
    # Get comparable data
    comparables = _get_comparable_prices(space_type, neighborhood, comparable_listings)

    avg_price = comparables["average"]
    min_price = comparables["min"]
    max_price = comparables["max"]

    # Calculate booking probability
    probability = _calculate_booking_probability(
        price_per_hour, avg_price, min_price, max_price, amenities, our_bookings
    )

    # Calculate earnings
    earnings_3h = round(price_per_hour * 3 * (1 - HOST_FEE_PERCENT), 2)
    earnings_8h = round(price_per_hour * 8 * (1 - HOST_FEE_PERCENT), 2)
    earnings_month = round(earnings_8h * 20, 2)  # 20 working days

    # Estimate days to first booking
    days_to_booking = _estimate_days_to_booking(probability)

    # Generate recommendation
    recommendation, color = _generate_recommendation(
        price_per_hour, avg_price, probability
    )

    # Generate tip
    tip = _generate_tip(price_per_hour, avg_price, probability, space_type, neighborhood)

    # Is it competitive?
    is_competitive = price_per_hour <= avg_price * 1.2  # within 20% of average

    return PricingAdvice(
        price_per_hour=price_per_hour,
        booking_probability=probability,
        booking_probability_label=_probability_label(probability),
        estimated_days_to_first_booking=days_to_booking,
        comparable_average=avg_price,
        comparable_min=min_price,
        comparable_max=max_price,
        earnings_per_3h=earnings_3h,
        earnings_per_day_8h=earnings_8h,
        earnings_per_month_20d=earnings_month,
        recommendation=recommendation,
        recommendation_color=color,
        tip=tip,
        is_competitive=is_competitive,
        booking_mode_tip=_get_booking_mode_tip(booking_mode),
        min_hours_tip=_get_min_hours_tip(min_hours, price_per_hour),
    )


def _get_comparable_prices(
    space_type: str,
    neighborhood: str,
    comparable_listings: list[dict] = None,
) -> dict:
    """Get average/min/max prices for comparable listings."""
    # Default Amsterdam prices (updated as we get real data)
    default_prices = {
        "bedroom": {"average": 13.0, "min": 8.0, "max": 22.0},
        "living_room": {"average": 11.0, "min": 7.0, "max": 18.0},
        "office": {"average": 12.0, "min": 8.0, "max": 20.0},
        "studio": {"average": 15.0, "min": 10.0, "max": 25.0},
        "other": {"average": 12.0, "min": 7.0, "max": 20.0},
    }

    # Neighborhood adjustments (Amsterdam)
    neighborhood_adjustments = {
        "centrum": 1.15,      # Most expensive
        "jordaan": 1.10,
        "de pijp": 1.05,
        "leidseplein": 1.10,
        "rokin": 1.08,
        "zuid": 1.05,
        "oud-west": 1.00,
        "oud-zuid": 1.02,
        "west": 0.95,
        "oost": 0.93,
        "noord": 0.88,
        "amstel": 0.92,
        "schiphhol": 1.00,
        "station zuid": 0.98,
        "waterplein": 0.95,
    }

    # If we have real comparable data, use it
    if comparable_listings and len(comparable_listings) >= 3:
        prices = [l.get("price_per_hour", 0) for l in comparable_listings if l.get("price_per_hour", 0) > 0]
        if prices:
            return {
                "average": sum(prices) / len(prices),
                "min": min(prices),
                "max": max(prices),
            }

    # Use defaults with neighborhood adjustment
    base = default_prices.get(space_type, default_prices["other"])
    adjustment = neighborhood_adjustments.get(neighborhood.lower(), 1.0)

    return {
        "average": round(base["average"] * adjustment, 2),
        "min": round(base["min"] * adjustment, 2),
        "max": round(base["max"] * adjustment, 2),
    }


def _calculate_booking_probability(
    price: float,
    avg_price: float,
    min_price: float,
    max_price: float,
    amenities: list[str],
    our_bookings: list[dict] = None,
) -> float:
    """
    Calculate probability of being booked within 24 hours.
    Returns 0.0 to 1.0.

    Based on price position relative to market + demand signals.
    """
    if avg_price <= 0:
        return 0.5

    # Price ratio: how does this price compare to the market?
    price_ratio = price / avg_price

    # Base probability from price position
    # At average price: ~50% chance
    # Below average: higher chance
    # Above average: lower chance
    if price_ratio <= 0.7:
        base_prob = 0.90  # Very cheap = almost certain
    elif price_ratio <= 0.85:
        base_prob = 0.75
    elif price_ratio <= 0.95:
        base_prob = 0.60
    elif price_ratio <= 1.05:
        base_prob = 0.50  # At market rate
    elif price_ratio <= 1.15:
        base_prob = 0.35
    elif price_ratio <= 1.30:
        base_prob = 0.20
    elif price_ratio <= 1.50:
        base_prob = 0.10
    else:
        base_prob = 0.03  # Way above market

    # Amenity bonus
    amenity_bonus = 0.0
    premium_amenities = {"shower": 0.05, "wifi": 0.03, "parking": 0.04, "coffee": 0.02}
    for amenity in amenities:
        if amenity in premium_amenities:
            amenity_bonus += premium_amenities[amenity]

    # Day of week adjustment
    day = datetime.now().weekday()
    if day in [4, 5]:  # Friday, Saturday
        dow_bonus = 0.05
    elif day in [1, 2]:  # Tuesday, Wednesday
        dow_bonus = -0.05
    else:
        dow_bonus = 0.0

    # Final probability
    probability = base_prob + amenity_bonus + dow_bonus
    probability = max(0.0, min(1.0, probability))  # Clamp to 0-1

    return round(probability, 2)


def _probability_label(probability: float) -> str:
    """Convert probability to human-readable label."""
    if probability >= 0.75:
        return "Very High"
    elif probability >= 0.55:
        return "High"
    elif probability >= 0.35:
        return "Moderate"
    elif probability >= 0.15:
        return "Low"
    else:
        return "Very Low"


def _get_booking_mode_tip(booking_mode: str) -> str:
    """Get tip about booking mode selection."""
    if booking_mode == "instant":
        return "Instant Book gets 3x more bookings than Request to Book. Guests love instant confirmation."
    else:
        return "Request to Book gives you control, but you'll get fewer bookings. Guests prefer instant confirmation."


def _get_min_hours_tip(min_hours: float, price_per_hour: float) -> str:
    """Get tip about minimum hours setting."""
    min_earnings = min_hours * price_per_hour
    if min_hours <= 1:
        return f"No minimum. You'll attract short-stay guests (layovers, quick rests). Minimum earnings per booking: €{min_earnings:.0f}."
    elif min_hours <= 2:
        return f"2-hour minimum. Good balance. Minimum earnings per booking: €{min_earnings:.0f}."
    elif min_hours <= 4:
        return f"4-hour minimum. You'll get fewer but more valuable bookings. Minimum earnings per booking: €{min_earnings:.0f}."
    else:
        return f"{min_hours:.0f}-hour minimum. High-value bookings only. Minimum earnings per booking: €{min_earnings:.0f}. Some guests may look elsewhere."


def _estimate_days_to_booking(probability: float) -> int:
    """Estimate days until first booking based on probability."""
    if probability >= 0.80:
        return 1
    elif probability >= 0.60:
        return 2
    elif probability >= 0.40:
        return 4
    elif probability >= 0.25:
        return 7
    elif probability >= 0.10:
        return 14
    else:
        return 30


def _generate_recommendation(price: float, avg_price: float, probability: float) -> tuple[str, str]:
    """Generate a recommendation string and color."""
    ratio = price / avg_price if avg_price > 0 else 1.0

    if ratio <= 0.80:
        return (
            f"Great price! At €{price:.2f}/h, your space will likely book fast. "
            f"You might be leaving money on the table though.",
            "green"
        )
    elif ratio <= 1.00:
        return (
            f"Competitive price. At €{price:.2f}/h, you're right in line with "
            f"similar spaces in your area. Good balance of speed and earnings.",
            "green"
        )
    elif ratio <= 1.15:
        return (
            f"Slightly above average. At €{price:.2f}/h, it may take a bit longer "
            f"to get bookings. Consider lowering to €{avg_price:.2f}/h for faster bookings.",
            "yellow"
        )
    elif ratio <= 1.40:
        return (
            f"Premium pricing. At €{price:.2f}/h, bookings will be slower. "
            f"Only works if your space has standout features.",
            "yellow"
        )
    else:
        return (
            f"Very high price. At €{price:.2f}/h, bookings will be rare. "
            f"Similar spaces charge around €{avg_price:.2f}/h.",
            "red"
        )


def _generate_tip(
    price: float, avg_price: float, probability: float, space_type: str, neighborhood: str
) -> str:
    """Generate a contextual tip."""
    tips = []

    if probability < 0.30:
        tips.append("💡 Tip: Lowering your price by even €1-2/h can significantly increase bookings.")

    if probability > 0.80:
        tips.append("💡 Tip: Your price is very competitive. You could raise it a bit and still book fast.")

    if space_type == "bedroom" and "shower" not in str(neighborhood):
        tips.append("💡 Tip: Spaces with private showers get 40% more bookings.")

    if neighborhood.lower() in ["centrum", "jordaan", "leidseplein"]:
        tips.append("💡 Tip: Tourist areas have higher demand on weekends. Consider weekend pricing.")

    if not tips:
        tips.append("💡 Tip: Add photos to your listing — spaces with 3+ photos get 3x more views.")

    return tips[0]


def get_pricing_tiers(
    space_type: str,
    neighborhood: str,
    amenities: list[str],
) -> dict:
    """
    Get the 3 pricing tiers (Low, Smart, High) for the listing form.
    Used when host first creates a listing.
    """
    comparables = _get_comparable_prices(space_type, neighborhood)
    avg = comparables["average"]

    low_price = round(avg * 0.80, 2)
    smart_price = round(avg, 2)
    high_price = round(avg * 1.30, 2)

    low_advice = get_pricing_advice(low_price, space_type, neighborhood, amenities)
    smart_advice = get_pricing_advice(smart_price, space_type, neighborhood, amenities)
    high_advice = get_pricing_advice(high_price, space_type, neighborhood, amenities)

    return {
        "low": {
            "price": low_price,
            "label": "Budget",
            "description": "Books fast, lower earnings",
            "booking_probability": low_advice.booking_probability,
            "booking_probability_label": low_advice.booking_probability_label,
            "earnings_per_3h": low_advice.earnings_per_3h,
            "days_to_booking": low_advice.estimated_days_to_first_booking,
        },
        "smart": {
            "price": smart_price,
            "label": "Smart (Recommended)",
            "description": "Best balance of speed and earnings",
            "booking_probability": smart_advice.booking_probability,
            "booking_probability_label": smart_advice.booking_probability_label,
            "earnings_per_3h": smart_advice.earnings_per_3h,
            "days_to_booking": smart_advice.estimated_days_to_first_booking,
        },
        "high": {
            "price": high_price,
            "label": "Premium",
            "description": "Higher earnings, slower bookings",
            "booking_probability": high_advice.booking_probability,
            "booking_probability_label": high_advice.booking_probability_label,
            "earnings_per_3h": high_advice.earnings_per_3h,
            "days_to_booking": high_advice.estimated_days_to_first_booking,
        },
    }
