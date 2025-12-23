# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SmartKPI Audit AI is a React-based web application that automates KPI (Key Performance Indicator) analysis for employee performance reviews. It processes Excel files containing KPI data, uses Google's Gemini AI to analyze and score performance, and generates interactive dashboards with visual insights.

## Development Commands

### Setup
```bash
npm install
```

Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key before running.

### Run Development Server
```bash
npm run dev
```
Starts the Vite dev server on port 3000 (configured in [vite.config.ts](vite.config.ts#L9)).

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Architecture Overview

### Application Flow

1. **Excel Upload** ([FileUpload.tsx](components/FileUpload.tsx))
   - User uploads .xlsx/.xls file
   - File is parsed client-side using `xlsx` library ([excelService.ts](services/excelService.ts))
   - Excel data is converted to CSV-like text representation

2. **AI Analysis** ([geminiService.ts](services/geminiService.ts))
   - Parsed data sent to Google Gemini API (`gemini-2.5-flash` model)
   - AI performs intelligent parsing (handles flexible table structures)
   - Calculates weighted KPI scores and assigns performance statuses
   - Generates natural language insights in English or Chinese
   - Uses structured JSON schema for type-safe responses

3. **Results Display** ([Dashboard.tsx](components/Dashboard.tsx))
   - Interactive dashboard with charts (using Recharts)
   - Detailed employee performance tables
   - PDF export functionality (html2canvas + jsPDF)

4. **Data Persistence** ([storage.ts](utils/storage.ts))
   - Analysis results saved to browser localStorage
   - History limited to 50 most recent analyses
   - No server-side storage

### View Management

The app uses a view-based routing system managed in [App.tsx](App.tsx) with the following views:

- `landing` - Marketing homepage with feature descriptions
- `upload` - Dedicated Excel file upload screen
- `dashboard` - Analysis results and visualizations
- `history` - Previous analysis results from localStorage
- `settings` - Language preferences and app info

Navigation between views is handled through `currentView` state in App.tsx, not React Router.

### Internationalization (i18n)

Bilingual support (English/Chinese) is implemented in [utils/i18n.ts](utils/i18n.ts):
- Single `translations` object with `en` and `zh` keys
- Language state managed globally in App.tsx
- AI-generated content (summaries, comments) adapts to selected language
- Status enums (`Excellent`, `Good`, `Average`, `Poor`) remain in English internally

### Type System

Core types are defined in [types.ts](types.ts):
- `KPIAnalysisResult` - Complete analysis output structure
- `EmployeeKPI` - Individual employee performance data
- `KPIMetric` - Single metric with score and AI commentary
- `KPIStatus` - Enum for performance ratings
- `Language` - Type-safe language selection (`'en' | 'zh'`)
- `View` - Valid application views

### Environment Variables

Configured in [vite.config.ts](vite.config.ts#L13-L16):
- `GEMINI_API_KEY` from `.env.local` is exposed as `process.env.API_KEY`
- Both `process.env.API_KEY` and `process.env.GEMINI_API_KEY` are defined for flexibility

## Key Technical Patterns

### AI Integration Strategy

The Gemini API call uses:
- **Structured output with JSON schema** - Ensures type-safe, predictable responses
- **Low temperature (0.2)** - For consistent numerical calculations
- **Flexible parsing logic** - AI infers column meanings when headers vary
- **Weighted scoring calculation** - Handles missing scores with intelligent defaults

### Component Structure

Components are organized by responsibility:
- **Header** - Navigation and language switcher
- **FileUpload** - Drag-and-drop Excel upload with template download
- **Dashboard** - Main results view with charts and export
- **KPITable** - Sortable employee performance table
- **HistoryView** - Saved analyses from localStorage
- **SettingsView** - App configuration and privacy info
- **LandingPage** - Marketing content and feature highlights

### State Management

No external state library - all state managed via React hooks in App.tsx:
- File upload processing state
- Current view navigation
- Analysis results
- Error handling
- Language preference

### Styling

Uses utility-first CSS (Tailwind-like classes) with:
- Custom color scheme (indigo primary, slate neutrals)
- Responsive breakpoints (sm, md, lg)
- Animation utilities (`animate-in`, `fade-in`, `slide-in-from-bottom-4`)
- Status-based color mapping for KPI ratings

## Important Implementation Notes

1. **Excel Template Generation** - The [downloadTemplate](services/excelService.ts#L40-L127) function creates localized example files with proper structure

2. **PDF Export** - Uses html2canvas to capture dashboard visuals with multi-page support for long reports. Elements with class `no-export` are excluded from PDF.

3. **Data Privacy** - All processing happens client-side or via direct Gemini API calls. No backend server stores user files.

4. **Performance Status Logic** - Based on total score:
   - Excellent: >90
   - Good: >75
   - Average: >60
   - Poor: ≤60

5. **Metric Score Calculation** - When individual scores are missing, AI uses formula: `(Actual / Target) * 100`, capped intelligently based on context.

## Common Modifications

### Adding New Language
1. Add new language key to `Language` type in [types.ts](types.ts#L8)
2. Add translations object in [utils/i18n.ts](utils/i18n.ts)
3. Update language selector in SettingsView

### Modifying AI Prompt
Edit the prompt in [geminiService.ts](services/geminiService.ts#L61-L78) and adjust the schema if response structure changes.

### Changing Scoring Thresholds
Update status assignment logic in the AI prompt instructions and update the Performance Status Logic section above.

### Adding New Chart Types
Import from Recharts in Dashboard.tsx and add to the charts section around line 179.
