import os
from dotenv import load_dotenv

load_dotenv()

# Database
DATABASE_URL = os.getenv("DATABASE_URL")

# Email
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.zoho.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
EMAIL_FROM = os.getenv("EMAIL_FROM", "pricing@kicknap.com")

# Scraping
SCRAPE_DELAY = int(os.getenv("SCRAPE_DELAY_SECONDS", 3))
MAX_PAGES = int(os.getenv("MAX_PAGES", 5))

# Pricing
PRICE_CHANGE_THRESHOLD = float(os.getenv("PRICE_CHANGE_THRESHOLD", 0.10))

# Fees
GUEST_FEE_PERCENT = float(os.getenv("GUEST_FEE_PERCENT", 0.10))
HOST_FEE_PERCENT = float(os.getenv("HOST_FEE_PERCENT", 0.03))

# Amsterdam neighborhoods for scraping
AMSTERDAM_NEIGHBORHOODS = [
    "Centrum",
    "De Pijp",
    "Jordaan",
    "Oud-West",
    "Oud-Zuid",
    "Zuid",
    "West",
    "Noord",
    "Oost",
    "Amstel",
    "Schiphhol",
    "Station Zuid",
    "Waterplein",
    "Rokin",
    "Leidseplein",
]

# Space type mappings (kicknap -> Airbnb categories)
SPACE_TYPE_MAP = {
    "bedroom": ["Private room", "Entire home"],
    "living_room": ["Entire home"],
    "office": ["Entire home", "Private room"],
    "studio": ["Entire home"],
    "other": ["Entire home", "Private room"],
}
