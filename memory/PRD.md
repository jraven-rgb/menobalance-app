# MenoWellness - Product Requirements Document

## Overview
A comprehensive mobile app for women in various menopause phases with personalized advice on diet, supplements, exercise, sleep, and breathing exercises. Includes symptom tracking, partner support, health reports, and clinic finder.

## Core Features (Implemented)
1. **Auth System** - Registration, Login, JWT-based authentication
2. **Bilingual Support** - English & German (EN/DE toggle)
3. **Onboarding Questionnaire** - Age, height, weight, last period, cycle length, goals, exercise level, dietary restrictions, medications, health conditions
4. **Symptom Tracker** - 70+ symptoms with pill-toggle UI, severity tracking, daily logging
5. **AI-Powered Wellness Advice** - Personalized diet, exercise, sleep, supplements, breathing exercises via GPT-4o
6. **Daily Check-in** - Mood, energy, sleep quality tracking
7. **Daily Routines** - AI-personalized 20-min yoga, 5-min pelvic floor, morning affirmations
8. **Partner Support** - Generate & share phase-specific tips for partners
9. **Health Report** - Printable/shareable symptom & period report for doctor visits
10. **Cycle Education** - Interactive 4-phase cycle explainer (body, mind, energy, stress tolerance)
11. **Clinic Search** - Find gynaecologists, endometriosis centres, women's health clinics, mental health support
12. **Legal Pages** - Impressum, Datenschutzerklärung (GDPR), AGB, Medical Disclaimer (Germany-compliant)
13. **Subscription UI** - 30-day free trial, €3.99/month or €29.99/year pricing
14. **Medical Disclaimer** - Prominent supplement dosage warning (varies by country)
15. **Gynecologist Warning** - Alert when severe symptoms are logged
16. **Herbs/Spices & Endometriosis** - Specialized diet advice for inflammation

## Tech Stack
- Frontend: Expo (React Native), expo-router, Context API
- Backend: FastAPI, MongoDB (Motor async), LiteLLM via Emergent LLM Key
- AI: GPT-4o via LiteLLM for personalized wellness content

## API Endpoints
- Auth: POST /api/register, POST /api/login, GET /api/me
- Symptoms: GET /api/symptoms, POST /api/symptom-logs, GET /api/symptom-logs/{date}
- Wellness: POST /api/wellness-advice/{category}
- Routines: POST /api/daily-routine
- Partner: POST /api/partner-tips
- Report: GET /api/health-report
- Info: GET /api/hormones, GET /api/cycle-phases, GET /api/daily-tip
- Check-in: POST /api/daily-checkin, GET /api/daily-checkin/{date}

## Screen Map
- / (Login/Register)
- /onboarding (8-step questionnaire)
- /(tabs)/home (Dashboard)
- /(tabs)/symptoms (Symptom tracker)
- /(tabs)/wellness (AI advice categories)
- /(tabs)/profile (Settings & quick actions)
- /routines (Yoga, Pelvic Floor, Affirmation)
- /partner (Partner support tips)
- /health-report (Doctor visit report)
- /cycle-education (4 cycle phases)
- /clinic-search (Find specialists)
- /subscription (Premium plans)
- /legal (Impressum, Privacy, Terms, Medical Disclaimer)

## Subscription Model
- Free: 30-day full access trial
- Monthly: €3.99/month
- Annual: €29.99/year (saves 37%)
- Payment integration: Placeholder (to be implemented)
