"""
API Endpoints for Pricing Advisor and Notification Preferences.
Designed to be integrated into the main kicknap API server.
"""

from flask import Flask, request, jsonify
import sys
import os

# Add pricing-engine to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pricing_advisor import get_pricing_advice, get_pricing_tiers
from notification_preferences import (
    get_notification_preferences,
    update_notification_preferences,
)

app = Flask(__name__)


# ============================================
# PRICING ADVISOR ENDPOINTS
# ============================================

@app.route("/api/v1/pricing/advise", methods=["POST"])
def pricing_advise():
    """
    Get real-time pricing advice when host enters a price.

    Body:
    {
        "price_per_hour": 13.00,
        "space_type": "bedroom",
        "neighborhood": "Centrum",
        "amenities": ["wifi", "shower", "coffee"]
    }

    Response:
    {
        "status": "success",
        "data": {
            "price_per_hour": 13.00,
            "booking_probability": 0.52,
            "booking_probability_label": "Moderate",
            "estimated_days_to_first_booking": 4,
            "comparable_average": 14.95,
            "comparable_min": 9.20,
            "comparable_max": 25.30,
            "earnings_per_3h": 37.83,
            "earnings_per_day_8h": 100.88,
            "earnings_per_month_20d": 2017.60,
            "recommendation": "Competitive price...",
            "recommendation_color": "green",
            "tip": "Add photos...",
            "is_competitive": true
        }
    }
    """
    data = request.get_json()

    if not data or "price_per_hour" not in data:
        return jsonify({"status": "error", "message": "price_per_hour is required"}), 400

    advice = get_pricing_advice(
        price_per_hour=data["price_per_hour"],
        space_type=data.get("space_type", "bedroom"),
        neighborhood=data.get("neighborhood", "Centrum"),
        amenities=data.get("amenities", []),
        comparable_listings=data.get("comparable_listings"),
        our_bookings=data.get("our_bookings"),
        booking_mode=data.get("booking_mode", "instant"),
        min_hours=data.get("min_hours", 1),
    )

    return jsonify({
        "status": "success",
        "data": {
            "price_per_hour": advice.price_per_hour,
            "booking_probability": advice.booking_probability,
            "booking_probability_label": advice.booking_probability_label,
            "estimated_days_to_first_booking": advice.estimated_days_to_first_booking,
            "comparable_average": advice.comparable_average,
            "comparable_min": advice.comparable_min,
            "comparable_max": advice.comparable_max,
            "earnings_per_3h": advice.earnings_per_3h,
            "earnings_per_day_8h": advice.earnings_per_day_8h,
            "earnings_per_month_20d": advice.earnings_per_month_20d,
            "recommendation": advice.recommendation,
            "recommendation_color": advice.recommendation_color,
            "tip": advice.tip,
            "is_competitive": advice.is_competitive,
            "booking_mode_tip": advice.booking_mode_tip,
            "min_hours_tip": advice.min_hours_tip,
        },
    })


@app.route("/api/v1/pricing/tiers", methods=["POST"])
def pricing_tiers():
    """
    Get 3 pricing tiers (Budget, Smart, Premium) for listing creation form.

    Body:
    {
        "space_type": "bedroom",
        "neighborhood": "Centrum",
        "amenities": ["wifi", "shower"]
    }

    Response:
    {
        "status": "success",
        "data": {
            "low": { "price": 11.96, "label": "Budget", ... },
            "smart": { "price": 14.95, "label": "Smart (Recommended)", ... },
            "high": { "price": 19.44, "label": "Premium", ... }
        }
    }
    """
    data = request.get_json() or {}

    tiers = get_pricing_tiers(
        space_type=data.get("space_type", "bedroom"),
        neighborhood=data.get("neighborhood", "Centrum"),
        amenities=data.get("amenities", []),
    )

    return jsonify({"status": "success", "data": tiers})


# ============================================
# NOTIFICATION PREFERENCES ENDPOINTS
# ============================================

@app.route("/api/v1/users/me/notifications/preferences", methods=["GET"])
def get_preferences():
    """
    Get current user's notification preferences.
    Requires authentication (user_id from JWT).
    """
    # In production, user_id comes from JWT token
    user_id = request.headers.get("X-User-ID", "anonymous")

    prefs = get_notification_preferences(user_id)

    return jsonify({
        "status": "success",
        "data": {
            "email_price_changes": prefs.email_price_changes,
            "email_new_bookings": prefs.email_new_bookings,
            "email_booking_cancellations": prefs.email_booking_cancellations,
            "email_reviews": prefs.email_reviews,
            "email_weekly_earnings_summary": prefs.email_weekly_earnings_summary,
            "email_marketing": prefs.email_marketing,
            "push_new_bookings": prefs.push_new_bookings,
            "push_messages": prefs.push_messages,
            "push_price_changes": prefs.push_price_changes,
        },
    })


@app.route("/api/v1/users/me/notifications/preferences", methods=["PATCH"])
def update_preferences():
    """
    Update current user's notification preferences.

    Body:
    {
        "email_price_changes": false,
        "email_new_bookings": true,
        ...
    }
    """
    user_id = request.headers.get("X-User-ID", "anonymous")
    data = request.get_json()

    if not data:
        return jsonify({"status": "error", "message": "No data provided"}), 400

    success = update_notification_preferences(user_id, data)

    if success:
        return jsonify({"status": "success", "message": "Preferences updated"})
    else:
        return jsonify({"status": "error", "message": "Failed to update preferences"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)
