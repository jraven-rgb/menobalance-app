import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../src/contexts/LanguageContext';
import { Colors, FontSizes, Spacing, BorderRadius } from '../src/constants/colors';

const searchCategories = [
  {
    id: 'gynaecologist',
    icon: 'medkit',
    color: '#E53935',
    lightColor: '#FFEBEE',
    label: { en: 'Gynaecologist', de: 'Gynäkologe' },
    subtitle: { en: 'Women\'s health specialist', de: 'Spezialist für Frauengesundheit' },
    searchQuery: { en: 'gynaecologist near me', de: 'Gynäkologe in der Nähe' },
  },
  {
    id: 'endometriosis',
    icon: 'medical',
    color: '#7E57C2',
    lightColor: '#EDE7F6',
    label: { en: 'Endometriosis Centre', de: 'Endometriose-Zentrum' },
    subtitle: { en: 'Specialized treatment centres', de: 'Spezialisierte Behandlungszentren' },
    searchQuery: { en: 'endometriosis center near me', de: 'Endometriose Zentrum in der Nähe' },
  },
  {
    id: 'womens_health',
    icon: 'heart',
    color: '#EC407A',
    lightColor: '#FCE4EC',
    label: { en: "Women's Health Clinic", de: 'Frauengesundheitsklinik' },
    subtitle: { en: 'Comprehensive women\'s care', de: 'Umfassende Frauengesundheit' },
    searchQuery: { en: "women's health clinic near me", de: 'Frauengesundheit Klinik in der Nähe' },
  },
  {
    id: 'menopause',
    icon: 'flower',
    color: '#FF9800',
    lightColor: '#FFF3E0',
    label: { en: 'Menopause Specialist', de: 'Menopause-Spezialist' },
    subtitle: { en: 'Hormone & menopause experts', de: 'Hormon- und Menopause-Experten' },
    searchQuery: { en: 'menopause specialist doctor near me', de: 'Menopause Spezialist Arzt in der Nähe' },
  },
  {
    id: 'mental_health',
    icon: 'happy',
    color: '#26A69A',
    lightColor: '#E0F2F1',
    label: { en: 'Mental Health Support', de: 'Psychologische Unterstützung' },
    subtitle: { en: 'Therapy & counselling', de: 'Therapie & Beratung' },
    searchQuery: { en: 'women mental health therapist near me', de: 'Psychotherapeut Frauen in der Nähe' },
  },
  {
    id: 'nutrition',
    icon: 'nutrition',
    color: '#43A047',
    lightColor: '#E8F5E9',
    label: { en: 'Nutritionist', de: 'Ernährungsberater' },
    subtitle: { en: 'Diet & hormone health', de: 'Ernährung & Hormongesundheit' },
    searchQuery: { en: 'nutritionist women hormones near me', de: 'Ernährungsberater Hormone Frauen in der Nähe' },
  },
];

