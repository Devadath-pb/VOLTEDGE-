# Voltedge — Battery Intelligence Platform

Live battery health monitoring, ML-powered SOH prediction and second-life battery reuse recommendations.

Frontend: **React (Vite) · JavaScript · Tailwind CSS · Recharts · Lucide React · React Router · Axios · WebSocket · Framer Motion**

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional — demo mode works out of the box)
cp .env.example .env

# 3. Run the development server
npm run dev
```

Open http://localhost:5173

> **No backend configured?** The app boots in clearly-labelled **demo mode** with structured mock
> data, a persistent DEMO badge and simulated live charts. Nothing is presented as real live battery data.

## Environment variables

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | FastAPI REST base URL, e.g. `http://localhost:8000` |
| `VITE_WS_URL` | WebSocket endpoint for live readings, e.g. `ws://localhost:8000/ws/battery` |
| `VITE_FORCE_DEMO` | `true` forces demo mode even when a backend URL is set |

## Backend API contract

REST (prefix `VITE_API_BASE_URL`):

```
GET /api/battery/live
GET /api/battery/status
GET /api/battery/history
GET /api/analytics/soh
GET /api/analytics/trends
GET /api/analytics/model-metrics
GET /api/reuse/recommendations
GET /api/reuse/details/{id}
GET /api/settings
```

WebSocket: `/ws/battery` — pushes JSON readings:
`{ timestamp, voltage, current, temperature, soc, soh, cycleCount, state }`
(`state` ∈ `charging | discharging | idle`)

### `/api/analytics/soh` payload shape

```json
{
  "predictedSoh": 87.4,
  "predictedCapacityAh": 87.4,
  "ratedCapacityAh": 100,
  "timestamp": "2026-11-11T09:00:00Z",
  "model": "GradientBoosting-SOH v2.3",
  "uncertainty": null,
  "pipeline": { "collection": "complete", "preprocessing": "complete",
                "featureExtraction": "complete", "inference": "complete", "updated": true },
  "metrics": { "mae": 1.82, "rmse": 2.41, "r2": 0.943 },
  "degradation": [{ "cycle": 0, "soh": 100, "predicted": 100 }],
  "actualVsPredicted": [{ "cycle": 0, "actual": 92.1, "predicted": 91.6 }],
  "forecast": [{ "cycle": 352, "soh": 86.2 }],
  "featureImportance": [{ "feature": "Charge throughput (Ah)", "importance": 0.31 }]
}
```

Omit `uncertainty` unless the model is calibrated; omit `actualVsPredicted` without reference
measurements; omit `forecast` without a forecasting model. The UI renders honest empty states.

## Project structure

```
src/
  assets/
  components/
    layout/Layout.jsx
    navigation/Navbar.jsx, MobileNavigation.jsx
    cards/MetricCard.jsx
    charts/LiveLineChart.jsx, HistoricalChart.jsx
    battery/BatteryVisualization.jsx, SOHGauge.jsx
    recommendations/RecommendationCard.jsx
    common/GlassCard, PageHeader, states, DataTable, DateRangeFilter, Toasts, ConnectionIndicator
  pages/ Home, Dashboard, Analytics, Reuse, History, Settings
  hooks/ useBatteryLiveData, useBatteryStatus, useSOHPrediction,
         useReuseRecommendations, useBatteryHistory
  services/ api.js (axios), websocket.js
  context/ AppContext.jsx (demo mode, connection, toasts, settings)
  utils/ format.js, demoData.js
  App.jsx, main.jsx, index.css
```

## Pages

| Route | Page |
|---|---|
| `/` | Landing — hero, features, overview metrics |
| `/dashboard` | Live monitoring — WebSocket charts, connection/disconnection states |
| `/analytics` | Automatic ML SOH prediction — gauge, pipeline status, trends, model metrics |
| `/reuse` | Second-life application recommendations with safety assessment |
| `/history` | Historical readings, filters, statistics, CSV/PDF export |
| `/settings` | Vertical menu: general, device, model, notifications, display, about |

## Safety notes

- Reuse recommendations are never based on SOH alone; physical inspection status is always shown.
- Demo data is always labelled and never presented as live measurements.
- Model metrics, uncertainty and forecast sections only render when the backend supplies them.
