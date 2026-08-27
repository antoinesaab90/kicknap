# kicknap Pricing Engine
> Automated pricing suggestions for host listings.

## Components
1. `scrapers/airbnb_scraper.py` — Scrapes public Airbnb data for Amsterdam
2. `pricing_engine.py` — Calculates suggested prices
3. `email_notifier.py` — Sends price change notifications
4. `run_pricing.py` — Main script (runs all components)
5. `config.py` — Configuration
6. `requirements.txt` — Python dependencies

## Setup
```bash
cd pricing-engine
pip install -r requirements.txt
cp .env.example .env  # fill in your credentials
```

## Run manually
```bash
python run_pricing.py
```

## Run automatically (every 6 hours)
```bash
# Add to crontab (Linux/Mac):
0 */6 * * * cd /path/to/kicknap/pricing-engine && python run_pricing.py

# Or use Windows Task Scheduler (see CRON_SETUP.md)
```

## How it works
1. Scraper fetches comparable listing prices from Airbnb (Amsterdam)
2. Pricing engine calculates suggested price per listing
3. If price changed >10%, email notification is sent to host
4. Results stored in database and shown on host dashboard
