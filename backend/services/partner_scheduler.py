import sys
import os
import asyncio
from datetime import datetime
from pathlib import Path

# Ensure paths correctly resolve
sys.path.append(str(Path(__file__).parent.parent.parent))

from backend.database import db
from backend.routers.users import PartnerTipsRequest, get_partner_tips

async def check_and_send_partner_updates():
    print(f"[{datetime.utcnow()}] Running Automated Partner Support Scheduler...")
    
    users = await db.users.find({
        "partner_email": {"$exists": True, "$ne": None, "$ne": ""},
        "partner_update_frequency": {"$in": ["daily", "weekly", "by_phase", "period_start"]}
    }).to_list(None)
    
    if not users:
        print("No users found with active automated partner sharing schedules right now.")
        return
        
    for user in users:
        try:
            frequency = user.get("partner_update_frequency")
            email = user.get("partner_email")
            should_send = False
            today = datetime.utcnow()
            
            # Evaluate Schedule Rules
            if frequency == "daily":
                should_send = True
            elif frequency == "weekly" and today.weekday() == 0: 
                should_send = True
            elif frequency in ["by_phase", "period_start"]:
                # Simulation mode: triggering true to demonstrate feature
                should_send = True
            
            if should_send:
                print(f"Generating Empathy guide for {email}... (Frequency rule matched: {frequency})")
                
                # We reuse the exact same LLM pipeline
                req = PartnerTipsRequest(language=user.get("language", "en"))
                response = await get_partner_tips(req, user)
                
                # Mock actual emailing service (like SendGrid/AWS SES)
                print(f"\n>>>> AUTOMATED EMAIL DISPATCH TO: {email} >>>>")
                print(f"SUBJECT: Today's Support Guide for {user.get('name', 'your partner')}")
                print("-" * 50)
                print(response["tips"])
                print("<<<< DISPATCH COMPLETE <<<<\n")
            
        except Exception as e:
            print(f"Error processing {email}: {e}")

if __name__ == "__main__":
    asyncio.run(check_and_send_partner_updates())
