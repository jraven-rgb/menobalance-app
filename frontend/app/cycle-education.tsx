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
import { useRouter } from 'expo-router';
import { useLanguage } from '../src/contexts/LanguageContext';
import { infoApi } from '../src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius } from '../src/constants/colors';

const phaseColors: Record<string, { primary: string; light: string; emoji: string }> = {
  menstrual: { primary: '#E53935', light: '#FFEBEE', emoji: '🌙' },
  follicular: { primary: '#43A047', light: '#E8F5E9', emoji: '🌱' },
  ovulation: { primary: '#FF9800', light: '#FFF3E0', emoji: '☀️' },
  luteal: { primary: '#7E57C2', light: '#EDE7F6', emoji: '🍂' },
};

export default function CycleEducationScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [phases, setPhases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  useEffect(() => {
    fetchPhases();
  }, [language]);

  const fetchPhases = async () => {
    try {
      const response = await infoApi.getCyclePhases(language);
      setPhases(response.data.phases || []);
    } catch (error) {
      console.error('Error fetching phases:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePhase = (phase: string) => {
    setExpandedPhase(expandedPhase === phase ? null : phase);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'de' ? 'Ihren Zyklus verstehen' : 'Understanding Your Cycle'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Intro */}
        <View style={styles.introCard}>
          <Text style={styles.introEmoji}>🔄</Text>
          <Text style={styles.introTitle}>
            {language === 'de' ? 'Die 4 Phasen Ihres Zyklus' : 'The 4 Phases of Your Cycle'}
          </Text>
          <Text style={styles.introText}>
            {language === 'de'
              ? 'Jede Phase beeinflusst Ihren Körper, Geist, Energie und Stresstoleranz auf unterschiedliche Weise. Wenn Sie Ihren Zyklus verstehen, können Sie Ihr Leben besser planen und sich selbst mehr Mitgefühl entgegenbringen.'
              : 'Each phase affects your body, mind, energy, and stress tolerance in different ways. Understanding your cycle helps you plan your life better and show yourself more compassion.'}
          </Text>
        </View>

        {/* Timeline Visual */}
        <View style={styles.timelineRow}>
          {Object.entries(phaseColors).map(([key, val]) => (
            <View key={key} style={[styles.timelineDot, { backgroundColor: val.primary }]}>
              <Text style={styles.timelineEmoji}>{val.emoji}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ padding: Spacing.xxl }} />
        ) : (
          phases.map((phase) => {
            const colors = phaseColors[phase.phase] || phaseColors.menstrual;
            const isExpanded = expandedPhase === phase.phase;
            return (
              <TouchableOpacity
                key={phase.phase}
                style={[styles.phaseCard, { borderLeftColor: colors.primary }]}
                onPress={() => togglePhase(phase.phase)}
                activeOpacity={0.8}
              >
                {/* Phase Header */}
                <View style={styles.phaseHeader}>
                  <View style={[styles.phaseIcon, { backgroundColor: colors.light }]}>
                    <Text style={styles.phaseIconEmoji}>{colors.emoji}</Text>
                  </View>
                  <View style={styles.phaseHeaderInfo}>
                    <Text style={[styles.phaseName, { color: colors.primary }]}>{phase.name}</Text>
                    <Text style={styles.phaseDays}>{phase.days}</Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={colors.primary}
                  />
                </View>

                {/* Phase Description */}
                <Text style={styles.phaseDesc}>{phase.description}</Text>

                {/* Expanded Content */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {/* Body */}
                    <View style={[styles.aspectCard, { backgroundColor: colors.light }]}>
                      <View style={styles.aspectHeader}>
                        <Ionicons name="body" size={20} color={colors.primary} />
                        <Text style={[styles.aspectTitle, { color: colors.primary }]}>
                          {language === 'de' ? 'Körper' : 'Body'}
                        </Text>
                      </View>
                      <Text style={styles.aspectText}>{phase.body}</Text>
                    </View>

                    {/* Mind */}
                    <View style={[styles.aspectCard, { backgroundColor: colors.light }]}>
                      <View style={styles.aspectHeader}>
                        <Ionicons name="bulb" size={20} color={colors.primary} />
                        <Text style={[styles.aspectTitle, { color: colors.primary }]}>
                          {language === 'de' ? 'Geist' : 'Mind'}
                        </Text>
                      </View>
                      <Text style={styles.aspectText}>{phase.mind}</Text>
                    </View>

                    {/* Energy */}
                    <View style={[styles.aspectCard, { backgroundColor: colors.light }]}>
                      <View style={styles.aspectHeader}>
                        <Ionicons name="flash" size={20} color={colors.primary} />
                        <Text style={[styles.aspectTitle, { color: colors.primary }]}>
                          {language === 'de' ? 'Energie' : 'Energy'}
                        </Text>
                      </View>
                      <Text style={styles.aspectText}>{phase.energy}</Text>
                    </View>

                    {/* Stress Tolerance */}
                    <View style={[styles.aspectCard, { backgroundColor: colors.light }]}>
                      <View style={styles.aspectHeader}>
                        <Ionicons name="heart" size={20} color={colors.primary} />
                        <Text style={[styles.aspectTitle, { color: colors.primary }]}>
                          {language === 'de' ? 'Stresstoleranz' : 'Stress Tolerance'}
                        </Text>
                      </View>
                      <Text style={styles.aspectText}>{phase.stress_resilience}</Text>
                    </View>

                    {/* Tips */}
                    <View style={styles.tipsSection}>
                      <Text style={[styles.tipsTitle, { color: colors.primary }]}>
                        {language === 'de' ? 'Tipps für diese Phase' : 'Tips for This Phase'}
                      </Text>
                      {phase.tips?.map((tip: string, idx: number) => (
                        <View key={idx} style={styles.tipRow}>
                          <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
                          <Text style={styles.tipText}>{tip}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        {/* Partner Note */}
        <View style={styles.partnerNote}>
          <Ionicons name="heart" size={20} color="#EC407A" />
          <Text style={styles.partnerNoteText}>
            {language === 'de'
              ? 'Tipp: Teilen Sie diese Informationen mit Ihrem Partner, damit er besser verstehen kann, was Sie durchmachen.'
              : 'Tip: Share this information with your partner so they can better understand what you\'re going through.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, backgroundColor: '#7E57C2',
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.white },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  introCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.xl,
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  introEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  introTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  introText: { fontSize: FontSizes.sm, color: Colors.textLight, textAlign: 'center', lineHeight: 22 },
  timelineRow: {
    flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  timelineDot: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
  },
  timelineEmoji: { fontSize: 22 },
  phaseCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderLeftWidth: 4,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  phaseHeader: { flexDirection: 'row', alignItems: 'center' },
  phaseIcon: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  phaseIconEmoji: { fontSize: 24 },
  phaseHeaderInfo: { flex: 1 },
  phaseName: { fontSize: FontSizes.md, fontWeight: '700' },
  phaseDays: { fontSize: FontSizes.xs, color: Colors.textMuted },
  phaseDesc: { fontSize: FontSizes.sm, color: Colors.textLight, lineHeight: 22, marginTop: Spacing.sm },
  expandedContent: { marginTop: Spacing.md, gap: Spacing.sm },
  aspectCard: { borderRadius: BorderRadius.md, padding: Spacing.md },
  aspectHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  aspectTitle: { fontSize: FontSizes.sm, fontWeight: '700' },
  aspectText: { fontSize: FontSizes.sm, color: Colors.textLight, lineHeight: 22 },
  tipsSection: { marginTop: Spacing.sm },
  tipsTitle: { fontSize: FontSizes.sm, fontWeight: '700', marginBottom: Spacing.sm },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginRight: Spacing.sm },
  tipText: { fontSize: FontSizes.sm, color: Colors.textLight },
  partnerNote: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FCE4EC',
    padding: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.sm, marginTop: Spacing.sm,
  },
  partnerNoteText: { flex: 1, fontSize: FontSizes.sm, color: '#C62828', lineHeight: 20 },
});
