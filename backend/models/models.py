from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OnboardingData(BaseModel):
    age: Optional[int] = None
    height: Optional[float] = None  # in cm
    weight: Optional[float] = None  # in kg
    last_period_date: Optional[str] = None  # YYYY-MM-DD
    cycle_length: Optional[int] = None  # days
    menopause_phase: Optional[str] = None
    current_symptoms: Optional[List[str]] = None
    goals: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    dietary_restrictions: Optional[List[str]] = None
    exercise_experience: Optional[str] = None  # none, beginner, intermediate, advanced
    sleep_patterns: Optional[str] = None  # good, fair, poor
    health_conditions: Optional[List[str]] = None
    language: Optional[str] = "en"  # en or de

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    menopause_phase: Optional[str] = None
    onboarding_completed: bool = False
    language: str = "en"
    partner_email: Optional[EmailStr] = None
    partner_update_frequency: Optional[str] = "manual"
    created_at: datetime

class UserProfileFull(BaseModel):
    id: str
    email: str
    name: str
    menopause_phase: Optional[str] = None
    onboarding_completed: bool = False
    language: str = "en"
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    last_period_date: Optional[str] = None
    cycle_length: Optional[int] = None
    current_symptoms: Optional[List[str]] = None
    goals: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    dietary_restrictions: Optional[List[str]] = None
    exercise_experience: Optional[str] = None
    sleep_patterns: Optional[str] = None
    health_conditions: Optional[List[str]] = None
    partner_email: Optional[EmailStr] = None
    partner_update_frequency: Optional[str] = "manual"
    created_at: datetime

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    menopause_phase: Optional[str] = None
    language: Optional[str] = None
    partner_email: Optional[EmailStr] = None
    partner_update_frequency: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

class DailyCheckin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: str  # YYYY-MM-DD
    mood: int  # 1-5
    energy_level: int  # 1-5
    sleep_quality: int  # 1-5
    symptoms: List[str]
    symptom_severity: Dict[str, int]  # symptom_name: 1-5
    cycle_day: Optional[int] = None
    period_active: bool = False
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DailyCheckinCreate(BaseModel):
    date: str
    mood: int
    energy_level: int
    sleep_quality: int
    symptoms: List[str]
    symptom_severity: Dict[str, int]
    cycle_day: Optional[int] = None
    period_active: bool = False
    notes: Optional[str] = None

class SymptomLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: str
    symptoms: List[str]
    severity: dict
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SymptomLogCreate(BaseModel):
    date: str
    symptoms: List[str]
    severity: dict
    notes: Optional[str] = None

class SymptomInfo(BaseModel):
    name: str
    name_de: str
    description: str
    description_de: str
    category: str
    category_de: str
    tips: List[str]
    tips_de: List[str]
    related_hormones: List[str]
    severity_warning: bool = False

class AIAdviceRequest(BaseModel):
    category: str
    symptoms: Optional[List[str]] = None
    phase: Optional[str] = None
    language: Optional[str] = "en"

class AIAdviceResponse(BaseModel):
    advice: str
    category: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class ForumComment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str
    content: str
    author_alias: str = "Anonymous"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ForumPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    author_alias: str = "Anonymous"
    category: str
    title: str
    content: str
    likes: int = 0
    comments_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ForumPostCreate(BaseModel):
    category: str
    title: str
    content: str
