from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from datetime import datetime
from bson import ObjectId
from backend.database import db
from backend.models.models import *
from backend.routers.auth import get_current_user, get_current_user_dict

router = APIRouter()

# ==================== AI ADVICE ENDPOINTS ====================

@router.post("/advice", response_model=AIAdviceResponse)
async def get_ai_advice(request: AIAdviceRequest, current_user = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    user_data = current_user
    phase = request.phase or user_data.get("menopause_phase") or "menopause"
    symptoms_list = request.symptoms or user_data.get("current_symptoms") or []
    language = request.language or user_data.get("language", "en")
    
    # Get user context
    age = user_data.get("age", "")
    health_conditions = user_data.get("health_conditions", [])
    dietary_restrictions = user_data.get("dietary_restrictions", [])
    exercise_experience = user_data.get("exercise_experience", "beginner")
    goals = user_data.get("goals", [])
    
    lang_instruction = "Respond in German." if language == "de" else "Respond in English."
    
    user_context = f"""
User Profile:
- Menopause Phase: {phase}
- Age: {age if age else 'Not specified'}
- Current Symptoms: {', '.join(symptoms_list) if symptoms_list else 'None specified'}
- Health Conditions: {', '.join(health_conditions) if health_conditions else 'None specified'}
- Dietary Restrictions: {', '.join(dietary_restrictions) if dietary_restrictions else 'None'}
- Exercise Experience: {exercise_experience}
- Goals: {', '.join(goals) if goals else 'General wellness'}
"""
    
    category_prompts = {
        "diet": f"""You are a menopause wellness nutrition expert. {lang_instruction}

{user_context}

Provide comprehensive dietary advice including:
1. **Foods to Include** - Specific foods that help with menopause symptoms
2. **Foods to Avoid** - Foods that may worsen symptoms
3. **Herbs & Spices** - Natural remedies like black cohosh, red clover, sage, maca root, turmeric, ginger, ashwagandha etc.
4. **Anti-Inflammatory Foods** - Especially important for those with endometriosis or inflammation
5. **Hydration Tips**

6. **Breakfast Recipe** - One detailed healthy breakfast recipe with ingredients and simple instructions (e.g., Golden Turmeric Overnight Oats, Anti-Inflammatory Smoothie Bowl)
7. **Lunch Recipe** - One detailed healthy lunch recipe with ingredients and instructions (e.g., Mediterranean Salmon Bowl, Hormone-Balancing Buddha Bowl)
8. **Dinner Recipe** - One detailed healthy dinner recipe with ingredients and instructions (e.g., Herbed Baked Chicken with Roasted Veggies, Omega-Rich Fish with Greens)
9. **Snack Ideas** - 3-4 quick healthy snack ideas (e.g., Hormone-Balancing Trail Mix, Flaxseed Energy Balls)

Vary the recipes each time. Make them delicious, easy to prepare (under 30 min), and specifically beneficial for menopause symptoms.
If the user has endometriosis or inflammation-related conditions, provide anti-inflammatory recipe options.

Be warm, supportive, and actionable. Always recommend consulting a healthcare provider before starting supplements.""",

        "exercise": f"""You are a menopause wellness fitness expert. {lang_instruction}

{user_context}

Today is {datetime.utcnow().strftime('%A')}.

Structure your response EXACTLY as follows:

1. **Monday** - [Exercise type] (30 min)
   - List 3-4 specific exercises with reps/duration (e.g., "Lunges: 3 sets of 12", "Plank: 3 x 30 seconds")
   
2. **Tuesday** - [Exercise type] (30 min)
   - List 3-4 specific exercises with reps/duration

3. **Wednesday** - [Exercise type] (30 min)
   - List 3-4 specific exercises with reps/duration

4. **Thursday** - [Exercise type] (30 min)
   - List 3-4 specific exercises with reps/duration

5. **Friday** - [Exercise type] (30 min)
   - List 3-4 specific exercises with reps/duration

6. **Saturday** - [Exercise type] (30-45 min)
   - List 3-4 specific exercises or activities

7. **Sunday** - Rest & Recovery
   - Gentle stretching or walking

Then after the weekly plan, add:

8. **Exercise Benefits** - How these exercises help with menopause symptoms
9. **Tai Chi** - Recommend Tai Chi as excellent for balance, stress, and menopause. Include that it improves bone density and reduces hot flashes.
10. **Modifications** - Based on fitness level
11. **Warning Signs** - When to stop and rest

Use a mix of: strength training, cardio, yoga, pilates, stretching, walking, swimming, tai chi.
For each exercise, use the common name (Lunges, Squats, Plank, Bridge, Cat-Cow, Warrior Pose, etc.) so users can look them up.""",

        "sleep": f"""You are a menopause wellness sleep specialist. {lang_instruction}

{user_context}

Provide comprehensive sleep guidance including:
1. **Bedtime Routine** - Step-by-step evening routine
2. **Sleep Environment** - Optimal bedroom setup for menopause
3. **Managing Night Sweats** - Practical tips and products
4. **Dealing with Insomnia** - Evidence-based strategies
5. **Natural Sleep Aids** - Herbs, supplements, techniques
6. **Relaxation Techniques** - Before bed practices
7. **When to Seek Help** - Signs that warrant professional consultation

Be calming and practical in your advice.""",

        "supplements": f"""You are a menopause wellness supplement advisor. {lang_instruction}

{user_context}

Provide detailed supplement information including:
1. **Essential Supplements** for menopause:
   - Vitamin D & Calcium (bone health)
   - Magnesium (sleep, mood, muscles)
   - Omega-3 fatty acids (brain, heart, inflammation)
   - B vitamins (energy, mood)
   - Iron (if still menstruating)

2. **Herbal Supplements**:
   - Black Cohosh (hot flashes)
   - Red Clover (phytoestrogens)
   - Sage (sweating)
   - Maca Root (energy, libido)
   - Evening Primrose Oil (skin, mood)
   - Valerian Root (sleep)
   - St. John's Wort (mood - with cautions)

3. **For Each Supplement** explain:
   - Benefits for menopause symptoms
   - Recommended dosage
   - Potential interactions
   - Quality considerations

IMPORTANT DISCLAIMER TO INCLUDE AT THE END:
"⚠️ Medical Disclaimer: The supplement dosages mentioned are general guidance only and may vary by country and individual health conditions. Always consult your healthcare provider or pharmacist before starting any supplement, especially if you are taking medications. This information does not replace professional medical advice."

Always include this disclaimer verbatim at the end of your response.""",

        "breathing": f"""You are a menopause wellness relaxation coach. {lang_instruction}

{user_context}

Provide calming relaxation guidance including:
1. **Breathing Exercises** - Step-by-step instructions:
   - 4-7-8 breathing technique
   - Box breathing
   - Paced breathing for hot flashes
   - Diaphragmatic breathing

2. **Quick Relief Techniques** - For hot flashes and anxiety
3. **Mindfulness Practices** - Simple meditation exercises
4. **Body Scan Relaxation** - Progressive muscle relaxation
5. **Daily Integration** - How to incorporate relaxation into daily life
6. **Stress Management** - Long-term strategies

Use a soothing tone and clear, easy-to-follow instructions."""
    }
    
    prompt = category_prompts.get(request.category, category_prompts["diet"])
    
    try:
        if request.category == 'mental' and phase.lower() == 'luteal':
            prompt += "\nCRITICAL INSTRUCTION: The user is in her Luteal Phase and seeking mental wellness. You MUST strictly prescribe step-by-step CBT grounding exercises (such as the 5-4-3-2-1 Sensory Technique or a thought-challenging diary prompt) to directly combat luteal-induced anxiety/depression before suggesting general lifestyle tips."

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"advice-{str(current_user['_id'])}-{request.category}",
            system_message="You are a wellness expert using the Raven Brand voice: Direct, intellectually grounded, not academic. Empowering, not patronizing. Uses science + metaphor together (quantum biology meets lived experience). Never clinical-cold, never woo-woo-soft — the exact middle. Always remind users to consult healthcare professionals for medical concerns."
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return AIAdviceResponse(
            advice=response,
            category=request.category
        )
    except Exception as e:
        logger.error(f"AI advice error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate advice. Please try again.")

# ==================== PERSONALIZED TIPS ====================

@router.get("/daily-tip")
async def get_daily_tip(current_user = Depends(get_current_user)):
    """Get a personalized daily tip based on user's profile and recent check-ins"""
    user_id = str(current_user["_id"])
    language = current_user.get("language", "en")
    
    # Get recent check-in
    recent_checkin = await db.daily_checkins.find_one(
        {"user_id": user_id},
        sort=[("date", -1)]
    )
    
    tips_en = [
        {"tip": "Stay hydrated throughout the day. Drinking water can help manage hot flashes and support overall well-being.", "category": "hydration"},
        {"tip": "Try a 10-minute walk after meals to help with digestion and energy levels.", "category": "exercise"},
        {"tip": "Consider keeping a small fan or cooling spray handy for sudden hot flashes.", "category": "comfort"},
        {"tip": "Practice deep breathing when you feel stressed - even 5 deep breaths can help.", "category": "relaxation"},
        {"tip": "Aim for 7-8 hours of sleep. Create a cool, dark sleeping environment.", "category": "sleep"},
        {"tip": "Include calcium-rich foods like leafy greens and yogurt in your diet today.", "category": "nutrition"},
        {"tip": "Take a moment for yourself today - self-care isn't selfish, it's necessary.", "category": "self-care"},
    ]
    
    tips_de = [
        {"tip": "Bleiben Sie den ganzen Tag über hydriert. Wasser trinken kann helfen, Hitzewallungen zu kontrollieren.", "category": "hydration"},
        {"tip": "Versuchen Sie einen 10-minütigen Spaziergang nach den Mahlzeiten für Verdauung und Energie.", "category": "exercise"},
        {"tip": "Halten Sie einen kleinen Ventilator oder ein Kühlspray für plötzliche Hitzewallungen bereit.", "category": "comfort"},
        {"tip": "Üben Sie tiefes Atmen bei Stress - schon 5 tiefe Atemzüge können helfen.", "category": "relaxation"},
        {"tip": "Streben Sie 7-8 Stunden Schlaf an. Schaffen Sie eine kühle, dunkle Schlafumgebung.", "category": "sleep"},
        {"tip": "Essen Sie heute kalziumreiche Lebensmittel wie Blattgemüse und Joghurt.", "category": "nutrition"},
        {"tip": "Nehmen Sie sich heute einen Moment für sich - Selbstfürsorge ist nicht egoistisch, sondern notwendig.", "category": "self-care"},
    ]
    
    tips = tips_de if language == "de" else tips_en
    
    # Add period-specific tip if applicable
    if recent_checkin and recent_checkin.get("period_active"):
        if language == "de":
            tips.insert(0, {"tip": "Während Ihrer Periode ist es besonders wichtig, sich zusätzliche Ruhe zu gönnen. Hören Sie auf Ihren Körper.", "category": "period"})
        else:
            tips.insert(0, {"tip": "During your period, it's especially important to allow yourself extra rest. Listen to your body.", "category": "period"})
    
    # Return a tip (could be randomized or based on user profile)
    import random
    selected_tip = random.choice(tips)
    
    return selected_tip

# ==================== PHASE INFO ENDPOINT ====================

@router.get("/phases")
async def get_menopause_phases(language: str = "en"):
    if language == "de":
        return {
            "phases": [
                {
                    "id": "perimenopause",
                    "name": "Perimenopause",
                    "description": "Die Übergangsphase zur Menopause, beginnt typischerweise in den 40ern. Hormonspiegel beginnen zu schwanken.",
                    "typical_age": "40-51 Jahre",
                    "duration": "Durchschnittlich 4-8 Jahre",
                    "key_changes": ["Unregelmäßige Perioden", "Schwankende Hormonspiegel", "Beginn der Menopause-Symptome"]
                },
                {
                    "id": "menopause",
                    "name": "Menopause",
                    "description": "Offiziell erreicht nach 12 aufeinanderfolgenden Monaten ohne Menstruation. Markiert das Ende der reproduktiven Jahre.",
                    "typical_age": "51 Jahre (Durchschnitt)",
                    "duration": "Ein Zeitpunkt",
                    "key_changes": ["Letzte Menstruation", "Signifikante hormonelle Veränderungen", "Oft Höhepunkt der Symptome"]
                },
                {
                    "id": "postmenopause",
                    "name": "Postmenopause",
                    "description": "Die Jahre nach der Menopause. Während einige Symptome nachlassen können, ist es wichtig, sich auf die langfristige Gesundheit zu konzentrieren.",
                    "typical_age": "Nach 51",
                    "duration": "Rest des Lebens",
                    "key_changes": ["Stabilisierende Hormonspiegel", "Symptome verbessern sich oft", "Fokus auf Knochen- und Herzgesundheit"]
                }
            ]
        }
    
    return {
        "phases": [
            {
                "id": "perimenopause",
                "name": "Perimenopause",
                "description": "The transitional phase leading up to menopause, typically starting in your 40s. Hormone levels begin to fluctuate.",
                "typical_age": "40-51 years",
                "duration": "4-8 years on average",
                "key_changes": ["Irregular periods", "Fluctuating hormone levels", "Beginning of menopause symptoms"]
            },
            {
                "id": "menopause",
                "name": "Menopause",
                "description": "Officially reached when you've gone 12 consecutive months without a menstrual period.",
                "typical_age": "51 years (average)",
                "duration": "A point in time",
                "key_changes": ["Final menstrual period", "Significant hormonal shifts", "Often peak of symptoms"]
            },
            {
                "id": "postmenopause",
                "name": "Postmenopause",
                "description": "The years after menopause. While some symptoms may decrease, focus on long-term health.",
                "typical_age": "After 51",
                "duration": "Rest of life",
                "key_changes": ["Stabilizing hormone levels", "Symptoms often improve", "Focus on bone and heart health"]
            }
        ]
    }

# ==================== DAILY WELLNESS ROUTINES ====================

class DailyRoutineRequest(BaseModel):
    routine_type: str  # yoga, pelvic_floor, affirmation
    language: Optional[str] = "en"

class DailyRoutineResponse(BaseModel):
    content: str
    routine_type: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)

