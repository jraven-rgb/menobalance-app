import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../src/contexts/LanguageContext';
import { Colors, FontSizes, Spacing, BorderRadius } from '../src/constants/colors';

type LegalSection = 'impressum' | 'privacy' | 'terms' | 'medical' | null;

const legalContent = {
  impressum: {
    en: {
      title: 'Legal Notice (Impressum)',
      content: `Legal Notice (Impressum) according to § 5 TMG\n\nCompany Name: [Your Company Name]\nAddress: [Street Address]\n[Postal Code, City]\nGermany\n\nRepresented by: [Your Name]\n\nContact:\nPhone: [Phone Number]\nEmail: [Email Address]\n\nVAT ID: [VAT Number if applicable]\n\nResponsible for content according to § 55 Abs. 2 RStV:\n[Name and Address]\n\nDispute Resolution:\nThe European Commission provides a platform for online dispute resolution (OS): https://ec.europa.eu/consumers/odr\n\nWe are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.`
    },
    de: {
      title: 'Impressum',
      content: `Impressum gemäß § 5 TMG\n\nFirmenname: [Ihr Firmenname]\nAdresse: [Straße]\n[PLZ, Stadt]\nDeutschland\n\nVertreten durch: [Ihr Name]\n\nKontakt:\nTelefon: [Telefonnummer]\nE-Mail: [E-Mail-Adresse]\n\nUmsatzsteuer-ID: [USt-IdNr. falls vorhanden]\n\nVerantwortlich für den Inhalt nach § 55 Abs. 2 RStV:\n[Name und Adresse]\n\nStreitschlichtung:\nDie Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr\n\nWir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.`
    }
  },
  privacy: {
    en: {
      title: 'Privacy Policy (Datenschutzerklärung)',
      content: `Privacy Policy\n\nEffective Date: [Date]\n\n1. Data Controller\n[Your Company Name]\n[Address]\nEmail: [Email]\n\n2. Data We Collect\n- Account data (name, email)\n- Health data (symptoms, cycle info, menopause phase)\n- Usage data (app interactions)\n\n3. Purpose of Data Processing\nWe process your data to:\n- Provide personalized wellness advice\n- Track your symptoms and health trends\n- Generate health reports\n- Improve our services\n\nLegal basis: Art. 6(1)(a) GDPR (consent), Art. 6(1)(b) GDPR (contract performance)\n\n4. Health Data (Special Category)\nYour health data is processed under Art. 9(2)(a) GDPR with your explicit consent. You can withdraw consent at any time.\n\n5. Data Storage\nYour data is stored securely on encrypted servers. We retain your data as long as your account is active.\n\n6. Your Rights (GDPR)\nYou have the right to:\n- Access your data (Art. 15 GDPR)\n- Rectify your data (Art. 16 GDPR)\n- Delete your data (Art. 17 GDPR)\n- Restrict processing (Art. 18 GDPR)\n- Data portability (Art. 20 GDPR)\n- Object to processing (Art. 21 GDPR)\n\n7. Data Deletion\nYou can delete your account and all associated data at any time through the app settings.\n\n8. Third-Party Services\nWe use AI services to generate personalized advice. Your data is processed in accordance with our data processing agreements.\n\n9. Contact\nFor privacy inquiries: [Email]\n\n10. Supervisory Authority\nYou have the right to lodge a complaint with a data protection supervisory authority.`
    },
    de: {
      title: 'Datenschutzerklärung',
      content: `Datenschutzerklärung\n\nStand: [Datum]\n\n1. Verantwortlicher\n[Ihr Firmenname]\n[Adresse]\nE-Mail: [E-Mail]\n\n2. Erhobene Daten\n- Kontodaten (Name, E-Mail)\n- Gesundheitsdaten (Symptome, Zyklusinfo, Menopause-Phase)\n- Nutzungsdaten (App-Interaktionen)\n\n3. Zweck der Datenverarbeitung\nWir verarbeiten Ihre Daten um:\n- Personalisierte Wellness-Beratung anzubieten\n- Ihre Symptome und Gesundheitstrends zu verfolgen\n- Gesundheitsberichte zu erstellen\n- Unsere Dienste zu verbessern\n\nRechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung), Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)\n\n4. Gesundheitsdaten (Besondere Kategorie)\nIhre Gesundheitsdaten werden gemäß Art. 9 Abs. 2 lit. a DSGVO mit Ihrer ausdrücklichen Einwilligung verarbeitet. Sie können die Einwilligung jederzeit widerrufen.\n\n5. Datenspeicherung\nIhre Daten werden sicher auf verschlüsselten Servern gespeichert. Wir bewahren Ihre Daten auf, solange Ihr Konto aktiv ist.\n\n6. Ihre Rechte (DSGVO)\nSie haben das Recht auf:\n- Auskunft (Art. 15 DSGVO)\n- Berichtigung (Art. 16 DSGVO)\n- Löschung (Art. 17 DSGVO)\n- Einschränkung der Verarbeitung (Art. 18 DSGVO)\n- Datenübertragbarkeit (Art. 20 DSGVO)\n- Widerspruch (Art. 21 DSGVO)\n\n7. Datenlöschung\nSie können Ihr Konto und alle zugehörigen Daten jederzeit über die App-Einstellungen löschen.\n\n8. Drittanbieter\nWir nutzen KI-Dienste zur Erstellung personalisierter Beratung. Ihre Daten werden gemäß unseren Auftragsverarbeitungsverträgen verarbeitet.\n\n9. Kontakt\nFür Datenschutzanfragen: [E-Mail]\n\n10. Aufsichtsbehörde\nSie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren.`
    }
  },
  terms: {
    en: {
      title: 'Terms of Service (AGB)',
      content: `Terms of Service\n\nEffective Date: [Date]\n\n1. Scope\nThese terms govern your use of the MenoWellness app.\n\n2. Service Description\nMenoWellness provides wellness information, symptom tracking, and AI-generated advice for women experiencing menopause.\n\n3. Subscription\n- Free trial: 30 days full access\n- Monthly subscription: €3.99/month\n- Annual subscription: €29.99/year\n- Cancel anytime\n\n4. User Responsibilities\n- Provide accurate health information\n- Use the app for personal wellness purposes only\n- Do not share your account credentials\n\n5. Limitation of Liability\nMenoWellness is a wellness companion, NOT a medical device or medical service. We are not liable for health decisions made based on app content.\n\n6. Intellectual Property\nAll content, design, and features are protected by copyright.\n\n7. Termination\nWe may terminate accounts that violate these terms. You may delete your account at any time.\n\n8. Changes to Terms\nWe may update these terms. Continued use constitutes acceptance.\n\n9. Governing Law\nThese terms are governed by the laws of the Federal Republic of Germany.\n\n10. Contact\n[Email Address]`
    },
    de: {
      title: 'Allgemeine Geschäftsbedingungen (AGB)',
      content: `Allgemeine Geschäftsbedingungen\n\nStand: [Datum]\n\n1. Geltungsbereich\nDiese AGB regeln die Nutzung der MenoWellness App.\n\n2. Leistungsbeschreibung\nMenoWellness bietet Wellness-Informationen, Symptom-Tracking und KI-generierte Beratung für Frauen in der Menopause.\n\n3. Abonnement\n- Kostenlose Testphase: 30 Tage Vollzugang\n- Monatsabonnement: 3,99 €/Monat\n- Jahresabonnement: 29,99 €/Jahr\n- Jederzeit kündbar\n\n4. Pflichten der Nutzerin\n- Korrekte Gesundheitsinformationen angeben\n- Die App nur für persönliche Wellness-Zwecke nutzen\n- Zugangsdaten nicht teilen\n\n5. Haftungsbeschränkung\nMenoWellness ist ein Wellness-Begleiter, KEIN Medizinprodukt oder medizinischer Dienst. Wir haften nicht für Gesundheitsentscheidungen auf Basis der App-Inhalte.\n\n6. Geistiges Eigentum\nAlle Inhalte, Designs und Funktionen sind urheberrechtlich geschützt.\n\n7. Kündigung\nWir können Konten kündigen, die gegen diese AGB verstoßen. Sie können Ihr Konto jederzeit löschen.\n\n8. Änderungen der AGB\nWir können diese AGB aktualisieren. Die weitere Nutzung gilt als Zustimmung.\n\n9. Anwendbares Recht\nEs gilt das Recht der Bundesrepublik Deutschland.\n\n10. Kontakt\n[E-Mail-Adresse]`
    }
  },
  medical: {
    en: {
      title: 'Medical Disclaimer',
      content: `Medical Disclaimer\n\nIMPORTANT: Please read carefully.\n\nMenoWellness is a wellness information and tracking application. It is NOT a medical device, and the information provided does NOT constitute medical advice, diagnosis, or treatment.\n\nThe content in this app, including AI-generated advice, supplement suggestions, exercise routines, and dietary recommendations, is for informational and educational purposes only.\n\nSupplement Information:\nAny supplement dosages mentioned are general guidance only. Recommended dosages vary by country, regulatory body, and individual health conditions. ALWAYS consult your healthcare provider or pharmacist before starting, changing, or stopping any supplement.\n\nExercise Routines:\nThe yoga, pelvic floor, and other exercise routines are general suggestions. Stop immediately if you experience pain. Consult your doctor before starting any new exercise program.\n\nWhen to Seek Medical Help:\nPlease consult a healthcare professional if you experience:\n- Severe or worsening symptoms\n- Heavy or unusual bleeding\n- Chest pain or heart palpitations\n- Severe mood changes or depression\n- Any symptoms that concern you\n\nThis app does not replace professional medical care. Always seek the advice of your gynecologist, doctor, or other qualified health provider with any questions regarding a medical condition.\n\nBy using this app, you acknowledge that you understand and agree to this disclaimer.`
    },
    de: {
      title: 'Medizinischer Haftungsausschluss',
      content: `Medizinischer Haftungsausschluss\n\nWICHTIG: Bitte sorgfältig lesen.\n\nMenoWellness ist eine Wellness-Informations- und Tracking-Anwendung. Sie ist KEIN Medizinprodukt, und die bereitgestellten Informationen stellen KEINE medizinische Beratung, Diagnose oder Behandlung dar.\n\nDie Inhalte dieser App, einschließlich KI-generierter Beratung, Nahrungsergänzungsvorschläge, Übungsroutinen und Ernährungsempfehlungen, dienen ausschließlich Informations- und Bildungszwecken.\n\nNahrungsergänzungsmittel:\nAlle genannten Dosierungen sind nur allgemeine Richtwerte. Empfohlene Dosierungen variieren je nach Land, Regulierungsbehörde und individuellem Gesundheitszustand. Konsultieren Sie IMMER Ihren Arzt oder Apotheker, bevor Sie Nahrungsergänzungsmittel einnehmen, ändern oder absetzen.\n\nÜbungsroutinen:\nDie Yoga-, Beckenboden- und anderen Übungsroutinen sind allgemeine Vorschläge. Stoppen Sie sofort bei Schmerzen. Konsultieren Sie Ihren Arzt, bevor Sie ein neues Trainingsprogramm beginnen.\n\nWann Sie ärztliche Hilfe suchen sollten:\nBitte konsultieren Sie einen Arzt bei:\n- Schweren oder sich verschlechternden Symptomen\n- Starken oder ungewöhnlichen Blutungen\n- Brustschmerzen oder Herzrasen\n- Schweren Stimmungsveränderungen oder Depression\n- Allen Symptomen, die Sie beunruhigen\n\nDiese App ersetzt keine professionelle medizinische Versorgung. Wenden Sie sich immer an Ihren Gynäkologen, Arzt oder einen qualifizierten Gesundheitsdienstleister.\n\nDurch die Nutzung dieser App erkennen Sie an, dass Sie diesen Haftungsausschluss verstehen und akzeptieren.`
    }
  }
};

