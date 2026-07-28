# NutriTrack — Project Documentation

## Overview

NutriTrack is a free, AI-powered calorie tracker web app. Users can upload food photos or search for dishes to log calories and macros. It supports Indian dishes, multiple user profiles, and provides AI-generated meal suggestions based on remaining daily targets.

**Live URL:** Deployed on Vercel  
**GitHub:** `git@github.com:anushka-82/nutritrack-calorie-tracker.git`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Backend (local dev) | Express.js (`server/index.ts`) |
| Backend (production) | Vercel Serverless Functions (`api/*.ts`) |
| Data storage | Browser localStorage (no database) |
| Deployment | Vercel (`npx vercel --prod`) |

---

## APIs Used

### Groq API (AI)
- **Purpose:** All AI features — food image analysis, food search, and meal suggestions
- **Free tier:** 14,400 requests/day, globally available
- **Base URL:** `https://api.groq.com/openai/v1/chat/completions`
- **Authentication:** Bearer token via `GROQ_API_KEY` environment variable (server-side only, never exposed to the browser)

#### Models in use

| Model | Used for |
|-------|---------|
| `qwen/qwen3.6-27b` | Image analysis (vision model — the only active Groq vision model as of July 2026) |
| `llama-3.3-70b-versatile` | Food search + meal suggestions (text only) |

> **Note:** The Qwen model outputs `<think>...</think>` thinking blocks before its answer. These are stripped before JSON parsing. `reasoning_effort: 'none'` is passed to disable thinking mode.

---

## Architecture

### Local Development
```
Browser → Vite (port 5173) → proxy /api → Express (port 3001) → Groq API
```

### Production (Vercel)
```
Browser → Vercel CDN (static frontend) → Vercel Serverless Functions → Groq API
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze-image` | POST | Sends a base64 image to Groq vision model. Returns array of all detected food items with nutrition per 100g and estimated grams. |
| `/api/search-food` | POST | Sends a text query to Groq. Returns 1–3 matching dishes with nutrition data. Supports Indian dishes. |
| `/api/suggest-foods` | POST | Sends remaining macros + goal + unlogged meals to Groq. Returns food suggestions grouped by meal. |

### Environment Variables

| Variable | Where set | Purpose |
|----------|-----------|---------|
| `GROQ_API_KEY` | `.env` (local) + Vercel dashboard (production) | Authenticates all Groq API calls |
| `PORT` | `.env` (local) | Express server port (default 3001) |

---

## Features

### 1. Onboarding
- Collects: name, biological sex, age, height (cm), weight (kg), goal
- Goals: Lose Weight / Maintain / Gain Muscle
- Calculates personalised daily calorie target using the **Mifflin-St Jeor BMR formula**:
  - Male: `BMR = 10×weight + 6.25×height − 5×age + 5`
  - Female: `BMR = 10×weight + 6.25×height − 5×age − 161`
  - TDEE = BMR × 1.55 (moderate activity)
  - Lose: TDEE − 500 kcal | Maintain: TDEE | Gain: TDEE + 300 kcal
- Macro split: protein ~1.4–1.8g/kg bodyweight, fat ~27% of calories, remaining calories as carbs

### 2. Multi-Profile Support
- Multiple users can create their own profile on the same device
- Netflix-style profile switcher on app open
- Each profile has a unique color-coded avatar
- All data (food logs, goals) is isolated per profile
- Profiles stored in localStorage under `nt-profiles`
- Active profile stored under `nt-active-profile`

### 3. Profile Editing
- Bottom sheet accessible by tapping the avatar in the header
- Edit: name, age, sex, height, weight, goal
- Calorie and macro targets recalculate live as you type
- Option to switch profile or delete profile (deletes all associated data)

### 4. Food Photo Analysis
- Upload a photo by camera, gallery, or drag-and-drop
- Image is compressed client-side (max 1024px, JPEG, quality 0.82) before sending
- AI detects **all individual food items** in the photo separately (e.g. roti, dal, and sabzi as 3 separate entries)
- Each detected item shows:
  - **✎ Edit name** — inline text input to correct AI misidentification
  - **× Remove** — delete the item from the list
  - **Quantity adjuster** — − / input / + in 25g steps
  - Calories and macro breakdown (P/C/F)
- Meal selector: choose which meal to log all items under (auto-selects based on time of day)
- "Add All" button logs all items at once; individual "Add" buttons log one at a time

### 5. Food Search
- Text search for any dish, including Indian dishes
- Returns 1–3 options (different preparations or serving sizes)
- Each result shows serving size, calories, and macros
- Tap a result to open the detail card with serving adjuster and meal selector
- Quick-access chips for popular dishes (Butter Chicken, Dal Makhani, Samosa, etc.)

### 6. Meal Categories
Every food item is tagged with a meal type:

