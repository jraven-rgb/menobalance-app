from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from datetime import datetime
from bson import ObjectId
from backend.database import db
from backend.models.models import *
from backend.routers.auth import get_current_user, get_current_user_dict

router = APIRouter()

# ==================== DAILY CHECK-IN ENDPOINTS ====================

@router.post("/daily-checkin", response_model=DailyCheckin)
async def create_daily_checkin(data: DailyCheckinCreate, current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    existing = await db.daily_checkins.find_one({
        "user_id": user_id,
        "date": data.date
    })
    
    if existing:
        await db.daily_checkins.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "mood": data.mood,
                "energy_level": data.energy_level,
                "sleep_quality": data.sleep_quality,
                "symptoms": data.symptoms,
                "symptom_severity": data.symptom_severity,
                "cycle_day": data.cycle_day,
                "period_active": data.period_active,
                "notes": data.notes,
                "updated_at": datetime.utcnow()
            }}
        )
        checkin_id = str(existing["_id"])
    else:
        checkin_doc = {
            "user_id": user_id,
            "date": data.date,
            "mood": data.mood,
            "energy_level": data.energy_level,
            "sleep_quality": data.sleep_quality,
            "symptoms": data.symptoms,
            "symptom_severity": data.symptom_severity,
            "cycle_day": data.cycle_day,
            "period_active": data.period_active,
            "notes": data.notes,
            "created_at": datetime.utcnow()
        }
        result = await db.daily_checkins.insert_one(checkin_doc)
        checkin_id = str(result.inserted_id)
    
    return DailyCheckin(
        id=checkin_id,
        user_id=user_id,
        date=data.date,
        mood=data.mood,
        energy_level=data.energy_level,
        sleep_quality=data.sleep_quality,
        symptoms=data.symptoms,
        symptom_severity=data.symptom_severity,
        cycle_day=data.cycle_day,
        period_active=data.period_active,
        notes=data.notes
    )

