import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ImageBackground,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { symptomApi, adviceApi, checkinApi } from '../../src/services/api';
import { Colors, CategoryColors, CategoryImages, FontSizes, Spacing, BorderRadius } from '../../src/constants/colors';
import { format } from 'date-fns';

const quickActions = [
  { id: 'diet', icon: 'nutrition', label: { en: 'Diet', de: 'Ernährung' }, color: CategoryColors.diet },
  { id: 'exercise', icon: 'fitness', label: { en: 'Exercise', de: 'Bewegung' }, color: CategoryColors.exercise },
  { id: 'sleep', icon: 'moon', label: { en: 'Sleep', de: 'Schlaf' }, color: CategoryColors.sleep },
  { id: 'breathing', icon: 'flower', label: { en: 'Relax', de: 'Entspannen' }, color: CategoryColors.breathing },
];

const phaseInfo: Record<string, { emoji: string; message: { en: string; de: string } }> = {
  perimenopause: { emoji: '🌱', message: { en: 'Embrace this transition with grace', de: 'Nehmen Sie diese Übergangsphase mit Anmut an' } },
  menopause: { emoji: '🌸', message: { en: 'You are blooming beautifully', de: 'Sie erblühen wunderschön' } },
  postmenopause: { emoji: '🌼', message: { en: 'Celebrate your wisdom and strength', de: 'Feiern Sie Ihre Weisheit und Stärke' } },
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const router = useRouter();
  const [todaySymptoms, setTodaySymptoms] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyTip, setDailyTip] = useState<{ tip: string; category: string } | null>(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [todayCheckin, setTodayCheckin] = useState<any>(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadTodaySymptoms(),
      loadDailyTip(),
      loadTodayCheckin(),
    ]);
  };

  const loadTodaySymptoms = async () => {
    try {
      const response = await symptomApi.getLogByDate(today);
      if (response.data) {
        setTodaySymptoms(response.data.symptoms || []);
      }
    } catch (error) {
      console.log('No symptoms logged today');
    }
  };

  const loadDailyTip = async () => {
    try {
      const response = await adviceApi.getDailyTip();
      setDailyTip(response.data);
    } catch (error) {
      // Use fallback tip
      setDailyTip({
        tip: language === 'de' 
          ? 'Trinken Sie heute ausreichend Wasser für Ihr Wohlbefinden.'
          : 'Stay hydrated today for your overall wellbeing.',
        category: 'hydration'
      });
    }
  };

  const loadTodayCheckin = async () => {
    try {
      const response = await checkinApi.getCheckin(today);
      setTodayCheckin(response.data);
    } catch (error) {
      console.log('No checkin today');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return language === 'de' ? 'Guten Morgen' : 'Good morning';
    if (hour < 18) return language === 'de' ? 'Guten Tag' : 'Good afternoon';
    return language === 'de' ? 'Guten Abend' : 'Good evening';
  };

  const phase = user?.menopause_phase || 'menopause';
  const phaseData = phaseInfo[phase] || phaseInfo.menopause;

  const getMoodEmoji = (mood: number) => {
    const emojis = ['😢', '😔', '😐', '🙂', '😊'];
    return emojis[mood - 1] || '😐';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Hero Header */}
        <ImageBackground
          source={{ uri: CategoryImages.home }}
          style={styles.heroSection}
          imageStyle={styles.heroImageStyle}
        >
          <View style={styles.heroOverlay}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.greeting}>{getGreeting()},</Text>
                <Text style={styles.userName}>{user?.name || 'Friend'}</Text>
              </View>
              <Text style={styles.dateText}>{format(new Date(), language === 'de' ? 'd. MMM' : 'MMM d')}</Text>
            </View>
            
            {/* Phase Badge */}
            <View style={styles.phaseBadge}>
              <Text style={styles.phaseEmoji}>{phaseData.emoji}</Text>
              <View>
                <Text style={styles.phaseLabel}>
                  {phase.charAt(0).toUpperCase() + phase.slice(1)}
                </Text>
                <Text style={styles.phaseMessage}>{phaseData.message[language]}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* Daily Check-in Card */}
        {!todayCheckin ? (
          <TouchableOpacity 
            style={styles.checkinPrompt}
            onPress={() => router.push('/(tabs)/symptoms')}
          >
            <View style={styles.checkinLeft}>
              <View style={styles.checkinIconContainer}>
                <Ionicons name="heart" size={24} color={Colors.accent} />
              </View>
              <View>
                <Text style={styles.checkinTitle}>
                  {language === 'de' ? 'Wie geht es Ihnen heute?' : 'How are you feeling today?'}
                </Text>
                <Text style={styles.checkinSubtitle}>
                  {language === 'de' ? 'Täglichen Check-in starten' : 'Start your daily check-in'}
                </Text>
              </View>
            </View>
            <Ionicons name="arrow-forward-circle" size={32} color={Colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.checkinComplete}>
            <View style={styles.checkinCompleteHeader}>
              <Text style={styles.checkinCompleteTitle}>
                {language === 'de' ? 'Heutiger Check-in' : "Today's Check-in"}
              </Text>
              <Text style={styles.checkinMood}>{getMoodEmoji(todayCheckin.mood)}</Text>
            </View>
            <View style={styles.checkinStats}>
              <View style={styles.checkinStat}>
                <Text style={styles.checkinStatLabel}>{language === 'de' ? 'Stimmung' : 'Mood'}</Text>
                <Text style={styles.checkinStatValue}>{todayCheckin.mood}/5</Text>
              </View>
              <View style={styles.checkinStat}>
                <Text style={styles.checkinStatLabel}>{language === 'de' ? 'Energie' : 'Energy'}</Text>
                <Text style={styles.checkinStatValue}>{todayCheckin.energy_level}/5</Text>
              </View>
              <View style={styles.checkinStat}>
                <Text style={styles.checkinStatLabel}>{language === 'de' ? 'Schlaf' : 'Sleep'}</Text>
                <Text style={styles.checkinStatValue}>{todayCheckin.sleep_quality}/5</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? 'Wellness erkunden' : 'Explore Wellness'}
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickActionCard, { backgroundColor: action.color.light }]}
                onPress={() => router.push(`/(tabs)/wellness?category=${action.id}`)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color.primary }]}>
                  <Ionicons name={action.icon as any} size={24} color={Colors.white} />
                </View>
                <Text style={[styles.quickActionLabel, { color: action.color.primary }]}>
                  {action.label[language]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Symptoms */}
        <TouchableOpacity 
          style={styles.symptomsCard}
          onPress={() => router.push('/(tabs)/symptoms')}
        >
          <View style={styles.symptomsHeader}>
            <View style={styles.symptomsIconContainer}>
              <Ionicons name="clipboard" size={20} color={Colors.primary} />
            </View>
            <View style={styles.symptomsInfo}>
              <Text style={styles.symptomsTitle}>
                {language === 'de' ? 'Heutige Symptome' : "Today's Symptoms"}
              </Text>
              <Text style={styles.symptomsCount}>
                {todaySymptoms.length > 0 
                  ? `${todaySymptoms.length} ${language === 'de' ? 'erfasst' : 'logged'}`
                  : language === 'de' ? 'Noch keine erfasst' : 'None logged yet'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/(tabs)/symptoms')}
            >
              <Ionicons name="add" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
          {todaySymptoms.length > 0 && (
            <View style={styles.symptomTags}>
              {todaySymptoms.slice(0, 4).map((symptom, index) => (
                <View key={index} style={styles.symptomTag}>
                  <Text style={styles.symptomTagText}>{symptom}</Text>
                </View>
              ))}
              {todaySymptoms.length > 4 && (
                <View style={[styles.symptomTag, styles.symptomTagMore]}>
                  <Text style={styles.symptomTagText}>+{todaySymptoms.length - 4}</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Daily Tip */}
        {dailyTip && (
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <View style={styles.tipIconContainer}>
                <Ionicons name="bulb" size={20} color="#FFA000" />
              </View>
              <Text style={styles.tipTitle}>
                {language === 'de' ? 'Tipp des Tages' : 'Daily Tip'}
              </Text>
            </View>
            <Text style={styles.tipText}>{dailyTip.tip}</Text>
          </View>
        )}

        {/* Daily Routines Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? 'Tägliche Routinen' : 'Daily Routines'}
          </Text>
          <View style={styles.routineRow}>
            <TouchableOpacity 
              style={[styles.routineCard, { backgroundColor: '#EDE7F6' }]}
              onPress={() => router.push('/routines?type=yoga')}
            >
              <Text style={styles.routineEmoji}>🧘‍♀️</Text>
              <Text style={[styles.routineLabel, { color: '#7E57C2' }]}>
                {language === 'de' ? 'Yoga' : 'Yoga'}
              </Text>
              <Text style={styles.routineDuration}>20 min</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.routineCard, { backgroundColor: '#FCE4EC' }]}
              onPress={() => router.push('/routines?type=pelvic_floor')}
            >
              <Text style={styles.routineEmoji}>🌅</Text>
              <Text style={[styles.routineLabel, { color: '#EC407A' }]}>
                {language === 'de' ? 'Beckenboden' : 'Pelvic Floor'}
              </Text>
              <Text style={styles.routineDuration}>5 min</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.routineCard, { backgroundColor: '#FFF3E0' }]}
              onPress={() => router.push('/routines?type=affirmation')}
            >
              <Text style={styles.routineEmoji}>✨</Text>
              <Text style={[styles.routineLabel, { color: '#FF9800' }]}>
                {language === 'de' ? 'Affirmation' : 'Affirmation'}
              </Text>
              <Text style={styles.routineDuration}>2 min</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feature Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? 'Mehr entdecken' : 'Discover More'}
          </Text>
          
          {/* Partner Support Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => router.push('/partner')}
          >
            <View style={[styles.featureOverlayFlat, { backgroundColor: '#EC407A' }]}>
              <Ionicons name="heart" size={28} color={Colors.white} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>
                  {language === 'de' ? 'Partner-Unterstützung' : 'Partner Support'}
                </Text>
                <Text style={styles.featureSubtitle}>
                  {language === 'de' ? 'Tipps für Ihren Partner teilen' : 'Share tips with your partner'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>

          {/* Health Report Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => router.push('/health-report')}
          >
            <View style={[styles.featureOverlayFlat, { backgroundColor: '#5C6BC0' }]}>
              <Ionicons name="document-text" size={28} color={Colors.white} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>
                  {language === 'de' ? 'Gesundheitsbericht' : 'Health Report'}
                </Text>
                <Text style={styles.featureSubtitle}>
                  {language === 'de' ? 'Für Ihren Arztbesuch' : 'For your doctor visit'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>

          {/* Cycle Education Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => router.push('/cycle-education')}
          >
            <Image 
              source={{ uri: CategoryImages.meditation }} 
              style={styles.featureImage}
            />
            <View style={[styles.featureOverlay, { backgroundColor: CategoryColors.cycle.primary + 'E6' }]}>
              <Ionicons name="sync" size={28} color={Colors.white} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>
                  {language === 'de' ? 'Ihren Zyklus verstehen' : 'Understanding Your Cycle'}
                </Text>
                <Text style={styles.featureSubtitle}>
                  {language === 'de' ? '4 Phasen erklärt' : '4 phases explained'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>

          {/* Find Help Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => router.push('/clinic-search')}
          >
            <View style={[styles.featureOverlayFlat, { backgroundColor: '#26A69A' }]}>
              <Ionicons name="search" size={28} color={Colors.white} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>
                  {language === 'de' ? 'Hilfe finden' : 'Find Help Near You'}
                </Text>
                <Text style={styles.featureSubtitle}>
                  {language === 'de' ? 'Fachärzte & Kliniken' : 'Specialists & clinics'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>
        </View>
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
  heroSection: {
    height: 200,
  },
  heroImageStyle: {
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(124, 107, 156, 0.85)',
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: FontSizes.md,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.white,
  },
  dateText: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  phaseEmoji: {
    fontSize: 36,
  },
  phaseLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.white,
  },
  phaseMessage: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  checkinPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    margin: Spacing.md,
    marginTop: -Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  checkinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  checkinIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  checkinSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
  },
  checkinComplete: {
    backgroundColor: Colors.white,
    margin: Spacing.md,
    marginTop: -Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  checkinCompleteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  checkinCompleteTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  checkinMood: {
    fontSize: 28,
  },
  checkinStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  checkinStat: {
    alignItems: 'center',
  },
  checkinStatLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  checkinStatValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  section: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  symptomsCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  symptomsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symptomsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  symptomsInfo: {
    flex: 1,
  },
  symptomsTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  symptomsCount: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symptomTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  symptomTag: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  symptomTagMore: {
    backgroundColor: Colors.primaryLight,
  },
  symptomTagText: {
    fontSize: FontSizes.xs,
    color: Colors.primaryDark,
    fontWeight: '500',
  },
  tipCard: {
    backgroundColor: '#FFF8E1',
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA000',
    marginBottom: Spacing.md,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  tipIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE082',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#F57C00',
  },
  tipText: {
    fontSize: FontSizes.sm,
    color: '#5D4037',
    lineHeight: 22,
  },
  featureCard: {
    height: 80,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  featureImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featureOverlay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  featureOverlayFlat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.white,
  },
  featureSubtitle: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  routineRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  routineCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  routineEmoji: {
    fontSize: 32,
  },
  routineLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
  routineDuration: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
});