export default function ClinicSearchScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [customSearch, setCustomSearch] = useState('');

  const openSearch = (query: string) => {
    const encodedQuery = encodeURIComponent(query);
    const url = Platform.select({
      ios: `maps://maps.apple.com/?q=${encodedQuery}`,
      android: `geo:0,0?q=${encodedQuery}`,
      default: `https://www.google.com/maps/search/${encodedQuery}`,
    });

    Linking.canOpenURL(url || '').then((supported) => {
      if (supported) {
        Linking.openURL(url || '');
      } else {
        Linking.openURL(`https://www.google.com/maps/search/${encodedQuery}`);
      }
    });
  };

  const handleCustomSearch = () => {
    if (customSearch.trim()) {
      openSearch(customSearch.trim());
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'de' ? 'Hilfe finden' : 'Find Help'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Custom Search */}
        <View style={styles.searchCard}>
          <Text style={styles.searchLabel}>
            {language === 'de' ? 'Suche nach Fachärzten' : 'Search for Specialists'}
          </Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder={language === 'de' ? 'z.B. Gynäkologe Berlin' : 'e.g., Gynaecologist London'}
              placeholderTextColor={Colors.textMuted}
              value={customSearch}
              onChangeText={setCustomSearch}
              onSubmitEditing={handleCustomSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleCustomSearch}>
              <Ionicons name="search" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Search Categories */}
        <Text style={styles.sectionTitle}>
          {language === 'de' ? 'Schnellsuche' : 'Quick Search'}
        </Text>

        {searchCategories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryCard}
            onPress={() => openSearch(cat.searchQuery[language])}
            activeOpacity={0.8}
          >
            <View style={[styles.categoryIcon, { backgroundColor: cat.lightColor }]}>
              <Ionicons name={cat.icon as any} size={24} color={cat.color} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryLabel}>{cat.label[language]}</Text>
              <Text style={styles.categorySubtitle}>{cat.subtitle[language]}</Text>
            </View>
            <View style={[styles.categoryArrow, { backgroundColor: cat.lightColor }]}>
              <Ionicons name="navigate" size={18} color={cat.color} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Emergency Info */}
        <View style={styles.emergencyCard}>
          <Ionicons name="warning" size={22} color="#E53935" />
          <View style={styles.emergencyContent}>
            <Text style={styles.emergencyTitle}>
              {language === 'de' ? 'Im Notfall' : 'In an Emergency'}
            </Text>
            <Text style={styles.emergencyText}>
              {language === 'de'
                ? 'Bei starken Schmerzen, schweren Blutungen oder akuten psychischen Krisen rufen Sie bitte den Notruf 112 an.'
                : 'For severe pain, heavy bleeding, or acute mental health crisis, please call emergency services (112 in Germany / 999 in UK / 911 in US).'}
            </Text>
            <TouchableOpacity
              style={styles.emergencyBtn}
              onPress={() => Linking.openURL('tel:112')}
            >
              <Ionicons name="call" size={18} color={Colors.white} />
              <Text style={styles.emergencyBtnText}>
                {language === 'de' ? 'Notruf 112' : 'Emergency 112'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle" size={16} color={Colors.textMuted} />
          <Text style={styles.disclaimerText}>
            {language === 'de'
              ? 'Die Suchergebnisse werden von Google Maps bereitgestellt. Wir übernehmen keine Verantwortung für die gelisteten Anbieter.'
              : 'Search results are provided by Google Maps. We are not responsible for the listed providers.'}
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
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, backgroundColor: '#26A69A',
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.white },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  searchCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.lg,
  },
  searchLabel: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  searchRow: { flexDirection: 'row', gap: Spacing.sm },
  searchInput: {
    flex: 1, backgroundColor: Colors.inputBg, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSizes.sm, color: Colors.text,
  },
  searchBtn: {
    width: 48, height: 48, borderRadius: BorderRadius.md, backgroundColor: '#26A69A',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md,
  },
  categoryCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm,
  },
  categoryIcon: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  categoryInfo: { flex: 1 },
  categoryLabel: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  categorySubtitle: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  categoryArrow: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  emergencyCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFEBEE',
    padding: Spacing.md, borderRadius: BorderRadius.lg, gap: Spacing.sm, marginTop: Spacing.lg,
    borderLeftWidth: 4, borderLeftColor: '#E53935',
  },
  emergencyContent: { flex: 1 },
  emergencyTitle: { fontSize: FontSizes.md, fontWeight: '700', color: '#C62828', marginBottom: Spacing.xs },
  emergencyText: { fontSize: FontSizes.sm, color: '#C62828', lineHeight: 20, marginBottom: Spacing.sm },
  emergencyBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E53935',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
    gap: Spacing.xs, alignSelf: 'flex-start',
  },
  emergencyBtnText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.white },
  disclaimerCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.inputBg,
    padding: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.sm, marginTop: Spacing.md,
  },
  disclaimerText: { flex: 1, fontSize: FontSizes.xs, color: Colors.textMuted, lineHeight: 18 },
});
