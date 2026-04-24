import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { adviceApi, symptomApi } from '../../src/services/api';
import { Colors, CategoryColors, CategoryImages, FontSizes, Spacing, BorderRadius } from '../../src/constants/colors';

// ─── Exercise illustration data ───
const exerciseIllustrations: Record<string, { emoji: string; description: string; muscles: string }> = {
  'lunges': { emoji: '🦵', description: 'Step forward with one leg, lowering hips until both knees are at 90°. Keep front knee over ankle. Push back to start.', muscles: 'Quads, Glutes, Hamstrings' },
  'squats': { emoji: '🏋️‍♀️', description: 'Stand feet shoulder-width apart. Bend knees and lower as if sitting in a chair. Keep chest up, knees over toes.', muscles: 'Quads, Glutes, Core' },
  'plank': { emoji: '💪', description: 'Hold a push-up position with arms straight or on forearms. Keep body in a straight line from head to heels.', muscles: 'Core, Shoulders, Back' },
  'bridge': { emoji: '🌉', description: 'Lie on back, knees bent, feet flat. Lift hips toward ceiling squeezing glutes. Hold 2-3 seconds, lower slowly.', muscles: 'Glutes, Hamstrings, Core' },
  'cat-cow': { emoji: '🐱', description: 'On all fours, arch back up (cat) then drop belly down (cow). Move slowly with breath. Great for spine mobility.', muscles: 'Spine, Core, Back' },
  'warrior': { emoji: '⚔️', description: 'Step one foot back, front knee bent at 90°. Arms extended overhead or to sides. Hold steady, breathe deeply.', muscles: 'Legs, Core, Shoulders' },
  'tree pose': { emoji: '🌳', description: 'Stand on one leg, place other foot on inner thigh or calf (not knee). Hands at heart or overhead. Focus on balance.', muscles: 'Balance, Core, Ankles' },
  'deadlift': { emoji: '🏋️', description: 'Stand with feet hip-width, slight knee bend. Hinge forward at hips, lower weight along legs. Keep back straight.', muscles: 'Hamstrings, Glutes, Back' },
  'push-up': { emoji: '💪', description: 'Hands shoulder-width on floor. Lower chest to ground, push back up. Modify on knees if needed.', muscles: 'Chest, Shoulders, Triceps' },
  'push-ups': { emoji: '💪', description: 'Hands shoulder-width on floor. Lower chest to ground, push back up. Modify on knees if needed.', muscles: 'Chest, Shoulders, Triceps' },
  'mountain climber': { emoji: '⛰️', description: 'In plank position, alternate driving knees toward chest quickly. Keep hips level and core tight.', muscles: 'Core, Shoulders, Cardio' },
  'bird dog': { emoji: '🐕', description: 'On all fours, extend opposite arm and leg simultaneously. Hold 2 seconds, switch. Keep core stable.', muscles: 'Core, Balance, Back' },
  'side plank': { emoji: '📐', description: 'Lie on side, prop up on elbow. Lift hips off ground, hold. Body forms straight line. Switch sides.', muscles: 'Obliques, Core, Shoulders' },
  'clamshell': { emoji: '🐚', description: 'Lie on side, knees bent at 45°. Keep feet together, open top knee like a clamshell. Slow and controlled.', muscles: 'Hip Abductors, Glutes' },
  'wall sit': { emoji: '🧱', description: 'Back against wall, slide down until knees at 90°. Hold position. Thighs parallel to floor.', muscles: 'Quads, Glutes, Endurance' },
  'downward dog': { emoji: '🐕', description: 'Hands and feet on floor, hips high forming inverted V. Press heels toward floor, relax head between arms.', muscles: 'Hamstrings, Shoulders, Calves' },
  'child pose': { emoji: '🧒', description: 'Kneel, sit back on heels, extend arms forward on floor. Rest forehead down. Breathe deeply and relax.', muscles: 'Back, Hips, Relaxation' },
  'pigeon pose': { emoji: '🕊️', description: 'From all fours, bring one knee forward behind wrist. Extend other leg back. Fold forward for a deep hip stretch.', muscles: 'Hip Flexors, Glutes' },
  'hip circle': { emoji: '⭕', description: 'Stand with hands on hips. Make large circles with your hips, both directions. Great for mobility.', muscles: 'Hips, Core, Lower Back' },
  'kegel': { emoji: '🔴', description: 'Squeeze pelvic floor muscles (as if stopping urine flow). Hold 5 seconds, release. Repeat 10 times.', muscles: 'Pelvic Floor' },
  'swimming': { emoji: '🏊‍♀️', description: 'Low-impact full-body exercise. Excellent for joint health and cardiovascular fitness during menopause.', muscles: 'Full Body, Cardio' },
  'walking': { emoji: '🚶‍♀️', description: 'Brisk walking for 30 minutes. Aim for 4-5 km/h pace. Swing arms naturally. Great for mood and heart health.', muscles: 'Legs, Cardio, Mental Health' },
  'stretching': { emoji: '🤸‍♀️', description: 'Gentle full-body stretches held for 20-30 seconds each. Focus on tight areas. Never bounce.', muscles: 'Flexibility, Recovery' },
  'yoga nidra': { emoji: '🧘‍♀️', description: 'Luteal Phase special: Lie flat in Savasana. Do a progressive muscle relaxation from your toes up to your head to combat deep anxiety.', muscles: 'Nervous System, Sleep' },
  'pelvic release': { emoji: '🌸', description: 'Luteal Phase special: Deep squat or happy baby pose to release physical tension held in the pelvic floor during hormonal shifts.', muscles: 'Pelvis, Hips' },
};

