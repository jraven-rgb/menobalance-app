import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { routineApi } from '../src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius } from '../src/constants/colors';

export default function PartnerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [tips, setTips] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<string>('');

  const [partnerEmail, setPartnerEmail] = useState('');
  const [frequency, setFrequency] = useState('manual');
  const frequencies = [
    { id: 'manual', label: language === 'de' ? 'Nur Manuell' : 'Manual Only' },
    { id: 'daily', label: language === 'de' ? 'Täglich' : 'Daily' },
    { id: 'weekly', label: language === 'de' ? 'Wöchentlich' : 'Weekly' },
    { id: 'by_phase', label: language === 'de' ? 'Phasenwechsel' : 'Phase Change' },
    { id: 'period_start', label: language === 'de' ? 'Periodenstart' : 'Period Start' }
  ];


  const fetchPartnerTips = async () => {
    setLoading(true);
    setTips(null);
    try {
      const response = await routineApi.getPartnerTips(language);
      setTips(response.data.tips);
      setPhase(response.data.phase || '');
    } catch (error) {
      console.error('Error fetching partner tips:', error);
      setTips(language === 'de'
        ? 'Tipps konnten nicht geladen werden. Bitte versuchen Sie es erneut.'
        : 'Unable to load tips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!tips) return;
    try {
      const shareText = language === 'de'
        ? `MenoWellness - Partner-Tipps\n\nPhase: ${phase}\n\n${tips.replace(/\*\*/g, '').replace(/#{1,3}\s/g, '')}`
        : `MenoWellness - Partner Tips\n\nPhase: ${phase}\n\n${tips.replace(/\*\*/g, '').replace(/#{1,3}\s/g, '')}`;
      
      await Share.share({
        message: shareText,
        title: 'MenoWellness Partner Tips',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const renderContent = (text: string) => {
    const sections: JSX.Element[] = [];
    let key = 0;
    const lines = text.split('\n');
    let currentSection: { title: string; content: string[] } | null = null;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('##') || (trimmed.startsWith('**') && trimmed.endsWith('**'))) {
        if (currentSection) {
          sections.push(renderSection(currentSection, key++));
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
      sections.push(renderSection(currentSection, key++));
    }
    return sections;
  };

  const renderSection = (section: { title: string; content: string[] }, key: number) => {
    return (
      <View key={key} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        <View style={styles.sectionBody}>
          {section.content.map((line, idx) => {
            const clean = line.replace(/\*\*/g, '');
            if (clean.startsWith('-') || clean.startsWith('•')) {
              return (
                <View key={idx} style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{clean.replace(/^[-•*]\s*/, '')}</Text>
                </View>
              );
            }
            if (/^\d+\./.test(clean)) {
              const num = clean.match(/^(\d+)\./)?.[1];
              return (
                <View key={idx} style={styles.numberedItem}>
                  <View style={styles.numCircle}>
                    <Text style={styles.numText}>{num}</Text>
                  </View>
                  <Text style={styles.numberedText}>{clean.replace(/^\d+\.\s*/, '')}</Text>
                </View>
              );
            }
            return <Text key={idx} style={styles.bodyText}>{clean}</Text>;
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'de' ? 'Partner-Unterstützung' : 'Partner Support'}
        </Text>
        {tips ? (
          <TouchableOpacity onPress={handleShare} style={styles.backBtn}>
            <Ionicons name="share-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        ) : <View style={styles.backBtn} />}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {!tips && !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💕</Text>
            <Text style={styles.emptyTitle}>
              {language === 'de' ? 'Partner-Modus' : 'Partner Mode'}
            </Text>
            <Text style={styles.emptyDesc}>
              {language === 'de'
                ? 'Erstellen Sie personalisierte Tipps für Ihren Partner, damit er versteht, was Sie durchmachen und wie er Sie unterstützen kann.'
                : 'Generate personalized tips for your partner so they understand what you\'re going through and how they can support you.'}
            </Text>
            <Text style={styles.emptyPhase}>
              {language === 'de' ? 'Ihre Phase: ' : 'Your phase: '}
              <Text style={styles.phaseHighlight}>{user?.menopause_phase || 'Menopause'}</Text>
            </Text>
            <TouchableOpacity style={styles.generateBtn} onPress={fetchPartnerTips}>
              <Ionicons name="heart" size={20} color={Colors.white} />
              <Text style={styles.generateText}>
                {language === 'de' ? 'Tipps generieren' : 'Generate Tips'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.shareHint}>
              {language === 'de'
                ? 'Sie können die Tipps direkt an Ihren Partner teilen'
                : 'You can share the tips directly with your partner'}
            </Text>
          
            <View style={styles.settingsCard}>
              <Text style={styles.settingsTitle}>
                {language === 'de' ? 'Automatisches Senden' : 'Automated Sending'}
              </Text>
              
              <Text style={styles.settingsLabel}>
                {language === 'de' ? 'Häufigkeit der Updates:' : 'Update Frequency:'}
              </Text>
              <View style={styles.freqGrid}>
                {frequencies.map(f => (
                  <TouchableOpacity 
                    key={f.id} 
                    style={[styles.freqBtn, frequency === f.id && styles.freqBtnActive]}
                    onPress={() => setFrequency(f.id)}
                  >
                    <Text style={[styles.freqText, frequency === f.id && styles.freqTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {frequency !== 'manual' && (
                <Text style={styles.freqExplanation}>
                  {language === 'de' 
                    ? 'Der Partner-Tipp wird im Hintergrund automatisch am gewählten Zeitpunkt per E-Mail versendet!'
                    : 'Tips will automatically generate and send to the partner in the background based on schedule!'}
                </Text>
              )}
            </View>

          </View>
        ) : loading ? (
          <View style={styles.loadingWrap}>
            <View style={styles.loadingCircle}>
              <ActivityIndicator size="large" color="#EC407A" />
            </View>
            <Text style={styles.loadingText}>
              {language === 'de' ? 'Erstelle Partner-Tipps...' : 'Creating partner tips...'}
            </Text>
          </View>
        ) : tips ? (
          <>
            {renderContent(tips)}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#EC407A' }]}
                onPress={handleShare}
              >
                <Ionicons name="share-social" size={20} color={Colors.white} />
                <Text style={styles.actionText}>
                  {language === 'de' ? 'An Partner teilen' : 'Share with Partner'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
                onPress={fetchPartnerTips}
              >
                <Ionicons name="refresh" size={20} color={Colors.white} />
                <Text style={styles.actionText}>
                  {language === 'de' ? 'Neu generieren' : 'Regenerate'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, backgroundColor: '#EC407A',
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.white },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  emptyState: { alignItems: 'center', padding: Spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptyDesc: {
    fontSize: FontSizes.md, color: Colors.textLight, textAlign: 'center',
    lineHeight: 24, marginBottom: Spacing.lg, paddingHorizontal: Spacing.md,
  },
  emptyPhase: { fontSize: FontSizes.md, color: Colors.textLight, marginBottom: Spacing.xl },
  phaseHighlight: { fontWeight: '700', color: '#EC407A' },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EC407A',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.sm,
  },
  generateText: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.white },

  settingsCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginTop: 32, width: '100%', borderWidth: 1, borderColor: '#E5E7EB' },
  settingsTitle: { fontSize: 18, fontWeight: '700', color: '#232D3F', marginBottom: 8 },
  settingsLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginTop: 12, marginBottom: 8 },
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  freqBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginBottom: 8, marginRight: 8 },
  freqBtnActive: { backgroundColor: '#EC407A' },
  freqText: { fontSize: 14, color: '#6B7280' },
  freqTextActive: { color: '#FFFFFF', fontWeight: '600' },
  freqExplanation: { fontSize: 13, color: '#EC407A', marginTop: 16, fontStyle: 'italic' },

  shareHint: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: Spacing.md, textAlign: 'center' },
  loadingWrap: { padding: Spacing.xxl, alignItems: 'center' },
  loadingCircle: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#EC407A',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  loadingText: { fontSize: FontSizes.md, color: Colors.text, fontWeight: '600' },
  introText: { fontSize: FontSizes.md, color: Colors.text, lineHeight: 24, marginBottom: Spacing.md },
  section: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderLeftWidth: 4, borderLeftColor: '#EC407A', overflow: 'hidden', marginBottom: Spacing.md,
  },
  sectionHeader: { backgroundColor: '#FCE4EC', padding: Spacing.md },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: '700', color: '#EC407A' },
  sectionBody: { padding: Spacing.md },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  bulletDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#EC407A', marginTop: 6, marginRight: Spacing.sm,
  },
  bulletText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textLight, lineHeight: 22 },
  numberedItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  numCircle: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#EC407A',
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
  },
  numText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.white },
  numberedText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textLight, lineHeight: 22, paddingTop: 3 },
  bodyText: { fontSize: FontSizes.sm, color: Colors.textLight, lineHeight: 22, marginBottom: Spacing.sm },
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.sm,
  },
  actionText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.white },
});
