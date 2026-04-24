import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../src/contexts/LanguageContext';
import { Colors, FontSizes, Spacing, BorderRadius } from '../src/constants/colors';

const features = [
  { icon: 'sparkles', en: 'AI-powered personalized advice', de: 'KI-gestützte personalisierte Beratung' },
  { icon: 'body', en: 'Daily yoga & pelvic floor routines', de: 'Tägliche Yoga- & Beckenboden-Routinen' },
  { icon: 'sunny', en: 'Personalized morning affirmations', de: 'Personalisierte Morgen-Affirmationen' },
  { icon: 'heart', en: 'Partner support & sharing', de: 'Partner-Unterstützung & Teilen' },
  { icon: 'document-text', en: 'Health reports for doctor visits', de: 'Gesundheitsberichte für Arztbesuche' },
  { icon: 'clipboard', en: 'Unlimited symptom tracking', de: 'Unbegrenztes Symptom-Tracking' },
  { icon: 'search', en: 'Find specialists near you', de: 'Fachärzte in Ihrer Nähe finden' },
  { icon: 'language', en: 'Full bilingual support (EN/DE)', de: 'Volle zweisprachige Unterstützung (EN/DE)' },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  const handleSubscribe = () => {
    Alert.alert(
      language === 'de' ? 'Abonnement' : 'Subscription',
      language === 'de'
        ? 'Die Zahlungsintegration wird in Kürze verfügbar sein. Derzeit haben Sie vollen Zugang zu allen Funktionen während der kostenlosen Testphase.'
        : 'Payment integration will be available soon. Currently, you have full access to all features during the free trial period.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.logo}>MenoWellness</Text>
          <Text style={styles.premiumBadge}>Premium</Text>
          <Text style={styles.headline}>
            {language === 'de'
              ? 'Investieren Sie in Ihre Gesundheit'
              : 'Invest in Your Health'}
          </Text>
          <Text style={styles.subtitle}>
            {language === 'de'
              ? 'Personalisierte Unterstützung auf Ihrem Menopause-Weg'
              : 'Personalized support for your menopause journey'}
          </Text>
        </View>

        {/* Free Trial Banner */}
        <View style={styles.trialBanner}>
          <Ionicons name="gift" size={24} color="#FF9800" />
          <View style={styles.trialInfo}>
            <Text style={styles.trialTitle}>
              {language === 'de' ? '30 Tage kostenlos testen' : '30-Day Free Trial'}
            </Text>
            <Text style={styles.trialText}>
              {language === 'de'
                ? 'Voller Zugang zu allen Funktionen. Jederzeit kündbar.'
                : 'Full access to all features. Cancel anytime.'}
            </Text>
          </View>
        </View>

        {/* Plan Cards */}
        <View style={styles.planSection}>
          {/* Annual Plan */}
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'annual' && styles.planCardActive]}
            onPress={() => setSelectedPlan('annual')}
          >
            <View style={styles.planHeader}>
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>
                  {language === 'de' ? 'SPARE 37%' : 'SAVE 37%'}
                </Text>
              </View>
              <View style={[styles.radioOuter, selectedPlan === 'annual' && styles.radioOuterActive]}>
                {selectedPlan === 'annual' && <View style={styles.radioInner} />}
              </View>
            </View>
            <Text style={styles.planName}>
              {language === 'de' ? 'Jahresabonnement' : 'Annual Plan'}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceMain}>€29.99</Text>
              <Text style={styles.pricePeriod}>/{language === 'de' ? 'Jahr' : 'year'}</Text>
            </View>
            <Text style={styles.priceMonthly}>
              = €2.50/{language === 'de' ? 'Monat' : 'month'}
            </Text>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.planHeader}>
              <View />
              <View style={[styles.radioOuter, selectedPlan === 'monthly' && styles.radioOuterActive]}>
                {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
              </View>
            </View>
            <Text style={styles.planName}>
              {language === 'de' ? 'Monatsabonnement' : 'Monthly Plan'}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceMain}>€3.99</Text>
              <Text style={styles.pricePeriod}>/{language === 'de' ? 'Monat' : 'month'}</Text>
            </View>
            <Text style={styles.priceMonthly}>
              {language === 'de' ? 'Flexibel, jederzeit kündbar' : 'Flexible, cancel anytime'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>
            {language === 'de' ? 'Was Sie bekommen' : 'What You Get'}
          </Text>
          {features.map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.featureText}>
                {language === 'de' ? feature.de : feature.en}
              </Text>
            </View>
          ))}
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe}>
          <Text style={styles.subscribeBtnText}>
            {language === 'de' ? 'Kostenlose Testphase starten' : 'Start Free Trial'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          {language === 'de'
            ? 'Nach der 30-tägigen Testphase wird Ihr Abonnement automatisch verlängert. Sie können jederzeit vor Ablauf kündigen.'
            : 'After the 30-day trial, your subscription will auto-renew. You can cancel anytime before it ends.'}
        </Text>

        {/* Restore Purchase */}
        <TouchableOpacity style={styles.restoreBtn}>
          <Text style={styles.restoreText}>
            {language === 'de' ? 'Kauf wiederherstellen' : 'Restore Purchase'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  closeBtn: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end',
  },
  headerSection: { alignItems: 'center', marginBottom: Spacing.lg },
  logo: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.primary },
  premiumBadge: {
    fontSize: FontSizes.sm, fontWeight: '700', color: Colors.white,
    backgroundColor: '#FF9800', paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderRadius: BorderRadius.round, marginTop: Spacing.xs,
  },
  headline: {
    fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text,
    textAlign: 'center', marginTop: Spacing.md,
  },
  subtitle: {
    fontSize: FontSizes.md, color: Colors.textLight, textAlign: 'center', marginTop: Spacing.xs,
  },
  trialBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0',
    padding: Spacing.md, borderRadius: BorderRadius.lg, gap: Spacing.md,
    borderWidth: 1, borderColor: '#FFE0B2', marginBottom: Spacing.lg,
  },
  trialInfo: { flex: 1 },
  trialTitle: { fontSize: FontSizes.md, fontWeight: '700', color: '#E65100' },
  trialText: { fontSize: FontSizes.sm, color: '#BF360C', marginTop: 2 },
  planSection: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  planCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 2, borderColor: Colors.border,
  },
  planCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '10' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  saveBadge: {
    backgroundColor: '#43A047', paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  saveText: { fontSize: 10, fontWeight: '700', color: Colors.white },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: Colors.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  planName: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: Spacing.xs },
  priceMain: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.primary },
  pricePeriod: { fontSize: FontSizes.sm, color: Colors.textMuted, marginLeft: 2 },
  priceMonthly: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  featuresSection: { marginBottom: Spacing.lg },
  featuresTitle: {
    fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.md },
  featureIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { flex: 1, fontSize: FontSizes.sm, color: Colors.text, lineHeight: 20 },
  subscribeBtn: {
    backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: BorderRadius.md,
    alignItems: 'center', marginBottom: Spacing.md,
  },
  subscribeBtnText: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.white },
  footerNote: {
    fontSize: FontSizes.xs, color: Colors.textMuted, textAlign: 'center',
    lineHeight: 18, marginBottom: Spacing.md,
  },
  restoreBtn: { alignItems: 'center', padding: Spacing.md },
  restoreText: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: '600' },
});
