"""
Email Notifier — Sends price change notifications to hosts.
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, PRICE_CHANGE_THRESHOLD

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Email template for price change notification
PRICE_CHANGE_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1D263B; color: #EADAB0; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background: #f9f9f9; }
        .price-box { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center; }
        .old-price { color: #999; text-decoration: line-through; font-size: 18px; }
        .new-price { color: #1D263B; font-size: 28px; font-weight: bold; }
        .arrow { color: #4CAF50; font-size: 24px; }
        .btn { display: inline-block; background: #1D263B; color: #EADAB0; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
        .footer { padding: 16px; font-size: 12px; color: #999; text-align: center; }
        .footer a { color: #1D263B; }
    </style>
</head>
<body>
    <div class="header">
        <h1>kicknap</h1>
    </div>
    <div class="content">
        <h2>Hi {{ host_name }},</h2>

        <p>We've updated the suggested price for your listing:</p>

        <p><strong>{{ listing_title }}</strong></p>

        <div class="price-box">
            <p class="old-price">€{{ old_price }}/hour</p>
            <p class="arrow">↓</p>
            <p class="new-price">€{{ new_price }}/hour</p>
            <p style="color: #666; font-size: 14px;">{{ change_percent }}% change</p>
        </div>

        <p><strong>Why this price?</strong></p>
        <ul>
            <li>Based on {{ comparable_count }} similar spaces in your area</li>
            <li>Confidence: {{ confidence }}</li>
            <li>Day of week adjustment: {{ dow_factor }}</li>
            <li>Demand in your area: {{ demand_factor }}</li>
        </ul>

        <p><strong>Your estimated earnings per 3-hour booking:</strong></p>
        <p style="font-size: 20px; font-weight: bold;">€{{ host_payout }}</p>
        <p style="color: #666; font-size: 14px;">(after 3% host fee)</p>

        <a href="https://kicknap.com/host/listings/{{ listing_id }}/pricing" class="btn">Update your price</a>

        <p style="color: #666; font-size: 13px; margin-top: 24px;">
            This is a suggestion — you set the final price. You can change it anytime in your dashboard.
        </p>
    </div>
    <div class="footer">
        <p>kicknap — Call it home.</p>
        <p><a href="https://kicknap.com">kicknap.com</a> · <a href="https://kicknap.com/help">Help Center</a></p>
    </div>
</body>
</html>
"""


def send_price_notification(
    host_email: str,
    host_name: str,
    listing_id: str,
    listing_title: str,
    old_price: float,
    new_price: float,
    comparable_count: int,
    confidence: str,
    factors: dict,
    host_payout: float,
) -> bool:
    """
    Send price change notification to host.

    Returns True if email was sent successfully.
    """
    # Don't send if change is below threshold
    if old_price and old_price > 0:
        change = abs(new_price - old_price) / old_price
        if change < PRICE_CHANGE_THRESHOLD:
            logger.info(f"Price change {change:.1%} below threshold, skipping notification")
            return False

    change_percent = round(((new_price - old_price) / old_price) * 100, 1) if old_price else 100

    # Build email
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"New suggested price for {listing_title}"
    msg["From"] = EMAIL_FROM
    msg["To"] = host_email

    # Render template
    html = PRICE_CHANGE_TEMPLATE
    html = html.replace("{{ host_name }}", host_name)
    html = html.replace("{{ listing_title }}", listing_title)
    html = html.replace("{{ listing_id }}", listing_id)
    html = html.replace("{{ old_price }}", f"{old_price:.2f}" if old_price else "N/A")
    html = html.replace("{{ new_price }}", f"{new_price:.2f}")
    html = html.replace("{{ change_percent }}", f"{change_percent:+.1f}")
    html = html.replace("{{ comparable_count }}", str(comparable_count))
    html = html.replace("{{ confidence }}", confidence.capitalize())
    html = html.replace("{{ dow_factor }}", f"{factors.get('day_of_week', 1.0):.2f}x")
    html = html.replace("{{ demand_factor }}", f"{factors.get('demand', 1.0):.2f}x")
    html = html.replace("{{ host_payout }}", f"{host_payout:.2f}")

    msg.attach(MIMEText(html, "html"))

    # Send
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(EMAIL_FROM, host_email, msg.as_string())

        logger.info(f"Price notification sent to {host_email} for {listing_title}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {host_email}: {e}")
        return False


def send_booking_notification(
    host_email: str,
    host_name: str,
    guest_name: str,
    listing_title: str,
    start_time: str,
    end_time: str,
    total_price: float,
) -> bool:
    """Send new booking notification to host."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #1D263B; color: #EADAB0; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ padding: 20px; background: #f9f9f9; }}
            .booking-box {{ background: white; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 16px 0; }}
            .btn {{ display: inline-block; background: #1D263B; color: #EADAB0; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }}
            .footer {{ padding: 16px; font-size: 12px; color: #999; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="header"><h1>kicknap</h1></div>
        <div class="content">
            <h2>New booking! 🎉</h2>
            <div class="booking-box">
                <p><strong>Guest:</strong> {guest_name}</p>
                <p><strong>Space:</strong> {listing_title}</p>
                <p><strong>When:</strong> {start_time} – {end_time}</p>
                <p><strong>Total:</strong> €{total_price:.2f}</p>
            </div>
            <a href="https://kicknap.com/host/bookings" class="btn">View booking</a>
        </div>
        <div class="footer"><p>kicknap — Call it home.</p></div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"New booking: {guest_name} booked {listing_title}"
    msg["From"] = EMAIL_FROM
    msg["To"] = host_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(EMAIL_FROM, host_email, msg.as_string())
        return True
    except Exception as e:
        logger.error(f"Failed to send booking email: {e}")
        return False
