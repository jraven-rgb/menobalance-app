from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from backend.database import db, client

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 1 week

# LLM settings
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

from .models.models import *
# ==================== EXTENDED SYMPTOMS DATA (70+) ====================

SYMPTOMS_DATA = [
    # Temperature Symptoms
    {"name": "Hot Flashes", "name_de": "Hitzewallungen", "category": "Temperature", "category_de": "Temperatur", 
     "description": "Sudden feelings of warmth, usually most intense over the face, neck and chest.", 
     "description_de": "Plötzliche Wärmegefühle, meist am intensivsten im Gesicht, Hals und Brustbereich.",
     "tips": ["Stay hydrated", "Wear breathable fabrics", "Keep room cool", "Avoid spicy foods"],
     "tips_de": ["Viel trinken", "Atmungsaktive Kleidung tragen", "Raum kühl halten", "Scharfe Speisen meiden"],
     "related_hormones": ["Estrogen", "FSH"], "severity_warning": False},
    
    {"name": "Night Sweats", "name_de": "Nachtschweiß", "category": "Temperature", "category_de": "Temperatur",
     "description": "Hot flashes that occur during sleep, disrupting rest.",
     "description_de": "Hitzewallungen während des Schlafs, die die Nachtruhe stören.",
     "tips": ["Use moisture-wicking bedding", "Keep bedroom cool", "Avoid alcohol before bed"],
     "tips_de": ["Feuchtigkeitsableitende Bettwäsche verwenden", "Schlafzimmer kühl halten", "Alkohol vor dem Schlafengehen meiden"],
     "related_hormones": ["Estrogen", "Progesterone"], "severity_warning": False},
    
    {"name": "Cold Flashes", "name_de": "Kälteschübe", "category": "Temperature", "category_de": "Temperatur",
     "description": "Sudden feeling of cold or chills, sometimes following a hot flash.",
     "description_de": "Plötzliches Kältegefühl oder Schüttelfrost, manchmal nach einer Hitzewallung.",
     "tips": ["Keep layers handy", "Practice deep breathing"],
     "tips_de": ["Mehrere Kleidungsschichten bereithalten", "Tiefes Atmen üben"],
     "related_hormones": ["Estrogen"], "severity_warning": False},
    
    {"name": "Temperature Sensitivity", "name_de": "Temperaturempfindlichkeit", "category": "Temperature", "category_de": "Temperatur",
     "description": "Increased sensitivity to hot or cold temperatures.",
     "description_de": "Erhöhte Empfindlichkeit gegenüber Wärme oder Kälte.",
     "tips": ["Dress in layers", "Control indoor temperature"],
     "tips_de": ["Kleidung in Schichten tragen", "Raumtemperatur kontrollieren"],
     "related_hormones": ["Estrogen", "Thyroid hormones"], "severity_warning": False},

    # Sleep Issues
    {"name": "Insomnia", "name_de": "Schlaflosigkeit", "category": "Sleep", "category_de": "Schlaf",
     "description": "Difficulty falling asleep or staying asleep throughout the night.",
     "description_de": "Schwierigkeiten beim Einschlafen oder Durchschlafen.",
     "tips": ["Maintain consistent sleep schedule", "Limit screen time before bed", "Create relaxing bedtime routine"],
     "tips_de": ["Regelmäßigen Schlafrhythmus einhalten", "Bildschirmzeit vor dem Schlafengehen begrenzen", "Entspannende Schlafenszeit-Routine"],
     "related_hormones": ["Melatonin", "Progesterone", "Estrogen"], "severity_warning": False},
    
    {"name": "Sleep Disturbances", "name_de": "Schlafstörungen", "category": "Sleep", "category_de": "Schlaf",
     "description": "Waking up frequently during the night or having restless sleep.",
     "description_de": "Häufiges Aufwachen in der Nacht oder unruhiger Schlaf.",
     "tips": ["Keep room dark and quiet", "Consider white noise", "Limit fluids before bed"],
     "tips_de": ["Raum dunkel und ruhig halten", "Weißes Rauschen in Betracht ziehen", "Flüssigkeiten vor dem Schlafengehen begrenzen"],
     "related_hormones": ["Cortisol", "Progesterone"], "severity_warning": False},
    
    {"name": "Fatigue", "name_de": "Erschöpfung", "category": "Sleep", "category_de": "Schlaf",
     "description": "Persistent tiredness or exhaustion that doesn't improve with rest.",
     "description_de": "Anhaltende Müdigkeit oder Erschöpfung, die sich durch Ruhe nicht bessert.",
     "tips": ["Prioritize sleep hygiene", "Take short power naps", "Stay physically active"],
     "tips_de": ["Schlafhygiene priorisieren", "Kurze Power-Naps machen", "Körperlich aktiv bleiben"],
     "related_hormones": ["Thyroid hormones", "Cortisol", "Estrogen"], "severity_warning": True},
    
    {"name": "Vivid Dreams", "name_de": "Lebhafte Träume", "category": "Sleep", "category_de": "Schlaf",
     "description": "Unusually intense or memorable dreams that may disrupt sleep.",
     "description_de": "Ungewöhnlich intensive oder einprägsame Träume, die den Schlaf stören können.",
     "tips": ["Avoid heavy meals before bed", "Practice relaxation techniques"],
     "tips_de": ["Schwere Mahlzeiten vor dem Schlafengehen vermeiden", "Entspannungstechniken üben"],
     "related_hormones": ["Progesterone", "Serotonin"], "severity_warning": False},
    
    {"name": "Sleep Apnea Symptoms", "name_de": "Schlafapnoe-Symptome", "category": "Sleep", "category_de": "Schlaf",
     "description": "Breathing interruptions during sleep, snoring, gasping for air.",
     "description_de": "Atemunterbrechungen während des Schlafs, Schnarchen, nach Luft schnappen.",
     "tips": ["Sleep on your side", "Maintain healthy weight", "Consult a sleep specialist"],
     "tips_de": ["Auf der Seite schlafen", "Gesundes Gewicht halten", "Schlafspezialisten konsultieren"],
     "related_hormones": ["Progesterone"], "severity_warning": True},

    # Mood & Mental
    {"name": "Mood Swings", "name_de": "Stimmungsschwankungen", "category": "Mood", "category_de": "Stimmung",
     "description": "Rapid and unpredictable changes in emotional state.",
     "description_de": "Schnelle und unvorhersehbare Veränderungen des emotionalen Zustands.",
     "tips": ["Practice mindfulness", "Regular exercise", "Talk to someone you trust"],
     "tips_de": ["Achtsamkeit üben", "Regelmäßige Bewegung", "Mit jemandem sprechen, dem Sie vertrauen"],
     "related_hormones": ["Estrogen", "Progesterone", "Serotonin"], "severity_warning": False},
    
    {"name": "Anxiety", "name_de": "Angst", "category": "Mood", "category_de": "Stimmung",
     "description": "Feelings of worry, nervousness, or unease that may be more intense than before.",
     "description_de": "Gefühle von Sorge, Nervosität oder Unbehagen, die intensiver sein können als zuvor.",
     "tips": ["Deep breathing exercises", "Limit caffeine", "Regular physical activity"],
     "tips_de": ["Tiefe Atemübungen", "Koffein begrenzen", "Regelmäßige körperliche Aktivität"],
     "related_hormones": ["Estrogen", "Progesterone", "Cortisol"], "severity_warning": True},
    
    {"name": "Depression", "name_de": "Depression", "category": "Mood", "category_de": "Stimmung",
     "description": "Persistent feelings of sadness, hopelessness, or loss of interest.",
     "description_de": "Anhaltende Gefühle von Traurigkeit, Hoffnungslosigkeit oder Interessenverlust.",
     "tips": ["Seek professional support", "Stay connected with others", "Get regular sunlight"],
     "tips_de": ["Professionelle Unterstützung suchen", "In Kontakt mit anderen bleiben", "Regelmäßig Sonnenlicht bekommen"],
     "related_hormones": ["Estrogen", "Serotonin", "Dopamine"], "severity_warning": True},
    
    {"name": "Brain Fog", "name_de": "Gehirnnebel", "category": "Mood", "category_de": "Stimmung",
     "description": "Difficulty concentrating, memory lapses, and feeling mentally unclear.",
     "description_de": "Konzentrationsschwierigkeiten, Gedächtnislücken und geistige Unklarheit.",
     "tips": ["Get adequate sleep", "Stay mentally active", "Reduce stress"],
     "tips_de": ["Ausreichend schlafen", "Geistig aktiv bleiben", "Stress reduzieren"],
     "related_hormones": ["Estrogen", "Progesterone", "Thyroid hormones"], "severity_warning": False},
    
    {"name": "Irritability", "name_de": "Reizbarkeit", "category": "Mood", "category_de": "Stimmung",
     "description": "Increased tendency to become annoyed or frustrated easily.",
     "description_de": "Erhöhte Tendenz, schnell verärgert oder frustriert zu werden.",
     "tips": ["Practice stress management", "Get enough rest", "Exercise regularly"],
     "tips_de": ["Stressmanagement üben", "Ausreichend ruhen", "Regelmäßig Sport treiben"],
     "related_hormones": ["Estrogen", "Progesterone", "Cortisol"], "severity_warning": False},
    
    {"name": "Panic Attacks", "name_de": "Panikattacken", "category": "Mood", "category_de": "Stimmung",
     "description": "Sudden episodes of intense fear with physical symptoms like racing heart.",
     "description_de": "Plötzliche Episoden intensiver Angst mit körperlichen Symptomen wie Herzrasen.",
     "tips": ["Practice grounding techniques", "Seek professional help", "Learn breathing exercises"],
     "tips_de": ["Erdungstechniken üben", "Professionelle Hilfe suchen", "Atemübungen lernen"],
     "related_hormones": ["Cortisol", "Adrenaline", "Estrogen"], "severity_warning": True},
    
    {"name": "Loss of Confidence", "name_de": "Verlust des Selbstvertrauens", "category": "Mood", "category_de": "Stimmung",
     "description": "Decreased self-esteem or feeling less capable than before.",
     "description_de": "Verringertes Selbstwertgefühl oder das Gefühl, weniger fähig zu sein als zuvor.",
     "tips": ["Practice self-compassion", "Set small achievable goals", "Celebrate your strengths"],
     "tips_de": ["Selbstmitgefühl üben", "Kleine erreichbare Ziele setzen", "Ihre Stärken feiern"],
     "related_hormones": ["Estrogen", "Testosterone", "Serotonin"], "severity_warning": False},
    
    {"name": "Difficulty Concentrating", "name_de": "Konzentrationsschwierigkeiten", "category": "Mood", "category_de": "Stimmung",
     "description": "Trouble focusing on tasks or maintaining attention.",
     "description_de": "Schwierigkeiten, sich auf Aufgaben zu konzentrieren oder die Aufmerksamkeit aufrechtzuerhalten.",
     "tips": ["Break tasks into smaller steps", "Minimize distractions", "Take regular breaks"],
     "tips_de": ["Aufgaben in kleinere Schritte aufteilen", "Ablenkungen minimieren", "Regelmäßige Pausen einlegen"],
     "related_hormones": ["Estrogen", "Dopamine"], "severity_warning": False},
    
    {"name": "Memory Problems", "name_de": "Gedächtnisprobleme", "category": "Mood", "category_de": "Stimmung",
     "description": "Forgetting things more often or having trouble recalling information.",
     "description_de": "Häufigeres Vergessen von Dingen oder Schwierigkeiten, Informationen abzurufen.",
     "tips": ["Use memory aids", "Stay mentally active", "Get enough sleep"],
     "tips_de": ["Gedächtnisstützen verwenden", "Geistig aktiv bleiben", "Ausreichend schlafen"],
     "related_hormones": ["Estrogen", "Progesterone"], "severity_warning": False},

    # Physical - Musculoskeletal
    {"name": "Joint Pain", "name_de": "Gelenkschmerzen", "category": "Physical", "category_de": "Körperlich",
     "description": "Aches, stiffness, or swelling in joints, particularly in the morning.",
     "description_de": "Schmerzen, Steifheit oder Schwellungen in den Gelenken, besonders morgens.",
     "tips": ["Gentle stretching", "Stay active", "Consider glucosamine", "Apply heat or cold therapy"],
     "tips_de": ["Sanftes Dehnen", "Aktiv bleiben", "Glucosamin in Betracht ziehen", "Wärme- oder Kältetherapie anwenden"],
     "related_hormones": ["Estrogen", "Cortisol"], "severity_warning": False},
    
    {"name": "Muscle Aches", "name_de": "Muskelschmerzen", "category": "Physical", "category_de": "Körperlich",
     "description": "General muscle soreness or tension throughout the body.",
     "description_de": "Allgemeine Muskelkater oder Verspannungen im ganzen Körper.",
     "tips": ["Regular gentle exercise", "Stay hydrated", "Magnesium supplementation"],
     "tips_de": ["Regelmäßige sanfte Bewegung", "Ausreichend trinken", "Magnesiumergänzung"],
     "related_hormones": ["Estrogen", "Cortisol"], "severity_warning": False},
    
    {"name": "Stiff Shoulder", "name_de": "Steife Schulter", "category": "Physical", "category_de": "Körperlich",
     "description": "Shoulder stiffness and pain, often called frozen shoulder.",
     "description_de": "Schultersteifheit und Schmerzen, oft als eingefrorene Schulter bezeichnet.",
     "tips": ["Gentle shoulder exercises", "Physical therapy", "Heat application"],
     "tips_de": ["Sanfte Schulterübungen", "Physiotherapie", "Wärmeanwendung"],
     "related_hormones": ["Estrogen", "Cortisol"], "severity_warning": False},
    
    {"name": "Back Pain", "name_de": "Rückenschmerzen", "category": "Physical", "category_de": "Körperlich",
     "description": "Lower or upper back pain and stiffness.",
     "description_de": "Schmerzen und Steifheit im unteren oder oberen Rücken.",
     "tips": ["Maintain good posture", "Core strengthening exercises", "Ergonomic adjustments"],
     "tips_de": ["Gute Haltung beibehalten", "Rumpfstabilisierende Übungen", "Ergonomische Anpassungen"],
     "related_hormones": ["Estrogen", "Progesterone"], "severity_warning": False},
    
    {"name": "Muscle Weakness", "name_de": "Muskelschwäche", "category": "Physical", "category_de": "Körperlich",
     "description": "Decreased muscle strength or feeling less strong than usual.",
     "description_de": "Verminderte Muskelkraft oder das Gefühl, weniger stark zu sein als gewöhnlich.",
     "tips": ["Strength training", "Protein-rich diet", "Regular exercise"],
     "tips_de": ["Krafttraining", "Proteinreiche Ernährung", "Regelmäßige Bewegung"],
     "related_hormones": ["Testosterone", "Estrogen", "Growth hormone"], "severity_warning": False},
    
    {"name": "Tingling Extremities", "name_de": "Kribbeln in Extremitäten", "category": "Physical", "category_de": "Körperlich",
     "description": "Pins and needles sensation in hands or feet.",
     "description_de": "Kribbeln oder Ameisenlaufen in Händen oder Füßen.",
     "tips": ["Check vitamin B12 levels", "Stay active", "Reduce alcohol intake"],
     "tips_de": ["Vitamin B12-Spiegel überprüfen", "Aktiv bleiben", "Alkoholkonsum reduzieren"],
     "related_hormones": ["Estrogen", "B vitamins"], "severity_warning": True},

    # Physical - Head
    {"name": "Headaches", "name_de": "Kopfschmerzen", "category": "Physical", "category_de": "Körperlich",
     "description": "Recurring headaches or migraines that may be hormone-related.",
     "description_de": "Wiederkehrende Kopfschmerzen oder Migräne, die hormonbedingt sein können.",
     "tips": ["Track triggers", "Stay hydrated", "Manage stress"],
     "tips_de": ["Auslöser verfolgen", "Ausreichend trinken", "Stress bewältigen"],
     "related_hormones": ["Estrogen", "Progesterone"], "severity_warning": False},
    
    {"name": "Migraines", "name_de": "Migräne", "category": "Physical", "category_de": "Körperlich",
     "description": "Severe headaches often with nausea, light sensitivity.",
     "description_de": "Starke Kopfschmerzen oft mit Übelkeit und Lichtempfindlichkeit.",
     "tips": ["Identify and avoid triggers", "Rest in dark room", "Consider preventive medication"],
     "tips_de": ["Auslöser identifizieren und meiden", "In dunklem Raum ruhen", "Vorbeugende Medikamente in Betracht ziehen"],
     "related_hormones": ["Estrogen", "Serotonin"], "severity_warning": True},
    
    {"name": "Dizziness", "name_de": "Schwindel", "category": "Physical", "category_de": "Körperlich",
     "description": "Feeling lightheaded, unsteady, or like the room is spinning.",
     "description_de": "Gefühl von Benommenheit, Unsicherheit oder dass sich der Raum dreht.",
     "tips": ["Move slowly when standing", "Stay hydrated", "Check blood pressure"],
     "tips_de": ["Langsam beim Aufstehen bewegen", "Ausreichend trinken", "Blutdruck überprüfen"],
     "related_hormones": ["Estrogen", "Cortisol"], "severity_warning": True},
    
    {"name": "Tinnitus", "name_de": "Tinnitus", "category": "Physical", "category_de": "Körperlich",
     "description": "Ringing, buzzing, or other sounds in the ears.",
     "description_de": "Klingeln, Summen oder andere Geräusche in den Ohren.",
     "tips": ["Reduce caffeine", "Manage stress", "Protect ears from loud noises"],
     "tips_de": ["Koffein reduzieren", "Stress bewältigen", "Ohren vor lauten Geräuschen schützen"],
     "related_hormones": ["Estrogen", "Cortisol"], "severity_warning": False},

    # Physical - Digestive
    {"name": "Bloating", "name_de": "Blähungen", "category": "Digestive", "category_de": "Verdauung",
     "description": "Uncomfortable feeling of fullness or swelling in the abdominal area.",
     "description_de": "Unangenehmes Völlegefühl oder Schwellung im Bauchbereich.",
     "tips": ["Eat slowly", "Avoid carbonated drinks", "Reduce salt intake", "Try probiotics"],
     "tips_de": ["Langsam essen", "Kohlensäurehaltige Getränke meiden", "Salzaufnahme reduzieren", "Probiotika versuchen"],
     "related_hormones": ["Estrogen", "Progesterone"], "severity_warning": False},
    
    {"name": "Digestive Issues", "name_de": "Verdauungsprobleme", "category": "Digestive", "category_de": "Verdauung",
     "description": "Changes in digestion including constipation, diarrhea, or IBS symptoms.",
     "description_de": "Veränderungen der Verdauung einschließlich Verstopfung, Durchfall oder Reizdarmsyndrom.",
     "tips": ["Eat fiber-rich foods", "Stay hydrated", "Regular exercise"],
     "tips_de": ["Ballaststoffreiche Lebensmittel essen", "Ausreichend trinken", "Regelmäßige Bewegung"],
     "related_hormones": ["Estrogen", "Cortisol", "Serotonin"], "severity_warning": False},
    
    {"name": "Nausea", "name_de": "Übelkeit", "category": "Digestive", "category_de": "Verdauung",
     "description": "Feeling sick to your stomach or queasy.",
     "description_de": "Übelkeit oder ein flaues Gefühl im Magen.",
     "tips": ["Eat small frequent meals", "Avoid strong smells", "Ginger tea may help"],
     "tips_de": ["Kleine häufige Mahlzeiten essen", "Starke Gerüche meiden", "Ingwertee kann helfen"],
     "related_hormones": ["Estrogen", "Progesterone"], "severity_warning": False},
    
    {"name": "Changes in Appetite", "name_de": "Appetitveränderungen", "category": "Digestive", "category_de": "Verdauung",
     "description": "Increased or decreased appetite, food cravings.",
     "description_de": "Erhöhter oder verminderter Appetit, Heißhunger.",
     "tips": ["Eat balanced meals", "Don't skip meals", "Keep healthy snacks handy"],
     "tips_de": ["Ausgewogene Mahlzeiten essen", "Mahlzeiten nicht auslassen", "Gesunde Snacks bereithalten"],
     "related_hormones": ["Leptin", "Ghrelin", "Estrogen"], "severity_warning": False},
    
    {"name": "Weight Gain", "name_de": "Gewichtszunahme", "category": "Digestive", "category_de": "Verdauung",
     "description": "Unexplained weight gain, particularly around the abdomen.",
     "description_de": "Unerklärliche Gewichtszunahme, besonders um den Bauch.",
     "tips": ["Focus on strength training", "Balanced nutrition", "Portion control"],
     "tips_de": ["Auf Krafttraining konzentrieren", "Ausgewogene Ernährung", "Portionskontrolle"],
     "related_hormones": ["Estrogen", "Cortisol", "Insulin", "Thyroid hormones"], "severity_warning": False},

    # Cardiovascular
    {"name": "Heart Palpitations", "name_de": "Herzrasen", "category": "Cardiovascular", "category_de": "Herz-Kreislauf",
     "description": "Feeling like your heart is racing, pounding, or skipping beats.",
     "description_de": "Gefühl, dass das Herz rast, pocht oder Schläge aussetzt.",
     "tips": ["Practice deep breathing", "Reduce caffeine", "Manage stress", "Consult your doctor"],
     "tips_de": ["Tiefes Atmen üben", "Koffein reduzieren", "Stress bewältigen", "Arzt konsultieren"],
     "related_hormones": ["Estrogen", "Adrenaline", "Thyroid hormones"], "severity_warning": True},
    
    {"name": "Blood Pressure Changes", "name_de": "Blutdruckschwankungen", "category": "Cardiovascular", "category_de": "Herz-Kreislauf",
     "description": "Fluctuations in blood pressure, either higher or lower than normal.",
     "description_de": "Schwankungen des Blutdrucks, entweder höher oder niedriger als normal.",
     "tips": ["Monitor blood pressure regularly", "Reduce sodium", "Regular exercise"],
     "tips_de": ["Blutdruck regelmäßig überwachen", "Natrium reduzieren", "Regelmäßige Bewegung"],
     "related_hormones": ["Estrogen", "Cortisol"], "severity_warning": True},

    # Skin & Hair
    {"name": "Dry Skin", "name_de": "Trockene Haut", "category": "Skin & Hair", "category_de": "Haut & Haare",
     "description": "Skin becomes drier, less elastic, and may feel itchy or tight.",
     "description_de": "Die Haut wird trockener, weniger elastisch und kann sich juckend oder gespannt anfühlen.",
     "tips": ["Use rich moisturizers", "Drink plenty of water", "Avoid hot showers"],
     "tips_de": ["Reichhaltige Feuchtigkeitscremes verwenden", "Viel Wasser trinken", "Heiße Duschen vermeiden"],
     "related_hormones": ["Estrogen", "Collagen"], "severity_warning": False},
    
    {"name": "Hair Thinning", "name_de": "Haarausfall", "category": "Skin & Hair", "category_de": "Haut & Haare",
     "description": "Noticeable hair loss or thinning, particularly at the crown or temples.",
     "description_de": "Merklicher Haarausfall oder dünner werdendes Haar, besonders am Scheitel oder an den Schläfen.",
     "tips": ["Gentle hair care", "Biotin supplements", "Reduce heat styling"],
     "tips_de": ["Sanfte Haarpflege", "Biotin-Ergänzung", "Hitze-Styling reduzieren"],
     "related_hormones": ["Estrogen", "Testosterone", "Thyroid hormones"], "severity_warning": False},
    
    {"name": "Brittle Nails", "name_de": "Brüchige Nägel", "category": "Skin & Hair", "category_de": "Haut & Haare",
     "description": "Nails become weak, prone to breaking, or develop ridges.",
     "description_de": "Nägel werden schwach, neigen zum Brechen oder entwickeln Rillen.",
     "tips": ["Keep nails moisturized", "Biotin supplementation", "Wear gloves for cleaning"],
     "tips_de": ["Nägel feucht halten", "Biotin-Ergänzung", "Handschuhe beim Reinigen tragen"],
     "related_hormones": ["Estrogen", "Biotin"], "severity_warning": False},
    
    {"name": "Skin Crawling", "name_de": "Hautkribbeln", "category": "Skin & Hair", "category_de": "Haut & Haare",
     "description": "Sensation of insects crawling on or under the skin (formication).",
     "description_de": "Gefühl von Insekten, die auf oder unter der Haut krabbeln.",
     "tips": ["Keep skin moisturized", "Avoid irritants", "Practice relaxation"],
     "tips_de": ["Haut feucht halten", "Reizstoffe vermeiden", "Entspannung üben"],
     "related_hormones": ["Estrogen"], "severity_warning": False},
    
    {"name": "Acne", "name_de": "Akne", "category": "Skin & Hair", "category_de": "Haut & Haare",
     "description": "Adult acne breakouts, often along the jawline.",
     "description_de": "Akne bei Erwachsenen, oft entlang der Kieferpartie.",
     "tips": ["Gentle skincare routine", "Avoid touching face", "Consider hormonal factors"],
     "tips_de": ["Sanfte Hautpflegeroutine", "Gesicht nicht berühren", "Hormonelle Faktoren berücksichtigen"],
     "related_hormones": ["Testosterone", "Estrogen", "Progesterone"], "severity_warning": False},
    
    {"name": "Facial Hair Growth", "name_de": "Gesichtsbehaarung", "category": "Skin & Hair", "category_de": "Haut & Haare",
     "description": "Increased facial hair, particularly on chin or upper lip.",
     "description_de": "Vermehrte Gesichtsbehaarung, besonders am Kinn oder der Oberlippe.",
     "tips": ["Various hair removal options available", "Consult dermatologist"],
     "tips_de": ["Verschiedene Haarentfernungsoptionen verfügbar", "Dermatologen konsultieren"],
     "related_hormones": ["Testosterone", "Estrogen"], "severity_warning": False},
    
    {"name": "Body Odor Changes", "name_de": "Körpergeruchsveränderungen", "category": "Skin & Hair", "category_de": "Haut & Haare",
     "description": "Changes in body odor or increased sweating.",
     "description_de": "Veränderungen des Körpergeruchs oder vermehrtes Schwitzen.",
     "tips": ["Good hygiene practices", "Breathable fabrics", "Stay hydrated"],
     "tips_de": ["Gute Hygienepraktiken", "Atmungsaktive Stoffe", "Ausreichend trinken"],
     "related_hormones": ["Estrogen", "Testosterone"], "severity_warning": False},

    # Intimate Health
    {"name": "Vaginal Dryness", "name_de": "Vaginale Trockenheit", "category": "Intimate", "category_de": "Intimgesundheit",
     "description": "Decreased natural lubrication leading to discomfort or irritation.",
     "description_de": "Verminderte natürliche Befeuchtung, die zu Unbehagen oder Reizung führt.",
     "tips": ["Use water-based lubricants", "Stay hydrated", "Consult about topical treatments"],
     "tips_de": ["Gleitmittel auf Wasserbasis verwenden", "Ausreichend trinken", "Über topische Behandlungen beraten lassen"],
     "related_hormones": ["Estrogen"], "severity_warning": False},
    
    {"name": "Low Libido", "name_de": "Geringe Libido", "category": "Intimate", "category_de": "Intimgesundheit",
     "description": "Decreased interest in or desire for sexual activity.",
     "description_de": "Vermindertes Interesse an oder Verlangen nach sexueller Aktivität.",
     "tips": ["Communicate with partner", "Address other symptoms first", "Consider counseling"],
     "tips_de": ["Mit Partner kommunizieren", "Andere Symptome zuerst behandeln", "Beratung in Betracht ziehen"],
     "related_hormones": ["Testosterone", "Estrogen", "Dopamine"], "severity_warning": False},
    
    {"name": "Urinary Issues", "name_de": "Harnwegsprobleme", "category": "Intimate", "category_de": "Intimgesundheit",
     "description": "Increased frequency of urination or occasional incontinence.",
     "description_de": "Erhöhte Häufigkeit des Wasserlassens oder gelegentliche Inkontinenz.",
     "tips": ["Pelvic floor exercises", "Stay hydrated", "Limit caffeine"],
     "tips_de": ["Beckenbodenübungen", "Ausreichend trinken", "Koffein begrenzen"],
     "related_hormones": ["Estrogen"], "severity_warning": False},
    
    {"name": "UTI Susceptibility", "name_de": "Anfälligkeit für Harnwegsinfekte", "category": "Intimate", "category_de": "Intimgesundheit",
     "description": "Increased tendency to develop urinary tract infections.",
     "description_de": "Erhöhte Tendenz zu Harnwegsinfektionen.",
     "tips": ["Stay well hydrated", "Urinate after intimacy", "Cranberry supplements"],
     "tips_de": ["Gut hydriert bleiben", "Nach Intimität urinieren", "Cranberry-Ergänzungen"],
     "related_hormones": ["Estrogen"], "severity_warning": False},
    
    {"name": "Painful Intercourse", "name_de": "Schmerzhafter Geschlechtsverkehr", "category": "Intimate", "category_de": "Intimgesundheit",
     "description": "Discomfort or pain during sexual activity.",
     "description_de": "Unbehagen oder Schmerzen während sexueller Aktivität.",
     "tips": ["Use lubricants", "Extended foreplay", "Consult healthcare provider"],
     "tips_de": ["Gleitmittel verwenden", "Verlängertes Vorspiel", "Gesundheitsdienstleister konsultieren"],
     "related_hormones": ["Estrogen"], "severity_warning": False},
    
    {"name": "Irregular Periods", "name_de": "Unregelmäßige Perioden", "category": "Intimate", "category_de": "Intimgesundheit",
     "description": "Changes in menstrual cycle length, flow, or regularity.",
     "description_de": "Veränderungen der Zykluslänge, Stärke oder Regelmäßigkeit.",
     "tips": ["Track your cycle", "Note any unusual symptoms", "Consult if bleeding is heavy"],
     "tips_de": ["Zyklus verfolgen", "Ungewöhnliche Symptome notieren", "Bei starker Blutung Arzt konsultieren"],
     "related_hormones": ["Estrogen", "Progesterone", "FSH", "LH"], "severity_warning": False},
    
    {"name": "Heavy Periods", "name_de": "Starke Perioden", "category": "Intimate", "category_de": "Intimgesundheit",
     "description": "Heavier than usual menstrual bleeding.",
     "description_de": "Stärkere als übliche Menstruationsblutung.",
     "tips": ["Track bleeding patterns", "Consider iron supplements", "Consult gynecologist"],
     "tips_de": ["Blutungsmuster verfolgen", "Eisenpräparate in Betracht ziehen", "Gynäkologen konsultieren"],
     "related_hormones": ["Estrogen", "Progesterone"], "severity_warning": True},
    
    {"name": "Breast Tenderness", "name_de": "Brustempfindlichkeit", "category": "Intimate", "category_de": "Intimgesundheit",
     "description": "Soreness, swelling, or sensitivity in the breasts.",
     "description_de": "Schmerzen, Schwellungen oder Empfindlichkeit in den Brüsten.",
     "tips": ["Wear supportive bra", "Reduce caffeine", "Apply warm compress"],
     "tips_de": ["Stützenden BH tragen", "Koffein reduzieren", "Warme Kompressen auflegen"],
     "related_hormones": ["Estrogen", "Progesterone"], "severity_warning": False},

    # Other Physical
    {"name": "Allergies Worsening", "name_de": "Verschlechterung von Allergien", "category": "Other", "category_de": "Sonstiges",
     "description": "Increased allergy symptoms or new allergic reactions.",
     "description_de": "Verstärkte Allergiesymptome oder neue allergische Reaktionen.",
     "tips": ["Identify new triggers", "Antihistamines may help", "Consult allergist"],
     "tips_de": ["Neue Auslöser identifizieren", "Antihistaminika können helfen", "Allergologen konsultieren"],
     "related_hormones": ["Estrogen", "Cortisol"], "severity_warning": False},
    
    {"name": "Electric Shock Sensations", "name_de": "Elektrische Schock-Empfindungen", "category": "Other", "category_de": "Sonstiges",
     "description": "Brief sensations like an electric shock, often preceding a hot flash.",
     "description_de": "Kurze Empfindungen wie ein elektrischer Schock, oft vor einer Hitzewallung.",
     "tips": ["Track when they occur", "Manage stress", "Ensure adequate B vitamins"],
     "tips_de": ["Auftreten verfolgen", "Stress bewältigen", "Ausreichend B-Vitamine sicherstellen"],
     "related_hormones": ["Estrogen"], "severity_warning": False},
    
    {"name": "Burning Mouth", "name_de": "Brennender Mund", "category": "Other", "category_de": "Sonstiges",
     "description": "Burning sensation in mouth, tongue, or lips.",
     "description_de": "Brennendes Gefühl in Mund, Zunge oder Lippen.",
     "tips": ["Avoid spicy foods", "Stay hydrated", "Consult dentist"],
     "tips_de": ["Scharfe Speisen meiden", "Ausreichend trinken", "Zahnarzt konsultieren"],
     "related_hormones": ["Estrogen"], "severity_warning": False},
    
    {"name": "Dry Eyes", "name_de": "Trockene Augen", "category": "Other", "category_de": "Sonstiges",
     "description": "Eyes feel dry, gritty, or irritated.",
     "description_de": "Augen fühlen sich trocken, sandig oder gereizt an.",
     "tips": ["Use artificial tears", "Take screen breaks", "Stay hydrated"],
     "tips_de": ["Künstliche Tränen verwenden", "Bildschirmpausen einlegen", "Ausreichend trinken"],
     "related_hormones": ["Estrogen"], "severity_warning": False},
    
    {"name": "Dry Mouth", "name_de": "Mundtrockenheit", "category": "Other", "category_de": "Sonstiges",
     "description": "Decreased saliva production causing dry mouth.",
     "description_de": "Verminderte Speichelproduktion, die zu Mundtrockenheit führt.",
     "tips": ["Sip water frequently", "Sugar-free gum", "Avoid alcohol mouthwash"],
     "tips_de": ["Häufig Wasser trinken", "Zuckerfreier Kaugummi", "Alkoholhaltiges Mundwasser meiden"],
     "related_hormones": ["Estrogen"], "severity_warning": False},
    
    {"name": "Gum Problems", "name_de": "Zahnfleischprobleme", "category": "Other", "category_de": "Sonstiges",
     "description": "Gum sensitivity, bleeding, or recession.",
     "description_de": "Zahnfleischempfindlichkeit, Blutungen oder Rückgang.",
     "tips": ["Regular dental care", "Gentle brushing", "Floss daily"],
     "tips_de": ["Regelmäßige Zahnpflege", "Sanftes Bürsten", "Täglich Zahnseide verwenden"],
     "related_hormones": ["Estrogen"], "severity_warning": False},
    
    {"name": "Osteoporosis Risk", "name_de": "Osteoporose-Risiko", "category": "Other", "category_de": "Sonstiges",
     "description": "Decreased bone density increasing fracture risk.",
     "description_de": "Verminderte Knochendichte erhöht das Frakturrisiko.",
     "tips": ["Weight-bearing exercise", "Calcium and Vitamin D", "Bone density screening"],
     "tips_de": ["Gewichtstragende Übungen", "Kalzium und Vitamin D", "Knochendichtemessung"],
     "related_hormones": ["Estrogen", "Parathyroid hormone"], "severity_warning": True},
    
    {"name": "Feeling Overwhelmed", "name_de": "Überwältigungsgefühl", "category": "Other", "category_de": "Sonstiges",
     "description": "Difficulty coping with normal daily tasks and responsibilities.",
     "description_de": "Schwierigkeiten, mit normalen täglichen Aufgaben und Verantwortlichkeiten umzugehen.",
     "tips": ["Prioritize tasks", "Ask for help", "Practice self-care"],
     "tips_de": ["Aufgaben priorisieren", "Um Hilfe bitten", "Selbstfürsorge praktizieren"],
     "related_hormones": ["Cortisol", "Estrogen"], "severity_warning": False},
]

