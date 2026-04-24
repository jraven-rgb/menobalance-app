import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { authApi, symptomApi } from '../src/services/api';
import { Colors, FontSizes, Spacing } from '../src/constants/colors';
import Button from '../src/components/Button';
import Card from '../src/components/Card';

const GOALS = [
  { id: 'reduceHotFlashes', en: 'Reduce hot flashes', de: 'Hitzewallungen reduzieren' },
  { id: 'betterSleep', en: 'Better sleep', de: 'Besserer Schlaf' },
  { id: 'manageWeight', en: 'Manage weight', de: 'Gewicht kontrollieren' },
  { id: 'improveMood', en: 'Improve mood', de: 'Stimmung verbessern' },
  { id: 'increaseEnergy', en: 'Increase energy', de: 'Energie steigern' },
  { id: 'reduceAnxiety', en: 'Reduce anxiety', de: 'Angst reduzieren' },
  { id: 'boneHealth', en: 'Support bone health', de: 'Knochengesundheit' },
  { id: 'heartHealth', en: 'Heart health', de: 'Herzgesundheit' },
];

const EXERCISE_LEVELS = [
  { id: 'none', en: 'No exercise', de: 'Kein Sport' },
  { id: 'beginner', en: 'Beginner', de: 'Anfänger' },
  { id: 'intermediate', en: 'Intermediate', de: 'Fortgeschritten' },
  { id: 'advanced', en: 'Advanced', de: 'Experte' },
];

const SLEEP_QUALITY = [
  { id: 'good', en: 'Good', de: 'Gut' },
  { id: 'fair', en: 'Fair', de: 'Mäßig' },
  { id: 'poor', en: 'Poor', de: 'Schlecht' },
];

const DIETARY_RESTRICTIONS = [
  { id: 'vegetarian', en: 'Vegetarian', de: 'Vegetarisch' },
  { id: 'vegan', en: 'Vegan', de: 'Vegan' },
  { id: 'glutenFree', en: 'Gluten-free', de: 'Glutenfrei' },
  { id: 'dairyFree', en: 'Dairy-free', de: 'Laktosefrei' },
  { id: 'lowSugar', en: 'Low sugar', de: 'Zuckerarm' },
  { id: 'none', en: 'No restrictions', de: 'Keine Einschränkungen' },
];

