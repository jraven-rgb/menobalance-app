from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from datetime import datetime
from bson import ObjectId
from backend.database import db
from backend.models.models import *
from backend.routers.auth import get_current_user, get_current_user_dict

router = APIRouter()

# ==================== PARTNER SHARING ====================

class PartnerTipsRequest(BaseModel):
    language: Optional[str] = "en"

@router.post("/partner-tips")
async def get_partner_tips(request: PartnerTipsRequest, current_user = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    user_data = current_user
    phase = user_data.get("menopause_phase") or "menopause"
    symptoms_list = user_data.get("current_symptoms") or []
    language = request.language or user_data.get("language", "en")
    
    # Get recent check-in for mood
    user_id = str(current_user["_id"])
    recent_checkin = await db.daily_checkins.find_one(
        {"user_id": user_id},
        sort=[("date", -1)]
    )
    
    mood_info = ""
    if recent_checkin:
        mood_level = recent_checkin.get("mood", 3)
        energy_level = recent_checkin.get("energy_level", 3)
        today_symptoms = recent_checkin.get("symptoms", [])
        mood_info = f"Today's mood: {mood_level}/5, Energy: {energy_level}/5, Today's symptoms: {', '.join(today_symptoms[:5])}"
    
    # Determine approximate cycle phase based on last period date
    last_period = user_data.get("last_period_date", "")
    cycle_length = user_data.get("cycle_length", 28)
    cycle_phase_info = ""
    
    if last_period:
        try:
            from datetime import datetime as dt
            last_period_date = dt.strptime(last_period, '%Y-%m-%d')
            days_since = (datetime.utcnow() - last_period_date).days % (cycle_length or 28)
            if days_since <= 5:
                cycle_phase_info = f"She is approximately in her MENSTRUAL phase (day {days_since}). She needs extra rest, warmth, comfort, and understanding. Oxytocin through gentle touch and safety is especially important now."
            elif days_since <= 14:
                cycle_phase_info = f"She is approximately in her FOLLICULAR phase (day {days_since}). Her energy is rising - a good time for activities together. She may be more social and creative."
            elif days_since <= 17:
                cycle_phase_info = f"She is approximately in her OVULATION phase (day {days_since}). She may feel most confident and communicative. Great time for date nights and important conversations."
            else:
                cycle_phase_info = f"She is approximately in her LUTEAL phase (day {days_since}). CRITICAL INSTRUCTION: You MUST be proactively caring, highly patient, and gentle right now. She may feel highly sensitive or overwhelmed due to naturally dropping hormones. Bring her comfort items without asking, give long hugs for oxytocin, and help with chores unconditionally."
        except Exception:
            cycle_phase_info = ""
    
    lang_instruction = "Respond in German." if language == "de" else "Respond in English."
    
    prompt = f"""You are a relationship and women's health expert. {lang_instruction}

Partner's wife/girlfriend is in the {phase} phase of menopause.
Her symptoms: {', '.join(symptoms_list[:5]) if symptoms_list else 'General menopause symptoms'}
{mood_info}
{cycle_phase_info}

Create a detailed, practical partner guide TAILORED to her current cycle phase:

**How to Support Her Today**

1. **Her Current Phase** (explain what's happening in her body and mind RIGHT NOW based on her cycle day and menopause phase - 3-4 sentences)
2. **What She Needs Most Right Now** (be SPECIFIC to her cycle phase: during menstrual/luteal phases she needs more oxytocin, physical touch, feeling safe and secure; during follicular/ovulation phases she may welcome more activity and social engagement)
3. **5 Specific Things You Can Do Today** (tailored to her phase - e.g., during luteal: "Run her a warm bath", "Give her a long hug without needing a reason", "Cook dinner tonight"; during follicular: "Suggest an activity together", "Plan a date")
4. **What to Avoid Right Now** (3 things that won't help in this specific phase)
5. **Words That Help** (2-3 example phrases to say that match her current emotional needs)
6. **Understanding Oxytocin** (1-2 sentences about why physical touch and emotional safety are especially important for women during hormonal changes)

Be warm, empathetic, and practical. Help the partner truly UNDERSTAND what she's going through.
This is about building connection, not just managing symptoms."""
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"partner-{user_id}-{datetime.utcnow().strftime('%Y%m%d')}",
            system_message="You are a warm, practical relationship coach helping partners support women through menopause."
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {"tips": response, "phase": phase, "generated_at": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Partner tips error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate partner tips.")


class PartnerSettingsUpdate(BaseModel):
    partner_email: Optional[str] = None
    partner_update_frequency: Optional[str] = None

@router.patch("/partner-settings")
async def update_partner_settings(
    settings: PartnerSettingsUpdate,
    current_user = Depends(get_current_user)
):
    update_data = {}
    if settings.partner_email is not None:
        update_data["partner_email"] = settings.partner_email
    if settings.partner_update_frequency is not None:
        update_data["partner_update_frequency"] = settings.partner_update_frequency
        
    if update_data:
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_data}
        )
    return {"status": "success", "message": "Partner settings updated"}