const TAI_CHI_VIDEO_URL = 'https://www.youtube.com/watch?v=nluiDVqg0f4';

// ─── Category header images ───
const categoryHeaderImages: Record<string, string> = {
  diet: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=70',
  exercise: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=70',
  sleep: 'https://images.unsplash.com/photo-1515894203077-9cd36032142f?w=800&q=70',
  supplements: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=70',
  breathing: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=70',
};

// ─── Day names ───
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayNamesDe = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

interface WellnessCategory {
  id: string;
  icon: string;
  label: { en: string; de: string };
  description: { en: string; de: string };
  color: typeof CategoryColors.diet;
  image: string;
}

const categories: WellnessCategory[] = [
  {
    id: 'diet', icon: 'nutrition',
    label: { en: 'Diet & Nutrition', de: 'Ernährung' },
    description: { en: 'Foods, herbs, recipes & supplements', de: 'Lebensmittel, Kräuter, Rezepte & Ergänzungen' },
    color: CategoryColors.diet, image: CategoryImages.diet,
  },
  {
    id: 'exercise', icon: 'fitness',
    label: { en: 'Movement & Fitness', de: 'Bewegung & Fitness' },
    description: { en: 'Weekly plan with daily exercises', de: 'Wochenplan mit täglichen Übungen' },
    color: CategoryColors.exercise, image: CategoryImages.exercise,
  },
  {
    id: 'sleep', icon: 'moon',
    label: { en: 'Rest & Sleep', de: 'Ruhe & Schlaf' },
    description: { en: 'Better sleep habits & routines', de: 'Bessere Schlafgewohnheiten' },
    color: CategoryColors.sleep, image: CategoryImages.sleep,
  },
  {
    id: 'supplements', icon: 'leaf',
    label: { en: 'Herbs & Supplements', de: 'Kräuter & Ergänzungen' },
    description: { en: 'Natural remedies & vitamins', de: 'Natürliche Heilmittel & Vitamine' },
    color: CategoryColors.supplements, image: CategoryImages.supplements,
  },
  {
    id: 'breathing', icon: 'flower',
    label: { en: 'Relaxation & Breathing', de: 'Entspannung & Atmung' },
    description: { en: 'Calm your mind & reduce stress', de: 'Beruhigen Sie Geist & Stress' },
    color: CategoryColors.breathing, image: CategoryImages.breathing,
  },
];