| Meal | Emoji | Auto-selected when |
|------|-------|-------------------|
| Breakfast | 🌅 | Before 10am |
| Lunch | ☀️ | 12pm–3pm |
| Snack | 🍎 | 10am–12pm, 3pm–6pm, after 9pm |
| Pre-Workout | 💪 | 6pm–7pm |
| Post-Workout | 🏋️ | 7pm–9pm |
| Dinner | 🌙 | 6pm–10pm |

### 7. Daily Summary
- Ring chart showing calories consumed vs. target
- Progress bars for protein, carbs, and fat
- "Edit goals" to manually override the calculated targets

### 8. Food Log
- Today's log grouped by meal with per-meal calorie subtotals
- Each entry shows: name, time, serving size, macros, calories
- Remove individual items with ×
- Clear all button

### 9. AI Meal Suggestions
- Appears after the first food is logged (if still under calorie target)
- Detects which meals have already been logged
- Suggests foods only for **remaining meals** of the day
- Suggestions are grouped by meal and distributed proportionally by remaining calorie budget
- Each suggestion shows: name, reason it fits your remaining macros, serving size, nutrition
- "Refresh" to get new suggestions
- One-tap to add any suggestion to your log

### 10. Food History (Calendar)
- Accessible via the **History** tab in the bottom navigation
- Month calendar view with prev/next month navigation
- Days with logged food show a coloured dot:
  - 🟢 Green — reached 90%+ of calorie goal
  - 🟡 Amber — logged something but under 90%
- Tap any past day to see the full food log for that day, grouped by meal

---

## Data Storage (localStorage)

All data lives in the browser's localStorage — no server, no database.

| Key | Contents |
|-----|---------|
| `nt-profiles` | JSON array of all user profiles |
| `nt-active-profile` | ID of the currently active profile |
| `nt-log-{profileId}-YYYY-MM-DD` | Food log for a specific profile and date |
| `nt-goals-{profileId}` | Manual calorie/macro goal override for a profile |

---

## Project Structure

```
Calorie Tracker/
├── api/                        # Vercel serverless functions (production)
│   ├── analyze-image.ts        # Food photo → Groq vision → nutrition array
│   ├── search-food.ts          # Text search → Groq text → nutrition results
│   └── suggest-foods.ts        # Remaining macros → Groq → meal suggestions
├── server/
│   └── index.ts                # Express server (local dev only, mirrors api/)
├── src/
│   ├── components/
│   │   ├── AISuggestions.tsx   # "What to eat next?" section
│   │   ├── FoodLog.tsx         # Today's log grouped by meal
│   │   ├── FoodResult.tsx      # Single item detail: macros, serving, meal picker
│   │   ├── FoodSearch.tsx      # Text search UI
│   │   ├── GoalsModal.tsx      # Manual goal override
│   │   ├── HistoryView.tsx     # Calendar + day detail
│   │   ├── ImageUpload.tsx     # Photo upload, multi-item detection, edit/remove
│   │   ├── NutritionSummary.tsx # Ring + macro bars
│   │   ├── Onboarding.tsx      # 4-step new user flow
│   │   ├── ProfileEdit.tsx     # Edit profile bottom sheet
│   │   ├── ProfileSwitcher.tsx # Profile selection screen
│   │   └── Toast.tsx           # Success/error notifications
│   ├── hooks/
│   │   ├── useFoodLog.ts       # Today's log state + localStorage persistence
│   │   ├── useProfiles.ts      # Multi-profile management + migration
│   │   └── useUserProfile.ts   # calcGoals (BMR formula)
│   ├── services/
│   │   └── aiApi.ts            # Frontend API client (calls /api/* endpoints)
│   ├── types/
│   │   └── index.ts            # All TypeScript types and constants
│   └── App.tsx                 # Root component, routing between views
├── .env                        # GROQ_API_KEY + PORT (not committed to git)
├── .gitignore                  # Excludes .env, node_modules, dist
├── vercel.json                 # Vercel config: build command, serverless functions
├── vite.config.ts              # Vite config: /api proxy to Express in dev
└── package.json
```

---

## How to Run Locally

```bash
# Install dependencies
npm install

# Add your Groq API key
echo "GROQ_API_KEY=your_key_here" >> .env
echo "PORT=3001" >> .env

# Start dev server (frontend + backend together)
npm run dev
```

Get a free Groq API key at: **console.groq.com**

## How to Deploy

```bash
# First time or if token expired:
npx vercel login

# Deploy to production:
npx vercel --prod
```

Make sure `GROQ_API_KEY` is set in the Vercel project dashboard under Settings → Environment Variables.

---

## Known Limitations

- **No cross-device sync** — data is stored in the browser only. Clearing browser data deletes all logs.
- **No real login/logout** — profiles are local only; anyone with browser access can see all profiles. Adding real auth would require a database (Firebase or Supabase recommended).
- **AI nutrition estimates** — values are AI-estimated, not from a verified nutrition database. Use as a guide, not a medical reference.
- **Groq rate limits** — free tier allows 14,400 requests/day and 30 requests/minute. The app may slow down if many users hit it simultaneously.
