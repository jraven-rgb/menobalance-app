import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { routineApi } from '../src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius, CategoryColors } from '../src/constants/colors';

const routineTypes = [
  {
    id: 'yoga',
    icon: 'body',
    emoji: '🧘‍♀️',
    label: { en: 'Daily Yoga Flow', de: 'Täglicher Yoga-Flow' },
    subtitle: { en: '20-minute personalized routine', de: '20-Minuten personalisierte Routine' },
    color: '#7E57C2',
    lightColor: '#EDE7F6',
  },
  {
    id: 'pelvic_floor',
    icon: 'bed',
    emoji: '🌅',
    label: { en: 'Morning Pelvic Floor', de: 'Morgen-Beckenboden' },
    subtitle: { en: '5-min exercises in bed', de: '5-Min. Übungen im Bett' },
    color: '#EC407A',
    lightColor: '#FCE4EC',
  },
  {
    id: 'affirmation',
    icon: 'sunny',
    emoji: '✨',
    label: { en: 'Morning Affirmation', de: 'Morgen-Affirmation' },
    subtitle: { en: 'Start your day with positivity', de: 'Starten Sie den Tag positiv' },
    color: '#FF9800',
    lightColor: '#FFF3E0',
  },
  {
    id: 'cortisol_reset',
    icon: 'water',
    emoji: '🌊',
    label: { en: 'Cortisol Reset', de: 'Cortisol-Reset' },
    subtitle: { en: '5-min nervous system grounding', de: '5-Min. Erdung des Nervensystems' },
    color: '#9370DB',
    lightColor: '#F3E5F5',
  },
];

