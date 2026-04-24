import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { reportApi } from '../src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius } from '../src/constants/colors';

export default function HealthReportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);


  const [timeframe, setTimeframe] = useState('30d');
  
  useEffect(() => {
    fetchReport();
  }, [timeframe]);


  const fetchReport = async () => {
    setLoading(true);
    try {
      let startDateStr = '';
      const d = new Date();
      if (timeframe === '30d') d.setDate(d.getDate() - 30);
      if (timeframe === '3m') d.setMonth(d.getMonth() - 3);
      if (timeframe === '6m') d.setMonth(d.getMonth() - 6);
      if (timeframe === 'all') d.setFullYear(2020);
      startDateStr = d.toISOString().split('T')[0];
      
      const response = await reportApi.getHealthReport(startDateStr);
      setReport(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!report) return;
    try {
      const topSymptoms = report.top_symptoms
        ?.map((s: any) => `${s.name}: ${s.frequency}x (avg severity: ${s.avg_severity}/5)`)
        .join('\n') || 'No symptoms logged';
      
      const text = `MenoWellness Health Report\n` +
        `========================\n\n` +
        `Patient: ${report.patient_name}\n` +
        `Phase: ${report.menopause_phase}\n` +
        `${report.age ? 'Age: ' + report.age : ''}\n` +
        `Period: ${report.report_period?.start} to ${report.report_period?.end}\n\n` +
        `TRACKING SUMMARY\n` +
        `Days tracked: ${report.total_days_tracked}\n` +
        `Check-ins: ${report.total_checkins}\n\n` +
        `AVERAGES (1-5 scale)\n` +
        `Mood: ${report.averages?.mood}/5\n` +
        `Energy: ${report.averages?.energy}/5\n` +
        `Sleep: ${report.averages?.sleep_quality}/5\n\n` +
        `TOP SYMPTOMS\n${topSymptoms}\n\n` +
        `PERIOD TRACKING\n` +
        `Days with period: ${report.period_tracking?.days_with_period || 0}\n\n` +
        `---\n` +
        `${report.disclaimer}\n` +
        `Generated: ${new Date(report.generated_at).toLocaleDateString()}`;

      await Share.share({
        message: text,
        title: 'MenoWellness Health Report',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const getSeverityLabel = (val: number) => {
    if (val <= 1.5) return { text: language === 'de' ? 'Mild' : 'Mild', color: '#4CAF50' };
    if (val <= 2.5) return { text: language === 'de' ? 'Leicht' : 'Low', color: '#8BC34A' };
    if (val <= 3.5) return { text: language === 'de' ? 'Mittel' : 'Moderate', color: '#FF9800' };
    if (val <= 4.5) return { text: language === 'de' ? 'Schwer' : 'Severe', color: '#F44336' };
    return { text: language === 'de' ? 'Sehr schwer' : 'Very Severe', color: '#B71C1C' };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'de' ? 'Gesundheitsbericht' : 'Health Report'}
        </Text>
        {report ? (
          <TouchableOpacity onPress={handleShare} style={styles.backBtn}>
            <Ionicons name="share-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        ) : <View style={styles.backBtn} />}
      </View>


      <View style={styles.filterRow}>
        {[
          { id: '30d', label: language === 'de' ? '30 Tage' : '30 Days' },
          { id: '3m', label: language === 'de' ? '3 Monate' : '3 Months' },
          { id: '6m', label: language === 'de' ? '6 Monate' : '6 Months' },
          { id: 'all', label: language === 'de' ? 'Alle' : 'All Time' }
        ].map(tb => (
          <TouchableOpacity 
            key={tb.id} 
            style={[styles.filterBtn, timeframe === tb.id && styles.filterBtnActive]}
            onPress={() => setTimeframe(tb.id)}
          >
            <Text style={[styles.filterText, timeframe === tb.id && styles.filterTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              {language === 'de' ? 'Erstelle Bericht...' : 'Generating report...'}
            </Text>
          </View>
        ) : report ? (
          <>
            {/* Report Header */}
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>MenoWellness</Text>
              <Text style={styles.reportSubtitle}>
                {language === 'de' ? 'Gesundheitsbericht' : 'Health Report'}
              </Text>
              <View style={styles.reportMeta}>
                <Text style={styles.metaText}>{report.patient_name}</Text>
                <Text style={styles.metaText}>
                  {language === 'de' ? 'Phase' : 'Phase'}: {report.menopause_phase}
                </Text>
                {report.age && <Text style={styles.metaText}>
                  {language === 'de' ? 'Alter' : 'Age'}: {report.age}
                </Text>}
                <Text style={styles.metaText}>
                  {report.report_period?.start} — {report.report_period?.end}
                </Text>
              </View>
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryNum}>{report.total_days_tracked}</Text>
                <Text style={styles.summaryLabel}>
                  {language === 'de' ? 'Tage' : 'Days'}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryNum}>{report.total_checkins}</Text>
                <Text style={styles.summaryLabel}>Check-ins</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryNum}>{report.top_symptoms?.length || 0}</Text>
                <Text style={styles.summaryLabel}>
                  {language === 'de' ? 'Symptome' : 'Symptoms'}
                </Text>
              </View>
            </View>

            {/* Averages */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {language === 'de' ? 'Durchschnittswerte' : 'Averages'} (1-5)
              </Text>
              {[
                { label: language === 'de' ? 'Stimmung' : 'Mood', val: report.averages?.mood, icon: 'happy', color: '#FF9800' },
                { label: language === 'de' ? 'Energie' : 'Energy', val: report.averages?.energy, icon: 'flash', color: '#4CAF50' },
                { label: language === 'de' ? 'Schlaf' : 'Sleep', val: report.averages?.sleep_quality, icon: 'moon', color: '#5C6BC0' },
              ].map((item) => (
                <View key={item.label} style={styles.avgRow}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                  <Text style={styles.avgLabel}>{item.label}</Text>
                  <View style={styles.avgBarBg}>
                    <View style={[styles.avgBarFill, { width: `${(item.val / 5) * 100}%`, backgroundColor: item.color }]} />
                  </View>
                  <Text style={styles.avgVal}>{item.val}</Text>
                </View>
              ))}
            </View>

            {/* Top Symptoms */}
            {report.top_symptoms && report.top_symptoms.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  {language === 'de' ? 'Häufigste Symptome' : 'Top Symptoms'}
                </Text>
                {report.top_symptoms.map((s: any, idx: number) => {
                  const severity = getSeverityLabel(s.avg_severity);
                  return (
                    <View key={idx} style={styles.symptomRow}>
                      <View style={styles.symptomInfo}>
                        <Text style={styles.symptomName}>{s.name}</Text>
                        <Text style={styles.symptomFreq}>
                          {s.frequency}x {language === 'de' ? 'protokolliert' : 'logged'}
                        </Text>
                      </View>
                      <View style={[styles.severityBadge, { backgroundColor: severity.color + '20' }]}>
                        <Text style={[styles.severityText, { color: severity.color }]}>{severity.text}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Period Tracking */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {language === 'de' ? 'Periodentracking' : 'Period Tracking'}
              </Text>
              <Text style={styles.periodText}>
                {language === 'de' ? 'Tage mit Periode' : 'Days with period'}: {report.period_tracking?.days_with_period || 0}
              </Text>
              {report.period_tracking?.period_dates?.length > 0 && (
                <View style={styles.periodDates}>
                  {report.period_tracking.period_dates.map((date: string, idx: number) => (
                    <View key={idx} style={styles.dateBadge}>
                      <Text style={styles.dateText}>{date}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Share Button */}
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Ionicons name="print" size={20} color={Colors.white} />
              <Text style={styles.shareText}>
                {language === 'de' ? 'Bericht teilen / drucken' : 'Share / Print Report'}
              </Text>
            </TouchableOpacity>

            {/* Disclaimer */}
            <View style={styles.disclaimerCard}>
              <Ionicons name="information-circle" size={18} color={Colors.textMuted} />
              <Text style={styles.disclaimerText}>{report.disclaimer}</Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {language === 'de'
                ? 'Kein Bericht verfügbar. Bitte tracken Sie zuerst Symptome.'
                : 'No report available. Please track symptoms first.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, backgroundColor: '#5C6BC0',
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.white },
  scroll: { flex: 1 },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: Colors.background },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20, backgroundColor: Colors.inputBg },
  filterBtnActive: { backgroundColor: '#5C6BC0' },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textLight },
  filterTextActive: { color: Colors.white },

  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  loadingWrap: { padding: Spacing.xxl, alignItems: 'center' },
  loadingText: { fontSize: FontSizes.md, color: Colors.text, marginTop: Spacing.md },
  reportHeader: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.xl,
    alignItems: 'center', marginBottom: Spacing.md, borderTopWidth: 4, borderTopColor: '#5C6BC0',
  },
  reportTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.primary },
  reportSubtitle: { fontSize: FontSizes.md, color: Colors.textLight, marginBottom: Spacing.md },
  reportMeta: { alignItems: 'center' },
  metaText: { fontSize: FontSizes.sm, color: Colors.textLight, marginBottom: 2 },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  summaryCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center',
  },
  summaryNum: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.primary },
  summaryLabel: { fontSize: FontSizes.xs, color: Colors.textLight, marginTop: 2 },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md,
  },
  cardTitle: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  avgRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
  avgLabel: { fontSize: FontSizes.sm, color: Colors.textLight, width: 60 },
  avgBarBg: {
    flex: 1, height: 8, backgroundColor: Colors.inputBg, borderRadius: 4, overflow: 'hidden',
  },
  avgBarFill: { height: '100%', borderRadius: 4 },
  avgVal: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.text, width: 30, textAlign: 'right' },
  symptomRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  symptomInfo: { flex: 1 },
  symptomName: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text },
  symptomFreq: { fontSize: FontSizes.xs, color: Colors.textMuted },
  severityBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.round },
  severityText: { fontSize: FontSizes.xs, fontWeight: '600' },
  periodText: { fontSize: FontSizes.sm, color: Colors.textLight, marginBottom: Spacing.sm },
  periodDates: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  dateBadge: {
    backgroundColor: '#FCE4EC', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.round,
  },
  dateText: { fontSize: FontSizes.xs, color: '#EC407A', fontWeight: '500' },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#5C6BC0', padding: Spacing.md, borderRadius: BorderRadius.md,
    gap: Spacing.sm, marginTop: Spacing.sm,
  },
  shareText: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.white },
  disclaimerCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.inputBg,
    padding: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.sm, marginTop: Spacing.md,
  },
  disclaimerText: { flex: 1, fontSize: FontSizes.xs, color: Colors.textMuted, lineHeight: 18 },
  emptyState: { alignItems: 'center', padding: Spacing.xxl },
  emptyText: { fontSize: FontSizes.md, color: Colors.textMuted, marginTop: Spacing.md, textAlign: 'center' },
});