@router.post("/daily-routine", response_model=DailyRoutineResponse)
async def get_daily_routine(request: DailyRoutineRequest, current_user = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    user_data = current_user
    phase = user_data.get("menopause_phase") or "menopause"
    symptoms_list = user_data.get("current_symptoms") or []
    language = request.language or user_data.get("language", "en")
    age = user_data.get("age", "")
    exercise_experience = user_data.get("exercise_experience", "beginner")
    
    lang_instruction = "Respond in German." if language == "de" else "Respond in English."
    
    user_context = f"""
User: Phase: {phase}, Age: {age if age else 'Not specified'}, 
Symptoms: {', '.join(symptoms_list[:5]) if symptoms_list else 'General menopause symptoms'}, 
Exercise Level: {exercise_experience}
"""
    
    routine_prompts = {
        "yoga": f"""You are a certified yoga instructor specializing in women's health during menopause. {lang_instruction}

{user_context}

Create a personalized 20-minute daily yoga routine. Format it as a clear, step-by-step sequence:

**Today's Yoga Flow** (20 minutes)

For each pose include:
- Pose name 
- Duration (in breaths or seconds)
- Simple instructions (2-3 sentences max)
- Benefit for menopause symptoms

Include:
1. **Warm-Up** (3 min) - Gentle neck rolls, cat-cow, seated stretches
2. **Standing Poses** (7 min) - Warrior variations, tree pose, triangle
3. **Floor Poses** (7 min) - Pigeon, bridge, legs up the wall
4. **Cool-Down & Savasana** (3 min) - Gentle twists, final relaxation

Vary the routine each time. Adapt to their symptoms and experience level. Use a warm, encouraging tone.""",

        "pelvic_floor": f"""You are a women's health physiotherapist. {lang_instruction}

{user_context}

Create a SHORT 5-minute morning-in-bed pelvic floor strengthening routine. This should be gentle exercises a woman can do lying in bed right after waking up.

Format clearly with:
**Morning Pelvic Floor Routine** (5 minutes, in bed)

Include exactly 4-5 exercises:
- Exercise name
- Duration/repetitions
- Clear, simple instructions
- Why it helps (one sentence)

Focus on:
1. Kegel variations (slow & fast)
2. Bridge lifts (gentle)
3. Inner thigh squeeze
4. Deep belly breathing with pelvic activation
5. Gentle hip circles

Use warm, encouraging language. Remind that consistency matters more than intensity.""",

        "affirmation": f"""You are a compassionate women's wellness coach specializing in menopause. {lang_instruction}

{user_context}

Create a personalized morning affirmation and positive start to the day. Include:

**Your Morning Affirmation**

1. One powerful, personal affirmation (2-3 sentences) that addresses their current phase and symptoms
2. A brief gratitude prompt (1 sentence)  
3. An intention for the day (1 sentence)
4. A comforting reminder about their journey (1-2 sentences)

The affirmation should:
- Be warm, empowering, and specific to menopause
- Acknowledge their challenges without focusing on them
- Emphasize strength, wisdom, and self-compassion
- Feel personal, not generic
- Vary each time - draw from themes of: inner strength, body wisdom, transformation, self-love, resilience, new beginnings

Do NOT use cliché phrases. Make it feel like a wise, caring friend speaking.""",

        "cortisol_reset": f"""You are a master of Cortisol Alchemy and quantum biology. {lang_instruction}

{user_context}

Create a powerful 5-minute Cortisol Reset routine for women in the "Meno-Morphosis". 

Format clearly with:
**Cortisol Alchemy Reset** (5 minutes)

Include exactly 4 focused steps:
1. **Nervous System Grounding** (e.g., physiological sigh, vagus nerve stimulation)
2. **Biological Sovereignty Check** (a powerful mental reframe about taking control of their biology)
3. **Somatic Release** (a quick physical movement to release stored stress)
4. **The Alchemist's Intention** (a strong, sovereign closing thought)

Use the Raven Voice: Direct, intellectually deep, empowering. Blend biological facts (cortisol, vagal tone) with the concept of mastering one's own matrix. No fluff."""
    }
    
    prompt = routine_prompts.get(request.routine_type, routine_prompts["affirmation"])
    
    try:
        if request.routine_type in ['affirmation', 'cortisol_reset'] and phase.lower() == 'luteal':
            prompt += "\nCRITICAL INSTRUCTION: The user is in her Luteal Phase. You MUST strictly prescribe step-by-step CBT grounding exercises (such as the 5-4-3-2-1 Sensory Technique or a thought-challenging diary prompt) to directly combat luteal-induced anxiety/depression before suggesting general lifestyle tips."

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"routine-{str(current_user['_id'])}-{request.routine_type}-{datetime.utcnow().strftime('%Y%m%d%H')}",
            system_message="You are a wellness expert using the Raven Brand voice: Direct, intellectually grounded, empowering. Uses science + metaphor together. Never clinical-cold, never woo-woo-soft — the exact middle."
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return DailyRoutineResponse(
            content=response,
            routine_type=request.routine_type
        )
    except Exception as e:
        logger.error(f"Daily routine error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate routine. Please try again.")

