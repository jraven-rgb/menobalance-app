from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import bcrypt
import jwt
from datetime import datetime, timedelta
from bson import ObjectId
from backend.models.models import *

from backend.database import db

router = APIRouter()
security = HTTPBearer()

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user_dict(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "menopause_phase": user.get("menopause_phase"),
        "onboarding_completed": user.get("onboarding_completed", False),
        "language": user.get("language", "en"),
        "created_at": user.get("created_at", datetime.utcnow())
    }


# ==================== AUTH ENDPOINTS ====================

@router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "email": user_data.email.lower(),
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "menopause_phase": None,
        "onboarding_completed": False,
        "language": "en",
        "created_at": datetime.utcnow()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = create_access_token(user_id)
    
    return TokenResponse(
        access_token=token,
        user=UserProfile(
            id=user_id,
            email=user_data.email.lower(),
            name=user_data.name,
            menopause_phase=None,
            onboarding_completed=False,
            language="en",
            created_at=user_doc["created_at"]
        )
    )

@router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email.lower()})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
    token = create_access_token(user_id)
    
    return TokenResponse(
        access_token=token,
        user=UserProfile(
            id=user_id,
            email=user["email"],
            name=user["name"],
            menopause_phase=user.get("menopause_phase"),
            onboarding_completed=user.get("onboarding_completed", False),
            language=user.get("language", "en"),
            created_at=user.get("created_at", datetime.utcnow())
        )
    )

@router.get("/auth/me")
async def get_me(current_user = Depends(get_current_user)):
    return UserProfileFull(
        id=str(current_user["_id"]),
        email=current_user["email"],
        name=current_user["name"],
        menopause_phase=current_user.get("menopause_phase"),
        onboarding_completed=current_user.get("onboarding_completed", False),
        language=current_user.get("language", "en"),
        age=current_user.get("age"),
        height=current_user.get("height"),
        weight=current_user.get("weight"),
        last_period_date=current_user.get("last_period_date"),
        cycle_length=current_user.get("cycle_length"),
        current_symptoms=current_user.get("current_symptoms"),
        goals=current_user.get("goals"),
        medications=current_user.get("medications"),
        dietary_restrictions=current_user.get("dietary_restrictions"),
        exercise_experience=current_user.get("exercise_experience"),
        sleep_patterns=current_user.get("sleep_patterns"),
        health_conditions=current_user.get("health_conditions"),
        created_at=current_user.get("created_at", datetime.utcnow())
    )

@router.put("/auth/profile")
async def update_profile(update_data: UserProfileUpdate, current_user = Depends(get_current_user)):
    update_fields = {}
    if update_data.name is not None:
        update_fields["name"] = update_data.name
    if update_data.menopause_phase is not None:
        update_fields["menopause_phase"] = update_data.menopause_phase
    if update_data.language is not None:
        update_fields["language"] = update_data.language
    
    if update_fields:
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_fields}
        )
    
    user = await db.users.find_one({"_id": current_user["_id"]})
    return UserProfile(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        menopause_phase=user.get("menopause_phase"),
        onboarding_completed=user.get("onboarding_completed", False),
        language=user.get("language", "en"),
        created_at=user.get("created_at", datetime.utcnow())
    )

@router.post("/auth/onboarding")
async def complete_onboarding(data: OnboardingData, current_user = Depends(get_current_user)):
    update_fields = {
        "onboarding_completed": True
    }
    
    if data.age is not None:
        update_fields["age"] = data.age
    if data.height is not None:
        update_fields["height"] = data.height
    if data.weight is not None:
        update_fields["weight"] = data.weight
    if data.last_period_date is not None:
        update_fields["last_period_date"] = data.last_period_date
    if data.cycle_length is not None:
        update_fields["cycle_length"] = data.cycle_length
    if data.menopause_phase is not None:
        update_fields["menopause_phase"] = data.menopause_phase
    if data.current_symptoms is not None:
        update_fields["current_symptoms"] = data.current_symptoms
    if data.goals is not None:
        update_fields["goals"] = data.goals
    if data.medications is not None:
        update_fields["medications"] = data.medications
    if data.dietary_restrictions is not None:
        update_fields["dietary_restrictions"] = data.dietary_restrictions
    if data.exercise_experience is not None:
        update_fields["exercise_experience"] = data.exercise_experience
    if data.sleep_patterns is not None:
        update_fields["sleep_patterns"] = data.sleep_patterns
    if data.health_conditions is not None:
        update_fields["health_conditions"] = data.health_conditions
    if data.language is not None:
        update_fields["language"] = data.language
    
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_fields}
    )
    
    return {"message": "Onboarding completed successfully", "onboarding_completed": True}