# Hormone Information
HORMONES_DATA = {
    "Estrogen": {
        "name": "Estrogen",
        "name_de": "Östrogen",
        "description": "The primary female sex hormone, responsible for reproductive development and regulation. During menopause, estrogen levels decline significantly.",
        "description_de": "Das primäre weibliche Sexualhormon, verantwortlich für die reproduktive Entwicklung und Regulation. Während der Menopause sinken die Östrogenspiegel erheblich.",
        "effects": ["Regulates menstrual cycle", "Maintains bone density", "Affects mood and cognition", "Supports skin elasticity"],
        "effects_de": ["Reguliert den Menstruationszyklus", "Erhält die Knochendichte", "Beeinflusst Stimmung und Kognition", "Unterstützt die Hautelastizität"]
    },
    "Progesterone": {
        "name": "Progesterone",
        "name_de": "Progesteron",
        "description": "A hormone that prepares the uterus for pregnancy and regulates the menstrual cycle. It has calming effects and supports sleep.",
        "description_de": "Ein Hormon, das die Gebärmutter auf eine Schwangerschaft vorbereitet und den Menstruationszyklus reguliert. Es hat beruhigende Wirkungen und unterstützt den Schlaf.",
        "effects": ["Prepares uterine lining", "Promotes calm and sleep", "Balances estrogen effects", "Supports pregnancy"],
        "effects_de": ["Bereitet die Gebärmutterschleimhaut vor", "Fördert Ruhe und Schlaf", "Gleicht Östrogenwirkungen aus", "Unterstützt die Schwangerschaft"]
    },
    "Testosterone": {
        "name": "Testosterone",
        "name_de": "Testosteron",
        "description": "Often called a 'male hormone' but crucial for women too. Affects libido, energy, muscle mass, and mood.",
        "description_de": "Oft als 'männliches Hormon' bezeichnet, aber auch für Frauen wichtig. Beeinflusst Libido, Energie, Muskelmasse und Stimmung.",
        "effects": ["Maintains libido", "Supports muscle strength", "Affects energy levels", "Influences mood"],
        "effects_de": ["Erhält die Libido", "Unterstützt Muskelkraft", "Beeinflusst Energieniveaus", "Beeinflusst die Stimmung"]
    },
    "FSH": {
        "name": "Follicle Stimulating Hormone",
        "name_de": "Follikelstimulierendes Hormon",
        "description": "Stimulates egg development. Levels rise during perimenopause as the body tries to stimulate the ovaries.",
        "description_de": "Stimuliert die Eientwicklung. Die Spiegel steigen während der Perimenopause, da der Körper versucht, die Eierstöcke zu stimulieren.",
        "effects": ["Stimulates follicle growth", "Rises during menopause transition", "Used as menopause indicator"],
        "effects_de": ["Stimuliert Follikelwachstum", "Steigt während des Menopausenübergangs", "Wird als Menopause-Indikator verwendet"]
    },
    "Cortisol": {
        "name": "Cortisol",
        "name_de": "Cortisol",
        "description": "The stress hormone. Can become dysregulated during menopause, affecting sleep, weight, and mood.",
        "description_de": "Das Stresshormon. Kann während der Menopause dysreguliert werden und Schlaf, Gewicht und Stimmung beeinflussen.",
        "effects": ["Manages stress response", "Affects metabolism", "Influences sleep patterns", "Impacts immune function"],
        "effects_de": ["Steuert die Stressreaktion", "Beeinflusst den Stoffwechsel", "Beeinflusst Schlafmuster", "Wirkt sich auf die Immunfunktion aus"]
    },
    "Thyroid hormones": {
        "name": "Thyroid Hormones",
        "name_de": "Schilddrüsenhormone",
        "description": "Regulate metabolism, energy, and body temperature. Thyroid issues often occur alongside menopause.",
        "description_de": "Regulieren Stoffwechsel, Energie und Körpertemperatur. Schilddrüsenprobleme treten oft zusammen mit der Menopause auf.",
        "effects": ["Regulate metabolism", "Control body temperature", "Affect energy levels", "Influence weight"],
        "effects_de": ["Regulieren den Stoffwechsel", "Kontrollieren die Körpertemperatur", "Beeinflussen Energieniveaus", "Beeinflussen das Gewicht"]
    },
    "Melatonin": {
        "name": "Melatonin",
        "name_de": "Melatonin",
        "description": "The sleep hormone. Production may decrease with age, affecting sleep quality.",
        "description_de": "Das Schlafhormon. Die Produktion kann mit dem Alter abnehmen und die Schlafqualität beeinflussen.",
        "effects": ["Regulates sleep-wake cycle", "Antioxidant properties", "Supports immune function"],
        "effects_de": ["Reguliert den Schlaf-Wach-Rhythmus", "Antioxidative Eigenschaften", "Unterstützt die Immunfunktion"]
    },
    "Serotonin": {
        "name": "Serotonin",
        "name_de": "Serotonin",
        "description": "The 'feel good' neurotransmitter. Estrogen helps regulate serotonin, so levels can fluctuate during menopause.",
        "description_de": "Der 'Wohlfühl'-Neurotransmitter. Östrogen hilft bei der Regulierung von Serotonin, daher können die Spiegel während der Menopause schwanken.",
        "effects": ["Regulates mood", "Affects appetite", "Influences sleep", "Impacts memory"],
        "effects_de": ["Reguliert die Stimmung", "Beeinflusst den Appetit", "Beeinflusst den Schlaf", "Wirkt sich auf das Gedächtnis aus"]
    }
}