export default function LegalScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [selectedSection, setSelectedSection] = useState<LegalSection>(null);

  const sections = [
    { id: 'impressum' as LegalSection, icon: 'business', color: '#5C6BC0' },
    { id: 'privacy' as LegalSection, icon: 'shield-checkmark', color: '#26A69A' },
    { id: 'terms' as LegalSection, icon: 'document-text', color: '#FF7043' },
    { id: 'medical' as LegalSection, icon: 'medical', color: '#EF5350' },
  ];

  const handleBack = () => {
    if (selectedSection) {
      setSelectedSection(null);
    } else {
      router.back();
    }
  };

  const selectedContent = selectedSection ? legalContent[selectedSection][language] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedContent?.title || (language === 'de' ? 'Rechtliches' : 'Legal')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {!selectedSection ? (
          <>
            <Text style={styles.pageSubtitle}>
              {language === 'de'
                ? 'Bitte lesen Sie die folgenden rechtlichen Dokumente'
                : 'Please review the following legal documents'}
            </Text>
            {sections.map((section) => (
              <TouchableOpacity
                key={section.id}
                style={styles.sectionCard}
                onPress={() => setSelectedSection(section.id)}
              >
                <View style={[styles.sectionIcon, { backgroundColor: section.color + '20' }]}>
                  <Ionicons name={section.icon as any} size={24} color={section.color} />
                </View>
                <Text style={styles.sectionLabel}>
                  {section.id ? legalContent[section.id][language].title : ''}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <View style={styles.contentCard}>
            {selectedContent?.content.split('\n').map((line, idx) => {
              const trimmed = line.trim();
              if (!trimmed) return <View key={idx} style={styles.spacer} />;
              if (/^\d+\.\s/.test(trimmed)) {
                return <Text key={idx} style={styles.sectionHeading}>{trimmed}</Text>;
              }
              if (trimmed.startsWith('-')) {
                return (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletContent}>{trimmed.replace(/^-\s*/, '')}</Text>
                  </View>
                );
              }
              if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
                return <Text key={idx} style={styles.importantText}>{trimmed}</Text>;
              }
              return <Text key={idx} style={styles.bodyText}>{trimmed}</Text>;
            })}
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
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, backgroundColor: Colors.primary,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.white, flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  pageSubtitle: { fontSize: FontSizes.sm, color: Colors.textLight, marginBottom: Spacing.lg, textAlign: 'center' },
  sectionCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md,
  },
  sectionIcon: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  sectionLabel: { flex: 1, fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  contentCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg,
  },
  spacer: { height: Spacing.md },
  sectionHeading: {
    fontSize: FontSizes.md, fontWeight: '700', color: Colors.primary, marginTop: Spacing.md, marginBottom: Spacing.xs,
  },
  bodyText: { fontSize: FontSizes.sm, color: Colors.textLight, lineHeight: 22, marginBottom: Spacing.xs },
  importantText: {
    fontSize: FontSizes.sm, fontWeight: '700', color: Colors.error, marginVertical: Spacing.xs,
  },
  bulletRow: { flexDirection: 'row', paddingLeft: Spacing.md, marginBottom: Spacing.xs },
  bullet: { fontSize: FontSizes.sm, color: Colors.primary, marginRight: Spacing.sm },
  bulletContent: { flex: 1, fontSize: FontSizes.sm, color: Colors.textLight, lineHeight: 22 },
});
