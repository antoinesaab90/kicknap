# Cron Setup — Run pricing engine every 6 hours

## Linux / Mac (crontab)

```bash
# Edit crontab
crontab -e

# Add this line (runs every 6 hours):
0 */6 * * * cd /path/to/kicknap/pricing-engine && /usr/bin/python3 run_pricing.py >> /var/log/kicknap-pricing.log 2>&1

# Or run at specific times (6am, 12pm, 6pm, 12am):
0 0,6,12,18 * * * cd /path/to/kicknap/pricing-engine && /usr/bin/python3 run_pricing.py >> /var/log/kicknap-pricing.log 2>&1
```

## Windows (Task Scheduler)

1. Open Task Scheduler
2. Click "Create Basic Task"
3. Name: "kicknap Pricing Engine"
4. Trigger: "Daily", then modify to repeat every 6 hours
5. Action: "Start a program"
   - Program: `python`
   - Arguments: `run_pricing.py`
   - Start in: `C:\Users\antoi\Documents\Default Project\kicknap\pricing-engine`
6. Finish

## Railway / Vercel (later)

When deploying to Railway, use their built-in cron feature:

```yaml
# railway.toml
[deploy]
startCommand = "python run_pricing.py"

[services.cron]
schedule = "0 */6 * * *"
command = "python run_pricing.py"
```

## Verify it's working

```bash
# Check the log
tail -f /var/log/kicknap-pricing.log

# Or on Windows
Get-Content pricing_engine.log -Wait
```

## Manual run

```bash
cd pricing-engine
python run_pricing.py
```
