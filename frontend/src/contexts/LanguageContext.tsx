import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'de';

interface Translations {
  [key: string]: {
    en: string;
    de: string;
  };
}

const translations: Translations = {
  // Common
  'app.name': { en: 'MenoWellness', de: 'MenoWellness' },
  'common.save': { en: 'Save', de: 'Speichern' },
  'common.cancel': { en: 'Cancel', de: 'Abbrechen' },
  'common.next': { en: 'Next', de: 'Weiter' },
  'common.back': { en: 'Back', de: 'Zurück' },
  'common.skip': { en: 'Skip', de: 'Überspringen' },
  'common.done': { en: 'Done', de: 'Fertig' },
  'common.yes': { en: 'Yes', de: 'Ja' },
  'common.no': { en: 'No', de: 'Nein' },
  'common.loading': { en: 'Loading...', de: 'Laden...' },
  'common.error': { en: 'Error', de: 'Fehler' },
  'common.success': { en: 'Success', de: 'Erfolg' },
  
  // Auth
  'auth.welcome': { en: 'Welcome Back', de: 'Willkommen zurück' },
  'auth.signIn': { en: 'Sign In', de: 'Anmelden' },
  'auth.signUp': { en: 'Sign Up', de: 'Registrieren' },
  'auth.createAccount': { en: 'Create Account', de: 'Konto erstellen' },
  'auth.email': { en: 'Email', de: 'E-Mail' },
  'auth.password': { en: 'Password', de: 'Passwort' },
  'auth.name': { en: 'Name', de: 'Name' },
  'auth.confirmPassword': { en: 'Confirm Password', de: 'Passwort bestätigen' },
  'auth.noAccount': { en: "Don't have an account?", de: 'Noch kein Konto?' },
  'auth.hasAccount': { en: 'Already have an account?', de: 'Bereits ein Konto?' },
  'auth.signInSubtitle': { en: 'Sign in to continue your wellness journey', de: 'Melden Sie sich an, um Ihre Wellness-Reise fortzusetzen' },
  'auth.signUpSubtitle': { en: 'Start your wellness journey today', de: 'Starten Sie heute Ihre Wellness-Reise' },
  'auth.logout': { en: 'Logout', de: 'Abmelden' },
  
  // Home
  'home.goodMorning': { en: 'Good morning', de: 'Guten Morgen' },
  'home.goodAfternoon': { en: 'Good afternoon', de: 'Guten Tag' },
  'home.goodEvening': { en: 'Good evening', de: 'Guten Abend' },
  'home.wellnessHub': { en: 'Wellness Hub', de: 'Wellness-Hub' },
  'home.todayCheckin': { en: "Today's Check-in", de: 'Heutiger Check-in' },
  'home.noSymptomsLogged': { en: 'No symptoms logged yet', de: 'Noch keine Symptome erfasst' },
  'home.symptomsLogged': { en: 'symptoms logged', de: 'Symptome erfasst' },
  'home.log': { en: 'Log', de: 'Erfassen' },
  'home.dailyTip': { en: 'Daily Tip', de: 'Tipp des Tages' },
  'home.setPhase': { en: 'Set your phase', de: 'Phase festlegen' },
  'home.howAreYou': { en: 'How are you feeling today?', de: 'Wie fühlen Sie sich heute?' },
  'home.completeCheckin': { en: 'Complete Daily Check-in', de: 'Täglichen Check-in abschließen' },
  
  // Symptoms
  'symptoms.title': { en: 'Symptom Tracker', de: 'Symptom-Tracker' },
  'symptoms.log': { en: 'Log', de: 'Erfassen' },
  'symptoms.history': { en: 'History', de: 'Verlauf' },
  'symptoms.selectSymptoms': { en: 'Select your symptoms', de: 'Wählen Sie Ihre Symptome' },
  'symptoms.selected': { en: 'selected', de: 'ausgewählt' },
  'symptoms.severity': { en: 'Severity', de: 'Schweregrad' },
  'symptoms.notes': { en: 'Notes (optional)', de: 'Notizen (optional)' },
  'symptoms.saveSymptoms': { en: 'Save Symptoms', de: 'Symptome speichern' },
  'symptoms.noHistory': { en: 'No symptoms logged yet', de: 'Noch keine Symptome erfasst' },
  'symptoms.severeWarning': { en: 'Severe symptoms detected. Please consider consulting your gynecologist.', de: 'Schwere Symptome festgestellt. Bitte erwägen Sie, Ihren Gynäkologen zu konsultieren.' },
  
  // Wellness
  'wellness.title': { en: 'Wellness Hub', de: 'Wellness-Hub' },
  'wellness.personalizedAdvice': { en: 'Get personalized advice based on your menopause phase and symptoms', de: 'Erhalten Sie persönliche Beratung basierend auf Ihrer Menopause-Phase und Symptomen' },
  'wellness.recentSymptoms': { en: 'Your Recent Symptoms', de: 'Ihre letzten Symptome' },
  'wellness.chooseCategory': { en: 'Choose a Category', de: 'Wählen Sie eine Kategorie' },
  'wellness.generatingAdvice': { en: 'Generating personalized advice...', de: 'Erstelle persönliche Beratung...' },
  'wellness.getNewAdvice': { en: 'Get New Advice', de: 'Neue Beratung erhalten' },
  'wellness.disclaimer': { en: 'This advice is for informational purposes only and is not a substitute for professional medical advice.', de: 'Diese Beratung dient nur zu Informationszwecken und ersetzt keine professionelle medizinische Beratung.' },
  
  // Categories
  'category.diet': { en: 'Diet & Nutrition', de: 'Ernährung' },
  'category.exercise': { en: 'Exercise', de: 'Bewegung' },
  'category.sleep': { en: 'Sleep', de: 'Schlaf' },
  'category.supplements': { en: 'Supplements', de: 'Nahrungsergänzung' },
  'category.breathing': { en: 'Relaxation', de: 'Entspannung' },
  
  // Profile
  'profile.title': { en: 'Profile', de: 'Profil' },
  'profile.memberSince': { en: 'Member since', de: 'Mitglied seit' },
  'profile.yourPhase': { en: 'Your Menopause Phase', de: 'Ihre Menopause-Phase' },
  'profile.selectPhase': { en: 'Select your current phase for personalized advice', de: 'Wählen Sie Ihre aktuelle Phase für persönliche Beratung' },
  'profile.about': { en: 'About MenoWellness', de: 'Über MenoWellness' },
  'profile.personalizedSupport': { en: 'Personalized Support', de: 'Persönliche Unterstützung' },
  'profile.symptomTracking': { en: 'Symptom Tracking', de: 'Symptom-Verfolgung' },
  'profile.wellnessResources': { en: 'Wellness Resources', de: 'Wellness-Ressourcen' },
  'profile.language': { en: 'Language', de: 'Sprache' },
  'profile.settings': { en: 'Settings', de: 'Einstellungen' },
  
  // Phases
  'phase.perimenopause': { en: 'Perimenopause', de: 'Perimenopause' },
  'phase.menopause': { en: 'Menopause', de: 'Menopause' },
  'phase.postmenopause': { en: 'Postmenopause', de: 'Postmenopause' },
  
  // Onboarding
  'onboarding.welcome': { en: "Let's personalize your experience", de: 'Lassen Sie uns Ihre Erfahrung personalisieren' },
  'onboarding.tellUsAboutYou': { en: 'Tell us about yourself', de: 'Erzählen Sie uns von sich' },
  'onboarding.age': { en: 'Your age', de: 'Ihr Alter' },
  'onboarding.height': { en: 'Height (cm)', de: 'Größe (cm)' },
  'onboarding.weight': { en: 'Weight (kg)', de: 'Gewicht (kg)' },
  'onboarding.lastPeriod': { en: 'Date of last period', de: 'Datum der letzten Periode' },
  'onboarding.cycleLength': { en: 'Usual cycle length (days)', de: 'Übliche Zykluslänge (Tage)' },
  'onboarding.selectPhase': { en: 'Select your menopause phase', de: 'Wählen Sie Ihre Menopause-Phase' },
  'onboarding.currentSymptoms': { en: 'What symptoms are you experiencing?', de: 'Welche Symptome haben Sie?' },
  'onboarding.goals': { en: 'What are your wellness goals?', de: 'Was sind Ihre Wellness-Ziele?' },
  'onboarding.medications': { en: 'Current medications (optional)', de: 'Aktuelle Medikamente (optional)' },
  'onboarding.dietaryRestrictions': { en: 'Dietary restrictions', de: 'Ernährungseinschränkungen' },
  'onboarding.exerciseLevel': { en: 'Exercise experience', de: 'Sporterfahrung' },
  'onboarding.sleepQuality': { en: 'Current sleep quality', de: 'Aktuelle Schlafqualität' },
  'onboarding.healthConditions': { en: 'Health conditions (optional)', de: 'Gesundheitszustände (optional)' },
  'onboarding.complete': { en: 'Complete Setup', de: 'Einrichtung abschließen' },
  
  // Exercise levels
  'exercise.none': { en: 'No exercise', de: 'Kein Sport' },
  'exercise.beginner': { en: 'Beginner', de: 'Anfänger' },
  'exercise.intermediate': { en: 'Intermediate', de: 'Fortgeschritten' },
  'exercise.advanced': { en: 'Advanced', de: 'Experte' },
  
  // Sleep quality
  'sleep.good': { en: 'Good', de: 'Gut' },
  'sleep.fair': { en: 'Fair', de: 'Mäßig' },
  'sleep.poor': { en: 'Poor', de: 'Schlecht' },
  
  // Goals
  'goal.reduceHotFlashes': { en: 'Reduce hot flashes', de: 'Hitzewallungen reduzieren' },
  'goal.betterSleep': { en: 'Better sleep', de: 'Besserer Schlaf' },
  'goal.manageWeight': { en: 'Manage weight', de: 'Gewicht kontrollieren' },
  'goal.improveMood': { en: 'Improve mood', de: 'Stimmung verbessern' },
  'goal.increaseEnergy': { en: 'Increase energy', de: 'Energie steigern' },
  'goal.reduceAnxiety': { en: 'Reduce anxiety', de: 'Angst reduzieren' },
  'goal.boneHealth': { en: 'Support bone health', de: 'Knochengesundheit unterstützen' },
  'goal.heartHealth': { en: 'Heart health', de: 'Herzgesundheit' },
  
  // Daily check-in
  'checkin.title': { en: 'Daily Check-in', de: 'Täglicher Check-in' },
  'checkin.howFeeling': { en: 'How are you feeling today?', de: 'Wie fühlen Sie sich heute?' },
  'checkin.mood': { en: 'Mood', de: 'Stimmung' },
  'checkin.energy': { en: 'Energy Level', de: 'Energieniveau' },
  'checkin.sleepQuality': { en: 'Sleep Quality', de: 'Schlafqualität' },
  'checkin.symptoms': { en: 'Any symptoms today?', de: 'Symptome heute?' },
  'checkin.cycleDay': { en: 'Cycle day (if tracking)', de: 'Zyklustag (falls verfolgt)' },
  'checkin.periodActive': { en: 'Currently on period?', de: 'Gerade Periode?' },
  'checkin.notes': { en: 'Additional notes', de: 'Zusätzliche Notizen' },
  'checkin.submit': { en: 'Submit Check-in', de: 'Check-in absenden' },
  'checkin.periodTip': { en: 'Allow yourself some extra rest during your period.', de: 'Gönnen Sie sich während Ihrer Periode etwas mehr Ruhe.' },
  
  // Cycle phases
  'cycle.title': { en: 'Understanding Your Cycle', de: 'Ihren Zyklus verstehen' },
  'cycle.menstrual': { en: 'Menstrual Phase', de: 'Menstruationsphase' },
  'cycle.follicular': { en: 'Follicular Phase', de: 'Follikelphase' },
  'cycle.ovulation': { en: 'Ovulation Phase', de: 'Ovulationsphase' },
  'cycle.luteal': { en: 'Luteal Phase', de: 'Lutealphase' },
  'cycle.body': { en: 'Body', de: 'Körper' },
  'cycle.mind': { en: 'Mind', de: 'Geist' },
  'cycle.energy': { en: 'Energy', de: 'Energie' },
  'cycle.stressResilience': { en: 'Patience & Stress Resilience', de: 'Geduld & Stressresistenz' },
  'cycle.tips': { en: 'Tips', de: 'Tipps' },
  
  // Hormones
  'hormones.title': { en: 'Understanding Your Hormones', de: 'Ihre Hormone verstehen' },
  'hormones.effects': { en: 'Effects', de: 'Auswirkungen' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('language');
      if (savedLang === 'en' || savedLang === 'de') {
        setLanguageState(savedLang);
      }
    } catch (error) {
      console.log('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language] || translation.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export { Language };