# Female Cycle Phases
CYCLE_PHASES_DATA = {
    "en": [
        {
            "phase": "menstrual",
            "name": "Menstrual Phase",
            "days": "Days 1-5",
            "description": "Your period begins. Hormone levels are at their lowest.",
            "body": "The uterine lining sheds. You may experience cramps, fatigue, and lower back pain. Energy is typically at its lowest.",
            "mind": "Introspection is natural. You may feel more reflective and in need of alone time. Emotions can feel more intense.",
            "energy": "Low energy is normal. This is a time for rest and gentle movement.",
            "stress_resilience": "Patience and tolerance may be lower. Give yourself permission to say no and set boundaries.",
            "tips": ["Rest more", "Gentle yoga or walking", "Warm foods and drinks", "Iron-rich foods", "Self-compassion"]
        },
        {
            "phase": "follicular",
            "name": "Follicular Phase",
            "days": "Days 6-14",
            "description": "Estrogen rises as follicles develop. You may feel increasingly energetic and optimistic.",
            "body": "Energy increases, skin often looks its best. You may feel stronger and have better endurance.",
            "mind": "Creativity peaks, learning new things comes easier. Mood tends to be more positive and outgoing.",
            "energy": "Rising energy - great time for starting new projects and challenging workouts.",
            "stress_resilience": "Better able to handle challenges. Communication skills are often enhanced.",
            "tips": ["Try new activities", "High-intensity workouts", "Start new projects", "Social activities", "Brain-boosting foods"]
        },
        {
            "phase": "ovulation",
            "name": "Ovulation Phase",
            "days": "Days 14-17",
            "description": "Estrogen peaks, triggering egg release. You may feel most confident and social.",
            "body": "Peak fertility, possible mild cramping (mittelschmerz). Skin glows, you may feel most attractive.",
            "mind": "Communication skills peak, feeling confident and articulate. Libido often highest.",
            "energy": "Highest energy levels. Great for important meetings, presentations, and intense exercise.",
            "stress_resilience": "Best ability to handle stress and multitask. Feeling more resilient overall.",
            "tips": ["Schedule important events", "Strength training", "Social gatherings", "Express your needs", "Enjoy peak energy"]
        },
        {
            "phase": "luteal",
            "name": "Luteal Phase",
            "days": "Days 18-28",
            "description": "Progesterone rises then falls. PMS symptoms may appear in the late luteal phase.",
            "body": "May experience bloating, breast tenderness, food cravings. Body temperature slightly elevated.",
            "mind": "More detail-oriented, good for completing tasks. May feel more anxious or irritable as phase progresses.",
            "energy": "Energy gradually decreases. Better for finishing projects than starting new ones.",
            "stress_resilience": "May feel more sensitive. It's important to practice self-care and reduce stressors.",
            "tips": ["Magnesium-rich foods", "Reduce caffeine and salt", "Moderate exercise", "Prioritize sleep", "Be gentle with yourself"]
        }
    ],
    "de": [
        {
            "phase": "menstrual",
            "name": "Menstruationsphase",
            "days": "Tage 1-5",
            "description": "Ihre Periode beginnt. Die Hormonspiegel sind am niedrigsten.",
            "body": "Die Gebärmutterschleimhaut wird abgestoßen. Sie können Krämpfe, Müdigkeit und Rückenschmerzen erleben. Die Energie ist typischerweise am niedrigsten.",
            "mind": "Introspektion ist natürlich. Sie fühlen sich möglicherweise nachdenklicher und brauchen Zeit für sich. Emotionen können intensiver sein.",
            "energy": "Niedrige Energie ist normal. Dies ist eine Zeit für Ruhe und sanfte Bewegung.",
            "stress_resilience": "Geduld und Toleranz können geringer sein. Erlauben Sie sich, Nein zu sagen und Grenzen zu setzen.",
            "tips": ["Mehr ausruhen", "Sanftes Yoga oder Spazierengehen", "Warme Speisen und Getränke", "Eisenreiche Lebensmittel", "Selbstmitgefühl"]
        },
        {
            "phase": "follicular",
            "name": "Follikelphase",
            "days": "Tage 6-14",
            "description": "Östrogen steigt, während sich Follikel entwickeln. Sie fühlen sich möglicherweise zunehmend energiegeladen und optimistisch.",
            "body": "Die Energie steigt, die Haut sieht oft am besten aus. Sie fühlen sich möglicherweise stärker und ausdauernder.",
            "mind": "Kreativität erreicht ihren Höhepunkt, das Erlernen neuer Dinge fällt leichter. Die Stimmung ist tendenziell positiver und aufgeschlossener.",
            "energy": "Steigende Energie - großartige Zeit für neue Projekte und anspruchsvolle Workouts.",
            "stress_resilience": "Besser in der Lage, Herausforderungen zu bewältigen. Kommunikationsfähigkeiten sind oft verbessert.",
            "tips": ["Neue Aktivitäten ausprobieren", "Hochintensives Training", "Neue Projekte starten", "Soziale Aktivitäten", "Gehirnfördernde Lebensmittel"]
        },
        {
            "phase": "ovulation",
            "name": "Ovulationsphase",
            "days": "Tage 14-17",
            "description": "Östrogen erreicht seinen Höhepunkt und löst den Eisprung aus. Sie fühlen sich möglicherweise am selbstbewusstesten und geselligsten.",
            "body": "Höchste Fruchtbarkeit, mögliche leichte Krämpfe (Mittelschmerz). Die Haut strahlt, Sie fühlen sich möglicherweise am attraktivsten.",
            "mind": "Kommunikationsfähigkeiten auf dem Höhepunkt, Gefühl von Selbstvertrauen und Artikuliertheit. Libido oft am höchsten.",
            "energy": "Höchste Energieniveaus. Großartig für wichtige Meetings, Präsentationen und intensives Training.",
            "stress_resilience": "Beste Fähigkeit, mit Stress umzugehen und Multitasking zu betreiben. Fühlen sich insgesamt widerstandsfähiger.",
            "tips": ["Wichtige Ereignisse planen", "Krafttraining", "Gesellschaftliche Zusammenkünfte", "Bedürfnisse ausdrücken", "Spitzenenergie genießen"]
        },
        {
            "phase": "luteal",
            "name": "Lutealphase",
            "days": "Tage 18-28",
            "description": "Progesteron steigt und fällt dann. PMS-Symptome können in der späten Lutealphase auftreten.",
            "body": "Möglicherweise Blähungen, Brustspannen, Heißhunger. Körpertemperatur leicht erhöht.",
            "mind": "Detailorientierter, gut zum Abschließen von Aufgaben. Möglicherweise ängstlicher oder reizbarer im Verlauf der Phase.",
            "energy": "Energie nimmt allmählich ab. Besser zum Abschließen von Projekten als zum Starten neuer.",
            "stress_resilience": "Möglicherweise empfindlicher. Es ist wichtig, Selbstfürsorge zu praktizieren und Stressoren zu reduzieren.",
            "tips": ["Magnesiumreiche Lebensmittel", "Koffein und Salz reduzieren", "Moderate Bewegung", "Schlaf priorisieren", "Sanft mit sich selbst sein"]
        }
    ]
}


# Include new modular routers
from backend.routers.auth import router as auth_router
app.include_router(auth_router)


# Include additional extracted routers
from backend.routers.symptoms import router as symptoms_router
from backend.routers.wellness import router as wellness_router
from backend.routers.users import router as users_router
app.include_router(symptoms_router)
app.include_router(wellness_router)
app.include_router(users_router)
from backend.routers.community import router as community_router
app.include_router(community_router)


# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "MenoWellness API is running", "version": "3.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
