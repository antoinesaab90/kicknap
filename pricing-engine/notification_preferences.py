"""
Notification Preferences — Per-host notification settings.
"""

import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class NotificationPreferences:
    """Host notification preferences."""
    user_id: str
    email_price_changes: bool = True
    email_new_bookings: bool = True
    email_booking_cancellations: bool = True
    email_reviews: bool = True
    email_weekly_earnings_summary: bool = True
    email_marketing: bool = False
    push_new_bookings: bool = True
    push_messages: bool = True
    push_price_changes: bool = False  # off by default — use in-dashboard instead


# Default preferences (when host hasn't set any)
DEFAULT_PREFERENCES = NotificationPreferences(user_id="default")


def get_notification_preferences(user_id: str) -> NotificationPreferences:
    """
    Get notification preferences for a user.
    TODO: Replace with database query.
    """
    # Placeholder — replace with:
    #
    # import psycopg2
    # conn = psycopg2.connect(DATABASE_URL)
    # cur = conn.cursor()
    # cur.execute("""
    #     SELECT email_price_changes, email_new_bookings, email_booking_cancellations,
    #            email_reviews, email_weekly_earnings_summary, email_marketing,
    #            push_new_bookings, push_messages, push_price_changes
    #     FROM notification_preferences
    #     WHERE user_id = %s
    # """, (user_id,))
    # row = cur.fetchone()
    # cur.close()
    # conn.close()
    #
    # if row:
    #     return NotificationPreferences(
    #         user_id=user_id,
    #         email_price_changes=row[0],
    #         ...
    #     )
    # else:
    #     return NotificationPreferences(user_id=user_id)
    #
    return NotificationPreferences(user_id=user_id)


def update_notification_preferences(user_id: str, preferences: dict) -> bool:
    """
    Update notification preferences for a user.
    TODO: Replace with database upsert.
    """
    # Placeholder — replace with:
    #
    # import psycopg2
    # conn = psycopg2.connect(DATABASE_URL)
    # cur = conn.cursor()
    # cur.execute("""
    #     INSERT INTO notification_preferences (user_id, ..., updated_at)
    #     VALUES (%s, ..., NOW())
    #     ON CONFLICT (user_id)
    #     DO UPDATE SET ... = EXCLUDED ..., updated_at = NOW()
    # """, (user_id, ...))
    # conn.commit()
    # cur.close()
    # conn.close()
    #
    logger.info(f"Updated notification preferences for {user_id}: {preferences}")
    return True


def should_send_email(user_id: str, notification_type: str) -> bool:
    """Check if we should send an email notification to this user."""
    prefs = get_notification_preferences(user_id)

    type_map = {
        "price_changes": prefs.email_price_changes,
        "new_bookings": prefs.email_new_bookings,
        "booking_cancellations": prefs.email_booking_cancellations,
        "reviews": prefs.email_reviews,
        "weekly_earnings": prefs.email_weekly_earnings_summary,
        "marketing": prefs.email_marketing,
    }

    return type_map.get(notification_type, True)


def should_send_push(user_id: str, notification_type: str) -> bool:
    """Check if we should send a push notification to this user."""
    prefs = get_notification_preferences(user_id)

    type_map = {
        "new_bookings": prefs.push_new_bookings,
        "messages": prefs.push_messages,
        "price_changes": prefs.push_price_changes,
    }

    return type_map.get(notification_type, False)