@router.get("/daily-checkin/{date}")
async def get_daily_checkin(date: str, current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    checkin = await db.daily_checkins.find_one({
        "user_id": user_id,
        "date": date
    })
    
    if not checkin:
        return None
    
    return DailyCheckin(
        id=str(checkin["_id"]),
        user_id=checkin["user_id"],
        date=checkin["date"],
        mood=checkin["mood"],
        energy_level=checkin["energy_level"],
        sleep_quality=checkin["sleep_quality"],
        symptoms=checkin["symptoms"],
        symptom_severity=checkin["symptom_severity"],
        cycle_day=checkin.get("cycle_day"),
        period_active=checkin.get("period_active", False),
        notes=checkin.get("notes"),
        created_at=checkin.get("created_at", datetime.utcnow())
    )

@router.get("/daily-checkin")
async def get_daily_checkins(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    query = {"user_id": user_id}
    
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["date"] = {"$gte": start_date}
    elif end_date:
        query["date"] = {"$lte": end_date}
    
    checkins = await db.daily_checkins.find(query).sort("date", -1).to_list(100)
    return [
        DailyCheckin(
            id=str(c["_id"]),
            user_id=c["user_id"],
            date=c["date"],
            mood=c["mood"],
            energy_level=c["energy_level"],
            sleep_quality=c["sleep_quality"],
            symptoms=c["symptoms"],
            symptom_severity=c["symptom_severity"],
            cycle_day=c.get("cycle_day"),
            period_active=c.get("period_active", False),
            notes=c.get("notes"),
            created_at=c.get("created_at", datetime.utcnow())
        )
        for c in checkins
    ]

# ==================== SYMPTOM ENDPOINTS ====================

@router.get("/symptoms")
async def get_symptoms(language: str = "en"):
    symptoms = []
    for s in SYMPTOMS_DATA:
        if language == "de":
            symptoms.append({
                "name": s["name_de"],
                "name_en": s["name"],
                "description": s["description_de"],
                "category": s["category_de"],
                "tips": s["tips_de"],
                "related_hormones": s["related_hormones"],
                "severity_warning": s["severity_warning"]
            })
        else:
            symptoms.append({
                "name": s["name"],
                "name_de": s["name_de"],
                "description": s["description"],
                "category": s["category"],
                "tips": s["tips"],
                "related_hormones": s["related_hormones"],
                "severity_warning": s["severity_warning"]
            })
    return symptoms

@router.get("/symptoms/categories")
async def get_symptom_categories(language: str = "en"):
    if language == "de":
        categories = list(set(s["category_de"] for s in SYMPTOMS_DATA))
    else:
        categories = list(set(s["category"] for s in SYMPTOMS_DATA))
    return {"categories": sorted(categories)}

@router.get("/hormones")
async def get_hormones(language: str = "en"):
    hormones = []
    for key, h in HORMONES_DATA.items():
        if language == "de":
            hormones.append({
                "id": key,
                "name": h["name_de"],
                "description": h["description_de"],
                "effects": h["effects_de"]
            })
        else:
            hormones.append({
                "id": key,
                "name": h["name"],
                "description": h["description"],
                "effects": h["effects"]
            })
    return hormones

@router.post("/symptom-logs", response_model=SymptomLog)
async def create_symptom_log(log_data: SymptomLogCreate, current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Check for severe symptoms and add warning
    severe_symptoms = []
    for symptom_name, severity in log_data.severity.items():
        if severity >= 4:
            for s in SYMPTOMS_DATA:
                if s["name"] == symptom_name and s.get("severity_warning"):
                    severe_symptoms.append(symptom_name)
    
    existing = await db.symptom_logs.find_one({
        "user_id": user_id,
        "date": log_data.date
    })
    
    if existing:
        await db.symptom_logs.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "symptoms": log_data.symptoms,
                "severity": log_data.severity,
                "notes": log_data.notes,
                "updated_at": datetime.utcnow()
            }}
        )
        log_id = str(existing["_id"])
    else:
        log_doc = {
            "user_id": user_id,
            "date": log_data.date,
            "symptoms": log_data.symptoms,
            "severity": log_data.severity,
            "notes": log_data.notes,
            "created_at": datetime.utcnow()
        }
        result = await db.symptom_logs.insert_one(log_doc)
        log_id = str(result.inserted_id)
    
    response = SymptomLog(
        id=log_id,
        user_id=user_id,
        date=log_data.date,
        symptoms=log_data.symptoms,
        severity=log_data.severity,
        notes=log_data.notes
    )
    
    return response

@router.get("/symptom-logs")
async def get_symptom_logs(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    query = {"user_id": user_id}
    
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["date"] = {"$gte": start_date}
    elif end_date:
        query["date"] = {"$lte": end_date}
    
    logs = await db.symptom_logs.find(query).sort("date", -1).to_list(100)
    return [
        SymptomLog(
            id=str(log["_id"]),
            user_id=log["user_id"],
            date=log["date"],
            symptoms=log["symptoms"],
            severity=log["severity"],
            notes=log.get("notes"),
            created_at=log.get("created_at", datetime.utcnow())
        )
        for log in logs
    ]

@router.get("/symptom-logs/{date}")
async def get_symptom_log_by_date(date: str, current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    log = await db.symptom_logs.find_one({
        "user_id": user_id,
        "date": date
    })
    
    if not log:
        return None
    
    return SymptomLog(
        id=str(log["_id"]),
        user_id=log["user_id"],
        date=log["date"],
        symptoms=log["symptoms"],
        severity=log["severity"],
        notes=log.get("notes"),
        created_at=log.get("created_at", datetime.utcnow())
    )

# ==================== CYCLE PHASES ENDPOINT ====================

@router.get("/cycle-phases")
async def get_cycle_phases(language: str = "en"):
    lang = "de" if language == "de" else "en"
    return {"phases": CYCLE_PHASES_DATA[lang]}