# ==================== HEALTH REPORT ====================

@router.get("/health-report")
async def generate_health_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """Generate a printable health report for doctor visits"""
    user_id = str(current_user["_id"])
    
    if not end_date:
        end_date = datetime.utcnow().strftime('%Y-%m-%d')
    if not start_date:
        start_date = (datetime.utcnow() - timedelta(days=30)).strftime('%Y-%m-%d')
    
    # Get symptom logs
    logs = await db.symptom_logs.find({
        "user_id": user_id,
        "date": {"$gte": start_date, "$lte": end_date}
    }).sort("date", -1).to_list(1000)
    
    # Get daily check-ins
    checkins = await db.daily_checkins.find({
        "user_id": user_id,
        "date": {"$gte": start_date, "$lte": end_date}
    }).sort("date", -1).to_list(1000)
    
    # Aggregate symptom frequency
    symptom_frequency = {}
    symptom_severity_avg = {}
    for log in logs:
        for symptom in log.get("symptoms", []):
            symptom_frequency[symptom] = symptom_frequency.get(symptom, 0) + 1
            severity = log.get("severity", {}).get(symptom, 3)
            if symptom not in symptom_severity_avg:
                symptom_severity_avg[symptom] = []
            symptom_severity_avg[symptom].append(severity)
    
    # Calculate averages
    for symptom in symptom_severity_avg:
        values = symptom_severity_avg[symptom]
        symptom_severity_avg[symptom] = round(sum(values) / len(values), 1)
    
    # Mood/energy trends
    avg_mood = 0
    avg_energy = 0
    avg_sleep = 0
    period_days = 0
    if checkins:
        avg_mood = round(sum(c.get("mood", 3) for c in checkins) / len(checkins), 1)
        avg_energy = round(sum(c.get("energy_level", 3) for c in checkins) / len(checkins), 1)
        avg_sleep = round(sum(c.get("sleep_quality", 3) for c in checkins) / len(checkins), 1)
        period_days = sum(1 for c in checkins if c.get("period_active", False))
    
    # Sort symptoms by frequency
    top_symptoms = sorted(symptom_frequency.items(), key=lambda x: x[1], reverse=True)
    
    report = {
        "patient_name": current_user.get("name", ""),
        "menopause_phase": current_user.get("menopause_phase", "Not specified"),
        "age": current_user.get("age"),
        "report_period": {"start": start_date, "end": end_date},
        "total_days_tracked": len(set(log["date"] for log in logs)),
        "total_checkins": len(checkins),
        "top_symptoms": [{"name": s[0], "frequency": s[1], "avg_severity": symptom_severity_avg.get(s[0], 0)} for s in top_symptoms[:15]],
        "all_symptoms_logged": list(symptom_frequency.keys()),
        "averages": {
            "mood": avg_mood,
            "energy": avg_energy,
            "sleep_quality": avg_sleep
        },
        "period_tracking": {
            "days_with_period": period_days,
            "period_dates": [c["date"] for c in checkins if c.get("period_active", False)]
        },
        "daily_log_details": [
            {
                "date": log["date"],
                "symptoms": log.get("symptoms", []),
                "severity": log.get("severity", {}),
                "notes": log.get("notes", "")
            }
            for log in logs[:30]
        ],
        "generated_at": datetime.utcnow().isoformat(),
        "disclaimer": "This report is generated from self-reported data and is intended to support discussions with your healthcare provider. It does not constitute medical diagnosis or advice."
    }
    
    return report