const PHASES = [
  { id: 'perimenopause', emoji: '🌱', en: 'Perimenopause', de: 'Perimenopause', desc_en: 'Transitional phase, starting in 40s', desc_de: 'Übergangsphase, ab 40er' },
  { id: 'menopause', emoji: '🌸', en: 'Menopause', de: 'Menopause', desc_en: '12 months without period', desc_de: '12 Monate ohne Periode' },
  { id: 'postmenopause', emoji: '🌼', en: 'Postmenopause', de: 'Postmenopause', desc_en: 'After menopause', desc_de: 'Nach der Menopause' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  
  // Form state
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'de'>(language);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [lastPeriod, setLastPeriod] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [selectedPhase, setSelectedPhase] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [exerciseLevel, setExerciseLevel] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [medications, setMedications] = useState('');
  const [healthConditions, setHealthConditions] = useState('');

  useEffect(() => {
    loadSymptoms();
  }, [selectedLanguage]);

  const loadSymptoms = async () => {
    try {
      const response = await symptomApi.getSymptoms(selectedLanguage);
      setSymptoms(response.data);
    } catch (error) {
      console.error('Error loading symptoms:', error);
    }
  };

  const handleLanguageSelect = (lang: 'en' | 'de') => {
    setSelectedLanguage(lang);
    setLanguage(lang);
  };

  const toggleSymptom = (symptomName: string) => {
    if (selectedSymptoms.includes(symptomName)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptomName));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptomName]);
    }
  };

  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  const toggleDietary = (id: string) => {
    if (id === 'none') {
      setDietaryRestrictions(['none']);
    } else {
      const newRestrictions = dietaryRestrictions.filter(d => d !== 'none');
      if (newRestrictions.includes(id)) {
        setDietaryRestrictions(newRestrictions.filter(d => d !== id));
      } else {
        setDietaryRestrictions([...newRestrictions, id]);
      }
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const data = {
        age: age ? parseInt(age) : undefined,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        last_period_date: lastPeriod || undefined,
        cycle_length: cycleLength ? parseInt(cycleLength) : undefined,
        menopause_phase: selectedPhase || undefined,
        current_symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : undefined,
        goals: selectedGoals.length > 0 ? selectedGoals : undefined,
        medications: medications ? medications.split(',').map(m => m.trim()) : undefined,
        dietary_restrictions: dietaryRestrictions.filter(d => d !== 'none'),
        exercise_experience: exerciseLevel || undefined,
        sleep_patterns: sleepQuality || undefined,
        health_conditions: healthConditions ? healthConditions.split(',').map(h => h.trim()) : undefined,
        language: selectedLanguage,
      };

      await authApi.completeOnboarding(data);
      await refreshUser();
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert(
        selectedLanguage === 'de' ? 'Fehler' : 'Error',
        selectedLanguage === 'de' ? 'Einrichtung fehlgeschlagen' : 'Failed to complete setup'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>
              {selectedLanguage === 'de' ? 'Sprache wählen' : 'Choose Language'}
            </Text>
            <Text style={styles.stepSubtitle}>
              {selectedLanguage === 'de' ? 'Wählen Sie Ihre bevorzugte Sprache' : 'Select your preferred language'}
            </Text>
            <View style={styles.languageOptions}>
              <TouchableOpacity
                style={[styles.languageCard, selectedLanguage === 'en' && styles.languageCardActive]}
                onPress={() => handleLanguageSelect('en')}
              >
                <Text style={styles.languageFlag}>🇬🇧</Text>
                <Text style={[styles.languageText, selectedLanguage === 'en' && styles.languageTextActive]}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.languageCard, selectedLanguage === 'de' && styles.languageCardActive]}
                onPress={() => handleLanguageSelect('de')}
              >
                <Text style={styles.languageFlag}>🇩🇪</Text>
                <Text style={[styles.languageText, selectedLanguage === 'de' && styles.languageTextActive]}>Deutsch</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>
              {selectedLanguage === 'de' ? 'Über Sie' : 'About You'}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{selectedLanguage === 'de' ? 'Alter' : 'Age'}</Text>
              <TextInput
                style={styles.input}
                placeholder={selectedLanguage === 'de' ? 'Ihr Alter' : 'Your age'}
                placeholderTextColor={Colors.textMuted}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
                <Text style={styles.inputLabel}>{selectedLanguage === 'de' ? 'Größe (cm)' : 'Height (cm)'}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="165"
                  placeholderTextColor={Colors.textMuted}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>{selectedLanguage === 'de' ? 'Gewicht (kg)' : 'Weight (kg)'}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="65"
                  placeholderTextColor={Colors.textMuted}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>
              {selectedLanguage === 'de' ? 'Zyklus-Information' : 'Cycle Information'}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {selectedLanguage === 'de' ? 'Letzte Periode (JJJJ-MM-TT)' : 'Last period (YYYY-MM-DD)'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="2024-01-15"
                placeholderTextColor={Colors.textMuted}
                value={lastPeriod}
                onChangeText={setLastPeriod}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {selectedLanguage === 'de' ? 'Übliche Zykluslänge (Tage)' : 'Usual cycle length (days)'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="28"
                placeholderTextColor={Colors.textMuted}
                value={cycleLength}
                onChangeText={setCycleLength}
                keyboardType="numeric"
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>
              {selectedLanguage === 'de' ? 'Ihre Phase' : 'Your Phase'}
            </Text>
            <View style={styles.phaseList}>
              {PHASES.map((phase) => (
                <TouchableOpacity
                  key={phase.id}
                  style={[styles.phaseCard, selectedPhase === phase.id && styles.phaseCardActive]}
                  onPress={() => setSelectedPhase(phase.id)}
                >
                  <Text style={styles.phaseEmoji}>{phase.emoji}</Text>
                  <View style={styles.phaseInfo}>
                    <Text style={[styles.phaseName, selectedPhase === phase.id && styles.phaseNameActive]}>
                      {selectedLanguage === 'de' ? phase.de : phase.en}
                    </Text>
                    <Text style={styles.phaseDesc}>
                      {selectedLanguage === 'de' ? phase.desc_de : phase.desc_en}
                    </Text>
                  </View>
                  {selectedPhase === phase.id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>
              {selectedLanguage === 'de' ? 'Aktuelle Symptome' : 'Current Symptoms'}
            </Text>
            <Text style={styles.stepSubtitle}>
              {selectedLanguage === 'de' ? 'Wählen Sie alle zutreffenden' : 'Select all that apply'}
            </Text>
            <ScrollView style={styles.symptomScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {symptoms.slice(0, 20).map((symptom, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.chip, selectedSymptoms.includes(symptom.name) && styles.chipActive]}
                    onPress={() => toggleSymptom(symptom.name)}
                  >
                    <Text style={[styles.chipText, selectedSymptoms.includes(symptom.name) && styles.chipTextActive]}>
                      {symptom.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>
              {selectedLanguage === 'de' ? 'Ihre Ziele' : 'Your Goals'}
            </Text>
            <View style={styles.chipContainer}>
              {GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[styles.chip, selectedGoals.includes(goal.id) && styles.chipActive]}
                  onPress={() => toggleGoal(goal.id)}
                >
                  <Text style={[styles.chipText, selectedGoals.includes(goal.id) && styles.chipTextActive]}>
                    {selectedLanguage === 'de' ? goal.de : goal.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>
              {selectedLanguage === 'de' ? 'Lebensstil' : 'Lifestyle'}
            </Text>
            <Text style={styles.sectionLabel}>
              {selectedLanguage === 'de' ? 'Sporterfahrung' : 'Exercise Experience'}
            </Text>
            <View style={styles.optionRow}>
              {EXERCISE_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[styles.optionCard, exerciseLevel === level.id && styles.optionCardActive]}
                  onPress={() => setExerciseLevel(level.id)}
                >
                  <Text style={[styles.optionText, exerciseLevel === level.id && styles.optionTextActive]}>
                    {selectedLanguage === 'de' ? level.de : level.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>
              {selectedLanguage === 'de' ? 'Schlafqualität' : 'Sleep Quality'}
            </Text>
            <View style={styles.optionRow}>
              {SLEEP_QUALITY.map((quality) => (
                <TouchableOpacity
                  key={quality.id}
                  style={[styles.optionCard, sleepQuality === quality.id && styles.optionCardActive]}
                  onPress={() => setSleepQuality(quality.id)}
                >
                  <Text style={[styles.optionText, sleepQuality === quality.id && styles.optionTextActive]}>
                    {selectedLanguage === 'de' ? quality.de : quality.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 7:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>
              {selectedLanguage === 'de' ? 'Ernährung & Gesundheit' : 'Diet & Health'}
            </Text>
            <Text style={styles.sectionLabel}>
              {selectedLanguage === 'de' ? 'Ernährungseinschränkungen' : 'Dietary Restrictions'}
            </Text>
            <View style={styles.chipContainer}>
              {DIETARY_RESTRICTIONS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.chip, dietaryRestrictions.includes(item.id) && styles.chipActive]}
                  onPress={() => toggleDietary(item.id)}
                >
                  <Text style={[styles.chipText, dietaryRestrictions.includes(item.id) && styles.chipTextActive]}>
                    {selectedLanguage === 'de' ? item.de : item.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {selectedLanguage === 'de' ? 'Medikamente (optional, kommagetrennt)' : 'Medications (optional, comma-separated)'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={selectedLanguage === 'de' ? 'z.B. Vitamin D, Blutdruckmedikamente' : 'e.g., Vitamin D, Blood pressure meds'}
                placeholderTextColor={Colors.textMuted}
                value={medications}
                onChangeText={setMedications}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {selectedLanguage === 'de' ? 'Gesundheitszustände (optional)' : 'Health conditions (optional)'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={selectedLanguage === 'de' ? 'z.B. Diabetes, Endometriose' : 'e.g., Diabetes, Endometriosis'}
                placeholderTextColor={Colors.textMuted}
                value={healthConditions}
                onChangeText={setHealthConditions}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const totalSteps = 8;
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{step + 1} / {totalSteps}</Text>
        </View>

        {/* Skip button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            setStep(totalSteps - 1);
            handleComplete();
          }}
        >
          <Text style={styles.skipText}>
            {selectedLanguage === 'de' ? 'Überspringen' : 'Skip'}
          </Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navButtons}>
          {step > 0 && (
            <Button
              title={selectedLanguage === 'de' ? 'Zurück' : 'Back'}
              onPress={() => setStep(step - 1)}
              variant="outline"
              style={styles.navButton}
            />
          )}
          {step < totalSteps - 1 ? (
            <Button
              title={selectedLanguage === 'de' ? 'Weiter' : 'Next'}
              onPress={() => setStep(step + 1)}
              style={[styles.navButton, step === 0 && { flex: 1 }]}
            />
          ) : (
            <Button
              title={selectedLanguage === 'de' ? 'Abschließen' : 'Complete'}
              onPress={handleComplete}
              loading={loading}
              style={styles.navButton}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    marginRight: Spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  skipText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    marginBottom: Spacing.lg,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  languageCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  languageCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '15',
  },
  languageFlag: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  languageText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  languageTextActive: {
    color: Colors.primary,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
  },
  phaseList: {
    gap: Spacing.sm,
  },
  phaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  phaseCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '10',
  },
  phaseEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  phaseInfo: {
    flex: 1,
  },
  phaseName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  phaseNameActive: {
    color: Colors.primary,
  },
  phaseDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
  },
  symptomScroll: {
    maxHeight: 350,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  chipTextActive: {
    color: Colors.white,
  },
  sectionLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  optionTextActive: {
    color: Colors.white,
  },
  navButtons: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  navButton: {
    flex: 1,
  },
});
