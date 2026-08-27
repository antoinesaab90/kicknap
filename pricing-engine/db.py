"""
Database helpers — Connect to PostgreSQL and query listings.
TODO: Implement when database is set up.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def get_active_listings() -> list[dict]:
    """
    Fetch all active listings from the database.
    TODO: Implement with psycopg2
    """
    # Placeholder — replace with actual DB query:
    #
    # import psycopg2
    # conn = psycopg2.connect(DATABASE_URL)
    # cur = conn.cursor()
    # cur.execute("""
    #     SELECT l.id, l.title, l.space_type, l.neighborhood,
    #            l.price_per_hour, l.max_guests, l.status,
    #            u.first_name || ' ' || u.last_name as host_name,
    #            u.email as host_email,
    #            array_remove(array_agg(la.amenity), NULL) as amenities
    #     FROM listings l
    #     JOIN users u ON l.host_id = u.id
    #     LEFT JOIN listing_amenities la ON l.id = la.listing_id
    #     WHERE l.status = 'active' AND l.deleted_at IS NULL
    #     GROUP BY l.id, l.title, l.space_type, l.neighborhood,
    #              l.price_per_hour, l.max_guests, l.status, u.first_name,
    #              u.last_name, u.email
    # """)
    # rows = cur.fetchall()
    # cur.close()
    # conn.close()
    # return [dict(zip(columns, row)) for row in rows]
    #
    return []


def update_listing_price(listing_id: str, suggested_price: float) -> bool:
    """
    Update the suggested price for a listing.
    TODO: Implement with psycopg2
    """
    # Placeholder — replace with actual DB update:
    #
    # import psycopg2
    # conn = psycopg2.connect(DATABASE_URL)
    # cur = conn.cursor()
    # cur.execute("""
    #     UPDATE listings
    #     SET suggested_price = %s, updated_at = NOW()
    #     WHERE id = %s
    # """, (suggested_price, listing_id))
    # conn.commit()
    # cur.close()
    # conn.close()
    # return True
    #
    return True


def get_neighborhood_bookings(neighborhood: str, days: int = 7) -> list[dict]:
    """
    Get recent bookings in a neighborhood for demand signals.
    TODO: Implement with psycopg2
    """
    return []
