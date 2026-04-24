import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { authApi } from '../../src/services/api';
import { Colors, FontSizes, Spacing } from '../../src/constants/colors';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import { format } from 'date-fns';

const phases = [
  {
    id: 'perimenopause',
    name: { en: 'Perimenopause', de: 'Perimenopause' },
    emoji: '🌱',
    description: { en: 'Transitional phase, typically starting in your 40s', de: 'Übergangsphase, beginnt typischerweise in den 40ern' },
    ageRange: { en: '40-51 years', de: '40-51 Jahre' },
  },
  {
    id: 'menopause',
    name: { en: 'Menopause', de: 'Menopause' },
    emoji: '🌸',
    description: { en: '12 months without a menstrual period', de: '12 Monate ohne Menstruation' },
    ageRange: { en: 'Average age 51', de: 'Durchschnittsalter 51' },
  },
  {
    id: 'postmenopause',
    name: { en: 'Postmenopause', de: 'Postmenopause' },
    emoji: '🌼',
    description: { en: 'The years after menopause', de: 'Die Jahre nach der Menopause' },
    ageRange: { en: 'After menopause', de: 'Nach der Menopause' },
  },
];

export default function ProfileScreen() {
  const { user, updateUser, logout, refreshUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(user?.menopause_phase || null);

  const handlePhaseSelect = async (phaseId: string) => {
    if (updating) return;
    
    setSelectedPhase(phaseId);
    setUpdating(true);
    try {
      await updateUser({ menopause_phase: phaseId });
      Alert.alert(t('common.success'), language === 'de' ? 'Phase aktualisiert' : 'Phase updated');
    } catch (error) {
      Alert.alert(t('common.error'), language === 'de' ? 'Aktualisierung fehlgeschlagen' : 'Failed to update');
      setSelectedPhase(user?.menopause_phase || null);
    } finally {
      setUpdating(false);
    }
  };

  const handleLanguageChange = async (lang: 'en' | 'de') => {
    setLanguage(lang);
    try {
      await authApi.updateProfile({ language: lang });
      await refreshUser();
    } catch (error) {
      console.log('Error updating language:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      language === 'de' ? 'Möchten Sie sich wirklich abmelden?' : 'Are you sure you want to logout?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const memberSince = user?.created_at
    ? format(new Date(user.created_at), language === 'de' ? 'MMMM yyyy' : 'MMMM yyyy')
    : language === 'de' ? 'Kürzlich' : 'Recently';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Image */}
        <View style={styles.headerImage}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1492052722242-2554d0e99e3a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHwxfHxtZWRpdGF0aW9ufGVufDB8fHxwdXJwbGV8MTc3NTMwNDQ0M3ww&ixlib=rb-4.1.0&q=85&w=800' }}
            style={styles.headerBg}
          />
          <View style={styles.headerOverlay} />
          <Text style={styles.title}>{t('profile.title')}</Text>
        </View>

        {/* User Info Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.memberSince}>{t('profile.memberSince')} {memberSince}</Text>
        </Card>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
          <View style={styles.languageRow}>
            <TouchableOpacity
              style={[styles.languageOption, language === 'en' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={styles.languageFlag}>🇬🇧</Text>
              <Text style={[styles.languageLabel, language === 'en' && styles.languageLabelActive]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageOption, language === 'de' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('de')}
            >
              <Text style={styles.languageFlag}>🇩🇪</Text>
              <Text style={[styles.languageLabel, language === 'de' && styles.languageLabelActive]}>Deutsch</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Phase Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.yourPhase')}</Text>
          <Text style={styles.sectionSubtitle}>{t('profile.selectPhase')}</Text>

          <View style={styles.phaseList}>
            {phases.map((phase) => {
              const isSelected = selectedPhase === phase.id;
              return (
                <TouchableOpacity
                  key={phase.id}
                  style={[styles.phaseCard, isSelected && styles.phaseCardSelected]}
                  onPress={() => handlePhaseSelect(phase.id)}
                  disabled={updating}
                  activeOpacity={0.7}
                >
                  <View style={styles.phaseHeader}>
                    <Text style={styles.phaseEmoji}>{phase.emoji}</Text>
                    <View style={styles.phaseInfo}>
                      <Text style={[styles.phaseName, isSelected && styles.phaseNameSelected]}>
                        {phase.name[language]}
                      </Text>
                      <Text style={styles.phaseAge}>{phase.ageRange[language]}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    )}
                  </View>
                  <Text style={styles.phaseDescription}>{phase.description[language]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? 'Schnellzugriff' : 'Quick Actions'}
          </Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/health-report')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#5C6BC0' }]}>
                <Ionicons name="document-text" size={22} color={Colors.white} />
              </View>
              <Text style={styles.quickActionLabel}>
                {language === 'de' ? 'Gesundheitsbericht' : 'Health Report'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/partner')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EC407A' }]}>
                <Ionicons name="heart" size={22} color={Colors.white} />
              </View>
              <Text style={styles.quickActionLabel}>
                {language === 'de' ? 'Partner-Tipps' : 'Partner Tips'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/routines')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#7E57C2' }]}>
                <Ionicons name="body" size={22} color={Colors.white} />
              </View>
              <Text style={styles.quickActionLabel}>
                {language === 'de' ? 'Routinen' : 'Routines'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/legal')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#26A69A' }]}>
                <Ionicons name="shield-checkmark" size={22} color={Colors.white} />
              </View>
              <Text style={styles.quickActionLabel}>
                {language === 'de' ? 'Rechtliches' : 'Legal'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/clinic-search')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#43A047' }]}>
                <Ionicons name="search" size={22} color={Colors.white} />
              </View>
              <Text style={styles.quickActionLabel}>
                {language === 'de' ? 'Hilfe finden' : 'Find Help'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/subscription')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FF9800' }]}>
                <Ionicons name="star" size={22} color={Colors.white} />
              </View>
              <Text style={styles.quickActionLabel}>Premium</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.about')}</Text>
          <Card style={styles.aboutCard}>
            <View style={styles.aboutItem}>
              <Ionicons name="heart" size={20} color={Colors.accent} />
              <View style={styles.aboutContent}>
                <Text style={styles.aboutTitle}>{t('profile.personalizedSupport')}</Text>
                <Text style={styles.aboutText}>
                  {language === 'de' 
                    ? 'KI-gestützte Beratung für Ihre Symptome und Phase'
                    : 'AI-powered advice tailored to your symptoms and phase'}
                </Text>
              </View>
            </View>
            <View style={styles.aboutItem}>
              <Ionicons name="calendar" size={20} color={Colors.secondary} />
              <View style={styles.aboutContent}>
                <Text style={styles.aboutTitle}>{t('profile.symptomTracking')}</Text>
                <Text style={styles.aboutText}>
                  {language === 'de'
                    ? 'Verfolgen Sie Ihre Symptome über die Zeit'
                    : 'Track and monitor your symptoms over time'}
                </Text>
              </View>
            </View>
            <View style={styles.aboutItem}>
              <Ionicons name="leaf" size={20} color={Colors.success} />
              <View style={styles.aboutContent}>
                <Text style={styles.aboutTitle}>{t('profile.wellnessResources')}</Text>
                <Text style={styles.aboutText}>
                  {language === 'de'
                    ? 'Ernährung, Bewegung, Schlaf, Nahrungsergänzung & Entspannung'
                    : 'Diet, exercise, sleep, supplements & relaxation'}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Logout */}
        <Button
          title={t('auth.logout')}
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />

        <Text style={styles.version}>Version 3.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  headerImage: {
    height: 120,
    position: 'relative',
    marginBottom: -40,
  },
  headerBg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(124, 107, 156, 0.7)',
  },
  title: {
    position: 'absolute',
    bottom: 50,
    left: Spacing.md,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.white,
  },
  userCard: {
    marginHorizontal: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
  },
  userName: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.text,
  },
  userEmail: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginTop: 2,
  },
  memberSince: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginBottom: Spacing.md,
  },
  languageRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  languageOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  languageOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '15',
  },
  languageFlag: {
    fontSize: 24,
  },
  languageLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  languageLabelActive: {
    color: Colors.primary,
  },
  phaseList: {
    gap: Spacing.sm,
  },
  phaseCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  phaseCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '10',
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
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
  phaseNameSelected: {
    color: Colors.primary,
  },
  phaseAge: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  phaseDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
  },
  aboutCard: {
    gap: Spacing.md,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  aboutContent: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  aboutText: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
    marginTop: 2,
  },
  logoutButton: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickAction: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  version: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