export default function RoutinesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [selectedType, setSelectedType] = useState<string | null>(params.type || null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.type) {
      setSelectedType(params.type);
      fetchRoutine(params.type);
    }
  }, [params.type]);

  const fetchRoutine = async (type: string) => {
    setLoading(true);
    setContent(null);
    try {
      const response = await routineApi.getDailyRoutine(type, language);
      setContent(response.data.content);
    } catch (error) {
      console.error('Error fetching routine:', error);
      setContent(language === 'de'
        ? 'Routine konnte nicht geladen werden. Bitte versuchen Sie es erneut.'
        : 'Unable to load routine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (type: string) => {
    setSelectedType(type);
    fetchRoutine(type);
  };

  const handleBack = () => {
    if (selectedType) {
      setSelectedType(null);
      setContent(null);
    } else {
      router.back();
    }
  };

  const selectedRoutine = routineTypes.find(r => r.id === selectedType);

  const renderFormattedContent = (text: string) => {
    const color = selectedRoutine?.color || '#7E57C2';
    const lightColor = selectedRoutine?.lightColor || '#EDE7F6';
    const sections: JSX.Element[] = [];
    let key = 0;

    const lines = text.split('\n');
    let currentSection: { title: string; content: string[] } | null = null;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('##') || (trimmed.startsWith('**') && trimmed.endsWith('**'))) {
        if (currentSection) {
          sections.push(renderSection(currentSection, key++, color, lightColor));
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
      sections.push(renderSection(currentSection, key++, color, lightColor));
    }

    return sections;
  };

  const renderSection = (section: { title: string; content: string[] }, key: number, color: string, lightColor: string) => {
    return (
      <View key={key} style={[styles.section, { borderLeftColor: color }]}>
        <View style={[styles.sectionHeader, { backgroundColor: lightColor }]}>
          <Text style={[styles.sectionTitle, { color }]}>{section.title}</Text>
        </View>
        <View style={styles.sectionContent}>
          {section.content.map((line, idx) => renderLine(line, idx, color))}
        </View>
      </View>
    );
  };

  const renderLine = (line: string, key: number, color: string) => {
    const clean = line.replace(/\*\*/g, '');
    
    if (clean.startsWith('-') || clean.startsWith('•') || clean.startsWith('*')) {
      const text = clean.replace(/^[-•*]\s*/, '');
      return (
        <View key={key} style={styles.bulletItem}>
          <View style={[styles.bulletDot, { backgroundColor: color }]} />
          <Text style={styles.bulletText}>{text}</Text>
        </View>
      );
    }
    
    if (/^\d+\./.test(clean)) {
      const num = clean.match(/^(\d+)\./)?.[1];
      const text = clean.replace(/^\d+\.\s*/, '');
      return (
        <View key={key} style={styles.numberedItem}>
          <View style={[styles.numCircle, { backgroundColor: color }]}>
            <Text style={styles.numText}>{num}</Text>
          </View>
          <Text style={styles.numberedText}>{text}</Text>
        </View>
      );
    }
    
    return <Text key={key} style={styles.contentText}>{clean}</Text>;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, selectedRoutine && { backgroundColor: selectedRoutine.color }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedRoutine 
            ? selectedRoutine.label[language]
            : (language === 'de' ? 'Tägliche Routinen' : 'Daily Routines')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!selectedType ? (
          <>
            {/* Intro */}
            <View style={styles.introCard}>
              <Text style={styles.introEmoji}>🌿</Text>
              <Text style={styles.introTitle}>
                {language === 'de' ? 'Ihre tägliche Wellness-Routine' : 'Your Daily Wellness Routine'}
              </Text>
              <Text style={styles.introSubtitle}>
                {language === 'de'
                  ? 'Personalisiert auf Ihre Phase und Symptome'
                  : 'Personalized to your phase and symptoms'}
              </Text>
            </View>

            {/* Routine Cards */}
            {routineTypes.map((routine) => (
              <TouchableOpacity
                key={routine.id}
                style={[styles.routineCard, { borderLeftColor: routine.color }]}
                onPress={() => handleSelect(routine.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.routineIconWrap, { backgroundColor: routine.lightColor }]}>
                  <Text style={styles.routineEmoji}>{routine.emoji}</Text>
                </View>
                <View style={styles.routineInfo}>
                  <Text style={styles.routineLabel}>{routine.label[language]}</Text>
                  <Text style={styles.routineSubtitle}>{routine.subtitle[language]}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={routine.color} />
              </TouchableOpacity>
            ))}

            {/* Tip */}
            <View style={styles.tipCard}>
              <Ionicons name="heart" size={20} color={Colors.accent} />
              <Text style={styles.tipText}>
                {language === 'de'
                  ? 'Regelmäßigkeit ist wichtiger als Intensität. Schon 5 Minuten täglich machen einen Unterschied.'
                  : 'Consistency matters more than intensity. Even 5 minutes daily makes a difference.'}
              </Text>
            </View>
          </>
        ) : (
          <>
            {loading ? (
              <View style={styles.loadingWrap}>
                <View style={[styles.loadingCircle, { borderColor: selectedRoutine?.color }]}>
                  <ActivityIndicator size="large" color={selectedRoutine?.color} />
                </View>
                <Text style={styles.loadingText}>
                  {language === 'de' ? 'Erstelle Ihre Routine...' : 'Creating your routine...'}
                </Text>
              </View>
            ) : content ? (
              <>
                {renderFormattedContent(content)}
                
                <TouchableOpacity
                  style={[styles.refreshBtn, { backgroundColor: selectedRoutine?.color }]}
                  onPress={() => fetchRoutine(selectedType)}
                >
                  <Ionicons name="refresh" size={20} color={Colors.white} />
                  <Text style={styles.refreshText}>
                    {language === 'de' ? 'Neue Routine generieren' : 'Generate New Routine'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.disclaimerCard}>
                  <Ionicons name="information-circle" size={18} color={Colors.textMuted} />
                  <Text style={styles.disclaimerText}>
                    {language === 'de'
                      ? 'Hören Sie auf Ihren Körper. Bei Schmerzen oder Unbehagen brechen Sie die Übung ab.'
                      : 'Listen to your body. Stop any exercise if you feel pain or discomfort.'}
                  </Text>
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primary,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.white },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  introCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  introEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  introTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  introSubtitle: { fontSize: FontSizes.sm, color: Colors.textLight, marginTop: Spacing.xs, textAlign: 'center' },
  routineCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
  },
  routineIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  routineEmoji: { fontSize: 28 },
  routineInfo: { flex: 1 },
  routineLabel: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
  routineSubtitle: { fontSize: FontSizes.sm, color: Colors.textLight, marginTop: 2 },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.accentLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  tipText: { flex: 1, fontSize: FontSizes.sm, color: Colors.text, lineHeight: 20 },
  loadingWrap: { padding: Spacing.xxl, alignItems: 'center' },
  loadingCircle: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  loadingText: { fontSize: FontSizes.md, color: Colors.text, fontWeight: '600' },
  introText: { fontSize: FontSizes.md, color: Colors.text, lineHeight: 24, marginBottom: Spacing.md },
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  sectionHeader: { padding: Spacing.md },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: '700' },
  sectionContent: { padding: Spacing.md, paddingTop: 0 },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  bulletDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: Spacing.sm },
  bulletText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textLight, lineHeight: 22 },
  numberedItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  numCircle: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
  },
  numText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.white },
  numberedText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textLight, lineHeight: 22, paddingTop: 3 },
  contentText: { fontSize: FontSizes.sm, color: Colors.textLight, lineHeight: 22, marginBottom: Spacing.sm },
  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.sm, marginTop: Spacing.md,
  },
  refreshText: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.white },
  disclaimerCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.inputBg, padding: Spacing.md,
    borderRadius: BorderRadius.md, gap: Spacing.sm, marginTop: Spacing.md,
  },
  disclaimerText: { flex: 1, fontSize: FontSizes.xs, color: Colors.textMuted, lineHeight: 18 },
});
