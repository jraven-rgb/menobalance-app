import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, LayoutAnimation, UIManager, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../src/constants/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { api } from '../../src/services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SYMPTOM_CATEGORIES = [
  { id: 'temp', title: '🌡️ Temperature & Skin', items: ['Hot Flashes', 'Night Sweats', 'Cold Flashes', 'Formication', 'Dry Skin', 'Acne'] },
  { id: 'physical', title: '🏃‍♀️ Physical & Pain', items: ['Joint Pain', 'Muscle Aches', 'Headaches', 'Palpitations', 'Breast Tenderness', 'Digestive Issues'] },
  { id: 'mental', title: '🧠 Mental & Emotional', items: ['Brain Fog', 'Anxiety', 'Mood Swings', 'Irritability', 'Poor Concentration', 'Tearfulness'] },
  { id: 'sleep', title: '😴 Sleep & Energy', items: ['Insomnia', 'Fatigue', 'Waking up early', 'Difficulty falling asleep'] },
  { id: 'intimate', title: '🌸 Intimate & Urinary', items: ['Low Libido', 'Vaginal Dryness', 'UTIs', 'Incontinence', 'Irregular Periods'] }
];

export default function SymptomsScreen() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [mood, setMood] = useState<number | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState({});
  const [frequentScales, setFrequentScales] = useState({ 'Hot Flashes': 0, 'Joint Pain': 0 });

  const toggleCategory = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCat(expandedCat === id ? null : id);
  };

  const toggleSymptom = (item: string) => {
    setSelectedSymptoms(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const updateScale = (key: string, val: number) => {
    setFrequentScales(prev => ({ ...prev, [key]: val }));
  };

  const saveLog = async () => {
    try {
      const activeSymptoms = Object.keys(selectedSymptoms).filter(k => selectedSymptoms[k]);
      await api.post('/daily-checkin', {
        date: new Date().toISOString().split('T')[0],
        mood: mood || 3,
        energy_level: 3,
        sleep_quality: 3,
        symptoms: activeSymptoms,
        symptom_severity: frequentScales
      });
      Alert.alert(language === 'de' ? 'Gespeichert' : 'Saved', 'Your daily log has been updated.');
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.title}>{language === 'de' ? 'Tagebuch' : 'Daily Log'}</Text>
          <Text style={styles.subtitle}>{user?.menopause_phase || 'Menopause'} Phase</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>{language === 'de' ? 'Fühlst du dich heute gut?' : 'How are you feeling?'}</Text>
          <View style={styles.emojiGrid}>
            {[ {m: 1, e: '😢'}, {m: 2, e: '😕'}, {m: 3, e: '😐'}, {m: 4, e: '🙂'}, {m: 5, e: '😄'} ].map((item) => (
              <TouchableOpacity
                key={item.m} style={[styles.emojiBtn, mood === item.m && styles.emojiBtnActive]}
                onPress={() => setMood(item.m)}
              >
                <Text style={styles.emojiText}>{item.e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionHeading}>{language === 'de' ? 'Deine häufigsten Symptome' : 'Your Most Frequent Symptoms'}</Text>
        <View style={styles.quickLogCard}>
          {Object.keys(frequentScales).map((key, idx) => (
             <View key={key} style={[styles.scaleRow, idx === 1 && {borderBottomWidth: 0}]}>
               <Text style={styles.scaleTextLabel}>{key}</Text>
               <View style={styles.scaleDots}>
                 {[1, 2, 3, 4, 5].map(level => (
                   <TouchableOpacity 
                     key={level} 
                     style={[styles.dot, frequentScales[key] >= level && {backgroundColor: Colors.primary}]}
                     onPress={() => updateScale(key, level)}
                   />
                 ))}
               </View>
             </View>
          ))}
        </View>

        <Text style={styles.sectionHeading}>{language === 'de' ? 'Alles Weitere' : 'Track Everything Else'}</Text>
        {SYMPTOM_CATEGORIES.map((cat) => {
          const isExpanded = expandedCat === cat.id;
          const activeCount = cat.items.filter(i => selectedSymptoms[i]).length;
          return (
            <View key={cat.id} style={styles.categoryWrap}>
              <TouchableOpacity style={styles.catHeader} onPress={() => toggleCategory(cat.id)}>
                <Text style={styles.catTitle}>{cat.title}</Text>
                <View style={styles.catRight}>
                  {activeCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{activeCount}</Text></View>}
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={Colors.textLight} />
                </View>
              </TouchableOpacity>
              {isExpanded && (
                <View style={styles.chipsWrap}>
                  {cat.items.map(item => {
                    const isSelected = selectedSymptoms[item];
                    return (
                      <TouchableOpacity key={item} style={[styles.chip, isSelected && styles.chipActive]} onPress={() => toggleSymptom(item)}>
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>+ {item}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}
            </View>
          )
        })}

        <TouchableOpacity style={styles.submitBtn} onPress={saveLog}>
          <Text style={styles.submitBtnText}>{language === 'de' ? 'Speichern' : 'Save Log'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 24, paddingBottom: 60 },
  header: { marginTop: 40, marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 16, color: '#EC407A', fontWeight: '600', marginTop: 4 },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: Colors.textLight, marginTop: 24, marginBottom: 12 },
  card: { backgroundColor: Colors.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  cardSectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 16, textAlign: 'center' },
  emojiGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
  emojiBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.inputBg, alignItems: 'center', justifyContent: 'center' },
  emojiBtnActive: { backgroundColor: '#FCE4EC', borderWidth: 2, borderColor: '#EC407A' },
  emojiText: { fontSize: 24 },
  quickLogCard: { backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, paddingVertical: 8 },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  scaleTextLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  scaleDots: { flexDirection: 'row', gap: 8 },
  dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.inputBg },
  categoryWrap: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: '#FFFFFF' },
  catTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  catRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, paddingTop: 0, gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.inputBg },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 14, color: Colors.textLight, fontWeight: '500' },
  chipTextActive: { color: Colors.white, fontWeight: '700' },
  submitBtn: { backgroundColor: Colors.text, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 32 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