export default function WellnessScreen() {
  const { category: paramCategory } = useLocalSearchParams<{ category?: string }>();
  const { user } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(paramCategory || null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentSymptoms, setRecentSymptoms] = useState<string[]>([]);
  const [exerciseModal, setExerciseModal] = useState<{ name: string; data: typeof exerciseIllustrations['lunges'] } | null>(null);

  const todayIndex = new Date().getDay();
  const todayName = dayNames[todayIndex];

  useEffect(() => {
    loadRecentSymptoms();
  }, []);

  useEffect(() => {
    if (paramCategory) {
      setSelectedCategory(paramCategory);
      fetchAdvice(paramCategory);
    }
  }, [paramCategory]);

  const loadRecentSymptoms = async () => {
    try {
      const response = await symptomApi.getLogs();
      if (response.data && response.data.length > 0) {
        const allSymptoms = response.data.slice(0, 7).flatMap((log: any) => log.symptoms);
        const uniqueSymptoms = [...new Set(allSymptoms)] as string[];
        setRecentSymptoms(uniqueSymptoms.slice(0, 5));
      }
    } catch (error) {
      console.log('No recent symptoms');
    }
  };

  const fetchAdvice = async (categoryId: string) => {
    setLoading(true);
    setAdvice(null);
    try {
      const response = await adviceApi.getAdvice(
        categoryId,
        recentSymptoms.length > 0 ? recentSymptoms : undefined,
        user?.menopause_phase || undefined,
        language
      );
      setAdvice(response.data.advice);
    } catch (error) {
      console.error('Error fetching advice:', error);
      setAdvice(language === 'de' 
        ? 'Beratung konnte nicht geladen werden. Bitte versuchen Sie es erneut.' 
        : 'Unable to load personalized advice. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    fetchAdvice(categoryId);
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setAdvice(null);
  };

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  // ─── Check if a word matches an exercise name ───
  const findExercise = (word: string): { name: string; data: typeof exerciseIllustrations['lunges'] } | null => {
    const lower = word.toLowerCase().replace(/[^a-z\s-]/g, '');
    for (const [name, data] of Object.entries(exerciseIllustrations)) {
      if (lower.includes(name) || name.includes(lower)) {
        return { name, data };
      }
    }
    return null;
  };

  // ─── Check if section is a weekday ───
  const isWeekdaySection = (title: string): string | null => {
    const allDays = [...dayNames, ...dayNamesDe];
    for (const day of allDays) {
      if (title.toLowerCase().includes(day.toLowerCase())) {
        return day;
      }
    }
    return null;
  };

  const isTodaySection = (title: string): boolean => {
    const todayEn = dayNames[todayIndex].toLowerCase();
    const todayDe = dayNamesDe[todayIndex].toLowerCase();
    const lower = title.toLowerCase();
    return lower.includes(todayEn) || lower.includes(todayDe);
  };

  // ─── Check for tai chi mentions ───
  const containsTaiChi = (text: string): boolean => {
    return text.toLowerCase().includes('tai chi') || text.toLowerCase().includes('taichi');
  };

  // ─── Render formatted advice ───
  const renderFormattedAdvice = (text: string) => {
    const categoryColor = selectedCategoryData?.color || CategoryColors.diet;
    const sections: JSX.Element[] = [];
    let key = 0;
    const lines = text.split('\n');
    let currentSection: { title: string; content: string[] } | null = null;
    let weekdaySections: { title: string; content: string[]; isToday: boolean }[] = [];
    let otherSections: { title: string; content: string[] }[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      // Detect section headers: ##, **...**,  or numbered items with weekday names
      const isSectionHeader = 
        trimmed.startsWith('##') || 
        (trimmed.startsWith('**') && trimmed.endsWith('**')) ||
        (trimmed.startsWith('**') && trimmed.includes('**') && trimmed.indexOf('**', 2) < trimmed.length - 2) ||
        (/^\d+\.\s*\*?\*?[A-Z]/.test(trimmed) && (
          isWeekdaySection(trimmed) !== null || 
          trimmed.includes('Benefits') || trimmed.includes('Tai Chi') || 
          trimmed.includes('Modifications') || trimmed.includes('Warning') ||
          trimmed.includes('Vorteile') || trimmed.includes('Modifikation') ||
          trimmed.includes('Foods') || trimmed.includes('Herbs') || trimmed.includes('Recipe') ||
          trimmed.includes('Breakfast') || trimmed.includes('Lunch') || trimmed.includes('Dinner') || 
          trimmed.includes('Snack') || trimmed.includes('Hydra') || trimmed.includes('Anti-Inflam') ||
          trimmed.includes('Supplements') || trimmed.includes('Bedtime') || trimmed.includes('Sleep')
        ));

      if (isSectionHeader) {
        if (currentSection) {
          const dayMatch = isWeekdaySection(currentSection.title);
          if (dayMatch && selectedCategory === 'exercise') {
            weekdaySections.push({ ...currentSection, isToday: isTodaySection(currentSection.title) });
          } else {
            otherSections.push(currentSection);
          }
        }
        currentSection = {
          title: trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/:$/, ''),
          content: [],
        };
      } else if (currentSection) {
        currentSection.content.push(trimmed);
      } else {
        sections.push(
          <Text key={key++} style={styles.introText}>{trimmed.replace(/\*\*/g, '')}</Text>
        );
      }
    });

    if (currentSection) {
      const dayMatch = isWeekdaySection(currentSection.title);
      if (dayMatch && selectedCategory === 'exercise') {
        weekdaySections.push({ ...currentSection, isToday: isTodaySection(currentSection.title) });
      } else {
        otherSections.push(currentSection);
      }
    }

    // For exercise: render yoga/pelvic links, then weekday grid, then other sections
    if (selectedCategory === 'exercise' && weekdaySections.length > 0) {
      // Quick routine links at top
      sections.push(
        <View key={key++} style={styles.quickRoutines}>
          <Text style={[styles.quickRoutinesTitle, { color: categoryColor.primary }]}>
            {language === 'de' ? 'Tägliche Routinen starten' : 'Start Daily Routines'}
          </Text>
          <View style={styles.quickRoutineRow}>
            <TouchableOpacity
              style={[styles.quickRoutineBtn, { backgroundColor: '#EDE7F6' }]}
              onPress={() => router.push('/routines?type=yoga')}
            >
              <Text style={styles.quickRoutineEmoji}>🧘‍♀️</Text>
              <Text style={[styles.quickRoutineLabel, { color: '#7E57C2' }]}>Yoga</Text>
              <Text style={styles.quickRoutineDur}>20 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickRoutineBtn, { backgroundColor: '#FCE4EC' }]}
              onPress={() => router.push('/routines?type=pelvic_floor')}
            >
              <Text style={styles.quickRoutineEmoji}>🌅</Text>
              <Text style={[styles.quickRoutineLabel, { color: '#EC407A' }]}>
                {language === 'de' ? 'Beckenboden' : 'Pelvic Floor'}
              </Text>
              <Text style={styles.quickRoutineDur}>5 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickRoutineBtn, { backgroundColor: '#F4F0FA' }]}
              onPress={() => router.push('/routines?type=cortisol_reset')}
            >
              <Text style={styles.quickRoutineEmoji}>⚡</Text>
              <Text style={[styles.quickRoutineLabel, { color: '#9370DB' }]}>Cortisol Reset</Text>
              <Text style={styles.quickRoutineDur}>5 min</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

      // Weekday cards
      sections.push(
        <View key={key++} style={styles.weekdaySection}>
          <Text style={[styles.weekdayTitle, { color: categoryColor.primary }]}>
            {language === 'de' ? 'Ihr Wochenplan' : 'Your Weekly Plan'}
          </Text>
          {weekdaySections.map((day, idx) => (
            <View
              key={`day-${idx}`}
              style={[
                styles.weekdayCard,
                day.isToday && styles.weekdayCardToday,
                day.isToday && { borderColor: categoryColor.primary },
              ]}
            >
              {day.isToday && (
                <View style={[styles.todayBadge, { backgroundColor: categoryColor.primary }]}>
                  <Text style={styles.todayBadgeText}>
                    {language === 'de' ? 'HEUTE' : 'TODAY'}
                  </Text>
                </View>
              )}
              <Text style={[styles.weekdayName, day.isToday && { color: categoryColor.primary, fontWeight: '800' }]}>
                {day.title}
              </Text>
              {day.content.map((line, lineIdx) => renderExerciseLine(line, lineIdx, categoryColor))}
            </View>
          ))}
        </View>
      );
    }

    // Render remaining sections
    otherSections.forEach((section) => {
      sections.push(renderSection(section, key++, categoryColor));
    });

    return sections;
  };

  // ─── Render a single exercise line (with tappable exercise names) ───
  const renderExerciseLine = (line: string, key: number, color: typeof CategoryColors.diet) => {
    const clean = line.replace(/\*\*/g, '');
    
    if (clean.startsWith('-') || clean.startsWith('•') || clean.startsWith('*')) {
      const content = clean.replace(/^[-•*]\s*/, '');
      
      // Check for tai chi
      if (containsTaiChi(content)) {
        return (
          <View key={key} style={styles.bulletItem}>
            <View style={[styles.bulletDot, { backgroundColor: color.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletText}>{content}</Text>
              <TouchableOpacity
                style={styles.videoLink}
                onPress={() => Linking.openURL(TAI_CHI_VIDEO_URL)}
              >
                <Ionicons name="play-circle" size={18} color="#E53935" />
                <Text style={styles.videoLinkText}>
                  {language === 'de' ? 'Tai Chi Video ansehen' : 'Watch Tai Chi Video'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      // Check for tappable exercise names
      const exerciseMatch = findExercise(content.split(':')[0].split('(')[0]);
      if (exerciseMatch && selectedCategory === 'exercise') {
        return (
          <TouchableOpacity key={key} style={styles.bulletItem} onPress={() => setExerciseModal(exerciseMatch)}>
            <View style={[styles.bulletDot, { backgroundColor: color.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletText}>
                <Text style={[styles.exerciseName, { color: color.primary }]}>
                  {content.split(':')[0].split('(')[0].trim()}
                </Text>
                {content.includes(':') ? ': ' + content.split(':').slice(1).join(':') : 
                 content.includes('(') ? ' (' + content.split('(').slice(1).join('(') : ''}
              </Text>
            </View>
            <Ionicons name="information-circle-outline" size={18} color={color.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        );
      }

      return (
        <View key={key} style={styles.bulletItem}>
          <View style={[styles.bulletDot, { backgroundColor: color.primary }]} />
          <Text style={styles.bulletText}>{content}</Text>
        </View>
      );
    }

    if (/^\d+\./.test(clean)) {
      const num = clean.match(/^(\d+)\./)?.[1];
      const content = clean.replace(/^\d+\.\s*/, '');
      return (
        <View key={key} style={styles.numberedItem}>
          <View style={[styles.numberCircle, { backgroundColor: color.light, borderColor: color.primary }]}>
            <Text style={[styles.numberText, { color: color.primary }]}>{num}</Text>
          </View>
          <Text style={styles.numberedText}>{content}</Text>
        </View>
      );
    }

    return <Text key={key} style={styles.contentText}>{clean}</Text>;
  };

  // ─── Render a content section ───
  const renderSection = (section: { title: string; content: string[] }, key: number, color: typeof CategoryColors.diet) => {
    const hasTaiChi = section.content.some(c => containsTaiChi(c)) || containsTaiChi(section.title);
    
    return (
      <View key={key} style={[styles.adviceSection, { borderLeftColor: color.primary }]}>
        <View style={[styles.sectionHeader, { backgroundColor: color.light }]}>
          <Ionicons name={getSectionIcon(section.title)} size={20} color={color.primary} />
          <Text style={[styles.sectionTitle, { color: color.primary }]}>{section.title}</Text>
        </View>
        <View style={styles.sectionContent}>
          {section.content.map((line, idx) => renderExerciseLine(line, idx, color))}
          {hasTaiChi && (
            <TouchableOpacity
              style={styles.taiChiLink}
              onPress={() => Linking.openURL(TAI_CHI_VIDEO_URL)}
            >
              <Ionicons name="play-circle" size={22} color="#E53935" />
              <Text style={styles.taiChiLinkText}>
                {language === 'de' ? 'Tai Chi für Anfänger - Video' : 'Tai Chi for Beginners - Video'}
              </Text>
              <Ionicons name="open-outline" size={16} color="#E53935" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const getSectionIcon = (title: string): any => {
    const lower = title.toLowerCase();
    if (lower.includes('food') || lower.includes('eat') || lower.includes('lebensmittel') || lower.includes('include')) return 'restaurant';
    if (lower.includes('avoid') || lower.includes('meiden')) return 'close-circle';
    if (lower.includes('herb') || lower.includes('kräuter') || lower.includes('spice')) return 'leaf';
    if (lower.includes('supplement') || lower.includes('vitamin')) return 'medical';
    if (lower.includes('exercise') || lower.includes('übung') || lower.includes('benefit')) return 'fitness';
    if (lower.includes('breathing') || lower.includes('atem')) return 'flower';
    if (lower.includes('sleep') || lower.includes('schlaf')) return 'moon';
    if (lower.includes('tip') || lower.includes('tipp') || lower.includes('motivation')) return 'bulb';
    if (lower.includes('routine') || lower.includes('bedtime')) return 'time';
    if (lower.includes('warning') || lower.includes('warnung') || lower.includes('modification')) return 'warning';
    if (lower.includes('recipe') || lower.includes('rezept') || lower.includes('breakfast') || lower.includes('lunch') || lower.includes('dinner') || lower.includes('snack')) return 'restaurant';
    if (lower.includes('tai chi')) return 'body';
    if (lower.includes('hydra')) return 'water';
    if (lower.includes('anti-inflam') || lower.includes('entzündung')) return 'shield-checkmark';
    return 'checkmark-circle';
  };

  // ─── Breathing exercise visualization ───
  const renderBreathingExercise = () => {
    if (selectedCategory !== 'breathing' || !advice) return null;
    return (
      <View style={styles.breathingCard}>
        <View style={styles.breathingHeader}>
          <Text style={styles.breathingEmoji}>🧘‍♀️</Text>
          <Text style={styles.breathingTitle}>
            {language === 'de' ? 'Schnelle Atemübung' : 'Quick Breathing Exercise'}
          </Text>
        </View>
        <Text style={styles.breathingSubtitle}>
          {language === 'de' ? '4-7-8 Technik für sofortige Ruhe' : '4-7-8 Technique for Instant Calm'}
        </Text>
        <View style={styles.breathingSteps}>
          <View style={[styles.breathStep, { backgroundColor: '#E3F2FD' }]}>
            <View style={[styles.breathCircle, { backgroundColor: '#2196F3' }]}>
              <Text style={styles.breathNumber}>4</Text>
            </View>
            <View style={styles.breathInfo}>
              <Text style={styles.breathAction}>{language === 'de' ? 'EINATMEN' : 'INHALE'}</Text>
              <Text style={styles.breathDesc}>{language === 'de' ? '4 Sekunden durch die Nase' : '4 seconds through nose'}</Text>
            </View>
          </View>
          <View style={[styles.breathStep, { backgroundColor: '#FFF3E0' }]}>
            <View style={[styles.breathCircle, { backgroundColor: '#FF9800' }]}>
              <Text style={styles.breathNumber}>7</Text>
            </View>
            <View style={styles.breathInfo}>
              <Text style={styles.breathAction}>{language === 'de' ? 'HALTEN' : 'HOLD'}</Text>
              <Text style={styles.breathDesc}>{language === 'de' ? '7 Sekunden Atem anhalten' : '7 seconds hold breath'}</Text>
            </View>
          </View>
          <View style={[styles.breathStep, { backgroundColor: '#E8F5E9' }]}>
            <View style={[styles.breathCircle, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.breathNumber}>8</Text>
            </View>
            <View style={styles.breathInfo}>
              <Text style={styles.breathAction}>{language === 'de' ? 'AUSATMEN' : 'EXHALE'}</Text>
              <Text style={styles.breathDesc}>{language === 'de' ? '8 Sekunden durch den Mund' : '8 seconds through mouth'}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.breathingNote}>
          {language === 'de' ? '4x wiederholen für beste Ergebnisse' : 'Repeat 4 times for best results'}
        </Text>
      </View>
    );
  };

  // ─── Exercise illustration modal ───
  const renderExerciseModal = () => (
    <Modal
      visible={!!exerciseModal}
      transparent
      animationType="fade"
      onRequestClose={() => setExerciseModal(null)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setExerciseModal(null)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalEmoji}>{exerciseModal?.data.emoji}</Text>
          <Text style={styles.modalTitle}>
            {exerciseModal?.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </Text>
          <View style={styles.modalMuscles}>
            <Ionicons name="body" size={16} color={CategoryColors.exercise.primary} />
            <Text style={styles.modalMusclesText}>{exerciseModal?.data.muscles}</Text>
          </View>
          <Text style={styles.modalDesc}>{exerciseModal?.data.description}</Text>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setExerciseModal(null)}
          >
            <Text style={styles.modalCloseText}>{language === 'de' ? 'Schließen' : 'Close'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderExerciseModal()}
      
      {!selectedCategory ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ImageBackground source={{ uri: CategoryImages.meditation }} style={styles.heroImage} imageStyle={styles.heroImageStyle}>
            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle}>Wellness Hub</Text>
              <Text style={styles.heroSubtitle}>
                {language === 'de' ? 'Persönliche Beratung für Ihr Wohlbefinden' : 'Personalized guidance for your wellbeing'}
              </Text>
            </View>
          </ImageBackground>

          {recentSymptoms.length > 0 && (
            <View style={styles.symptomsSection}>
              <Text style={styles.symptomsLabel}>
                {language === 'de' ? 'Ihre letzten Symptome' : 'Your Recent Symptoms'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.symptomTags}>
                  {recentSymptoms.map((symptom, index) => (
                    <View key={index} style={styles.symptomTag}>
                      <Text style={styles.symptomTagText}>{symptom}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <View style={styles.categoriesSection}>
            <Text style={styles.sectionLabel}>
              {language === 'de' ? 'Kategorien entdecken' : 'Explore Categories'}
            </Text>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategorySelect(category.id)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: category.image }} style={styles.categoryImage} />
                <View style={[styles.categoryOverlay, { backgroundColor: category.color.primary + 'E6' }]}>
                  <View style={styles.categoryIconContainer}>
                    <Ionicons name={category.icon as any} size={28} color={Colors.white} />
                  </View>
                  <View style={styles.categoryTextContainer}>
                    <Text style={styles.categoryLabel}>{category.label[language]}</Text>
                    <Text style={styles.categoryDescription}>{category.description[language]}</Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={32} color="rgba(255,255,255,0.8)" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <>
          {/* Category header with image */}
          <View style={[styles.adviceHeader, { backgroundColor: selectedCategoryData?.color.primary }]}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.adviceHeaderContent}>
              <Ionicons name={selectedCategoryData?.icon as any} size={24} color={Colors.white} />
              <Text style={styles.adviceHeaderTitle}>{selectedCategoryData?.label[language]}</Text>
            </View>
            <View style={styles.backButton} />
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.adviceScrollContent} showsVerticalScrollIndicator={false}>
            {/* Hero image for the category */}
            {selectedCategory && categoryHeaderImages[selectedCategory] && (
              <View style={styles.categoryHero}>
                <Image
                  source={{ uri: categoryHeaderImages[selectedCategory] }}
                  style={styles.categoryHeroImage}
                />
                <View style={[styles.categoryHeroOverlay, { backgroundColor: selectedCategoryData?.color.primary + '80' }]}>
                  <Ionicons name={selectedCategoryData?.icon as any} size={40} color={Colors.white} />
                  <Text style={styles.categoryHeroText}>{selectedCategoryData?.label[language]}</Text>
                </View>
              </View>
            )}

            {loading ? (
              <View style={styles.loadingContainer}>
                <View style={[styles.loadingCircle, { borderColor: selectedCategoryData?.color.primary }]}>
                  <ActivityIndicator size="large" color={selectedCategoryData?.color.primary} />
                </View>
                <Text style={styles.loadingText}>
                  {language === 'de' ? 'Erstelle persönliche Beratung...' : 'Creating personalized guidance...'}
                </Text>
                <Text style={styles.loadingSubtext}>
                  {language === 'de'
                    ? `Basierend auf Ihrer ${user?.menopause_phase || 'Menopause'}-Phase`
                    : `Based on your ${user?.menopause_phase || 'menopause'} phase`}
                </Text>
              </View>
            ) : advice ? (
              <View style={styles.adviceContent}>
                {/* Formatted advice FIRST, then breathing visualization */}
                {renderFormattedAdvice(advice)}

                {/* Breathing visualization AFTER the text (change #5) */}
                {renderBreathingExercise()}

                <TouchableOpacity
                  style={[styles.refreshButton, { backgroundColor: selectedCategoryData?.color.primary }]}
                  onPress={() => fetchAdvice(selectedCategory)}
                >
                  <Ionicons name="refresh" size={20} color={Colors.white} />
                  <Text style={styles.refreshButtonText}>
                    {language === 'de' ? 'Neue Beratung' : 'Get Fresh Advice'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.disclaimerCard}>
                  <Ionicons name="information-circle" size={20} color={Colors.textMuted} />
                  <Text style={styles.disclaimerText}>
                    {language === 'de'
                      ? 'Diese Beratung dient nur zu Informationszwecken. Konsultieren Sie immer einen Arzt.'
                      : 'This advice is for informational purposes only. Always consult a healthcare professional.'}
                  </Text>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxl },
  heroImage: { height: 180, justifyContent: 'flex-end' },
  heroImageStyle: { borderBottomLeftRadius: BorderRadius.xl, borderBottomRightRadius: BorderRadius.xl },
  heroOverlay: {
    backgroundColor: 'rgba(124, 107, 156, 0.85)', padding: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl, borderBottomRightRadius: BorderRadius.xl,
  },
  heroTitle: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.white, marginBottom: Spacing.xs },
  heroSubtitle: { fontSize: FontSizes.md, color: 'rgba(255,255,255,0.9)' },
  symptomsSection: { padding: Spacing.md, paddingBottom: 0 },
  symptomsLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textLight, marginBottom: Spacing.sm },
  symptomTags: { flexDirection: 'row', gap: Spacing.sm },
  symptomTag: {
    backgroundColor: Colors.primaryLight + '30', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round, borderWidth: 1, borderColor: Colors.primaryLight,
  },
  symptomTagText: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: '500' },
  categoriesSection: { padding: Spacing.md },
  sectionLabel: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  categoryCard: { height: 100, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, overflow: 'hidden' },
  categoryImage: { width: '100%', height: '100%', position: 'absolute' },
  categoryOverlay: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  categoryIconContainer: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  categoryTextContainer: { flex: 1 },
  categoryLabel: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.white, marginBottom: 2 },
  categoryDescription: { fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.85)' },

  // ─── Advice view ───
  adviceHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  adviceHeaderContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  adviceHeaderTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.white },
  adviceScrollContent: { paddingBottom: Spacing.xxl },

  // Category hero image
  categoryHero: { height: 160, overflow: 'hidden' },
  categoryHeroImage: { width: '100%', height: '100%' },
  categoryHeroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  categoryHeroText: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.white },

  loadingContainer: { padding: Spacing.xxl, alignItems: 'center' },
  loadingCircle: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  loadingText: { fontSize: FontSizes.md, color: Colors.text, fontWeight: '600' },
  loadingSubtext: { fontSize: FontSizes.sm, color: Colors.textLight, marginTop: Spacing.xs },

  adviceContent: { padding: Spacing.md, gap: Spacing.md },
  introText: { fontSize: FontSizes.md, color: Colors.text, lineHeight: 24, marginBottom: Spacing.md },

  // ─── Section cards ───
  adviceSection: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderLeftWidth: 4, overflow: 'hidden', marginBottom: Spacing.sm,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: '700', flex: 1 },
  sectionContent: { padding: Spacing.md, paddingTop: 0 },

  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  bulletDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: Spacing.sm },
  bulletText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textLight, lineHeight: 22 },
  numberedItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  numberCircle: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
  },
  numberText: { fontSize: FontSizes.sm, fontWeight: '700' },
  numberedText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textLight, lineHeight: 22, paddingTop: 4 },
  contentText: { fontSize: FontSizes.sm, color: Colors.textLight, lineHeight: 22, marginBottom: Spacing.sm },

  // ─── Exercise name tap ───
  exerciseName: { fontWeight: '700', textDecorationLine: 'underline' },

  // ─── Video link ───
  videoLink: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 4, paddingVertical: 4,
  },
  videoLinkText: { fontSize: FontSizes.xs, color: '#E53935', fontWeight: '600' },

  // ─── Tai chi link ───
  taiChiLink: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#FFEBEE', padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.sm,
  },
  taiChiLinkText: { flex: 1, fontSize: FontSizes.sm, fontWeight: '600', color: '#E53935' },

  // ─── Quick routines (top of exercise) ───
  quickRoutines: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md,
  },
  quickRoutinesTitle: { fontSize: FontSizes.md, fontWeight: '700', marginBottom: Spacing.md },
  quickRoutineRow: { flexDirection: 'row', gap: Spacing.md },
  quickRoutineBtn: {
    flex: 1, padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', gap: 4,
  },
  quickRoutineEmoji: { fontSize: 28 },
  quickRoutineLabel: { fontSize: FontSizes.sm, fontWeight: '700' },
  quickRoutineDur: { fontSize: FontSizes.xs, color: Colors.textMuted },

  // ─── Weekday plan ───
  weekdaySection: { marginBottom: Spacing.md },
  weekdayTitle: { fontSize: FontSizes.lg, fontWeight: '700', marginBottom: Spacing.md },
  weekdayCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: 'transparent',
  },
  weekdayCardToday: {
    borderWidth: 2, backgroundColor: '#FFFDE7',
  },
  todayBadge: {
    position: 'absolute', top: -1, right: Spacing.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
  },
  todayBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
  weekdayName: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },

  // ─── Breathing ───
  breathingCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.lg,
    marginBottom: Spacing.lg, borderWidth: 2, borderColor: CategoryColors.breathing.light,
  },
  breathingHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  breathingEmoji: { fontSize: 32 },
  breathingTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: CategoryColors.breathing.primary },
  breathingSubtitle: { fontSize: FontSizes.sm, color: Colors.textLight, marginBottom: Spacing.lg },
  breathingSteps: { gap: Spacing.md },
  breathStep: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.md,
  },
  breathCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  breathNumber: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.white },
  breathInfo: { flex: 1 },
  breathAction: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text, letterSpacing: 1 },
  breathDesc: { fontSize: FontSizes.sm, color: Colors.textLight },
  breathingNote: {
    textAlign: 'center', fontSize: FontSizes.sm, color: CategoryColors.breathing.primary,
    fontWeight: '500', marginTop: Spacing.lg,
  },

  // ─── Refresh / Disclaimer ───
  refreshButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.sm, marginTop: Spacing.md,
  },
  refreshButtonText: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.white },
  disclaimerCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.inputBg,
    padding: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.sm, marginTop: Spacing.md,
  },
  disclaimerText: { flex: 1, fontSize: FontSizes.xs, color: Colors.textMuted, lineHeight: 18 },

  // ─── Exercise Modal ───
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.xl,
    alignItems: 'center', width: '100%', maxWidth: 340,
  },
  modalEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  modalMuscles: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: CategoryColors.exercise.light, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, borderRadius: BorderRadius.round, marginBottom: Spacing.md,
  },
  modalMusclesText: { fontSize: FontSizes.sm, fontWeight: '600', color: CategoryColors.exercise.primary },
  modalDesc: {
    fontSize: FontSizes.md, color: Colors.textLight, lineHeight: 24, textAlign: 'center', marginBottom: Spacing.lg,
  },
  modalClose: {
    backgroundColor: CategoryColors.exercise.primary, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
  },
  modalCloseText: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.white },
});
