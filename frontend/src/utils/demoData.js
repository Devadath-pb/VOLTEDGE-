// Structured demo data for Voltedge.
// Clearly labelled DEMO — never presented as real live measurements.

const now = () => new Date().toISOString()

// Deterministic-ish pseudo random walk
let seed = 42
const rand = () => {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

export function makeLiveReading(t = Date.now()) {
  const base = {
    timestamp: new Date(t).toISOString(),
    voltage: 51.2 + (rand() - 0.5) * 1.6,          // V (13s pack ~ 48V nominal)
    current: 8 + (rand() - 0.5) * 6,              // A discharge
    temperature: 29 + (rand() - 0.5) * 6,         // °C
    soc: 78 + (rand() - 0.5) * 4,
    soh: 87.4 + (rand() - 0.5) * 0.8,
    cycleCount: 312,
    state: rand() > 0.5 ? 'discharging' : 'idle',
  }
  return base
}

export function makeLiveSeries(points = 40, intervalMs = 2000) {
  const t0 = Date.now() - points * intervalMs
  return Array.from({ length: points }, (_, i) => makeLiveReading(t0 + i * intervalMs))
}

export function makeSOHPrediction() {
  return {
    predictedSoh: 87.4,
    predictedCapacityAh: 87.4, // % of 100 Ah rated
    ratedCapacityAh: 100,
    timestamp: now(),
    model: 'GradientBoosting-SOH v2.3',
    category: 'Good',
    // Uncertainty omitted on purpose unless calibrated backend supplies it.
    pipeline: {
      collection: 'complete',
      preprocessing: 'complete',
      featureExtraction: 'complete',
      inference: 'complete',
      updated: true,
    },
    metrics: { mae: 1.82, rmse: 2.41, r2: 0.943 },
    degradation: Array.from({ length: 313 }, (_, c) => ({
      cycle: c,
      soh: c === 0 ? 100 : Math.max(60, 100 - 0.042 * c - 0.000045 * c * c + (rand() - 0.5) * 0.6),
      predicted: Math.max(58, 100 - 0.043 * c - 0.000048 * c * c),
    })),
    actualVsPredicted: Array.from({ length: 24 }, (_, i) => {
      const actual = 92 - i * 0.28 + (rand() - 0.5) * 0.5
      return {
        cycle: i * 13,
        actual,
        predicted: actual + (rand() - 0.5) * 1.8,
      }
    }),
    forecast: Array.from({ length: 24 }, (_, i) => {
      const c = 312 + i * 40
      return {
        cycle: c,
        soh: i === 0 ? 87.4 : Math.max(55, 87.4 - i * 1.15),
        kind: 'forecast',
      }
    }),
    featureImportance: [
      { feature: 'Charge throughput (Ah)', importance: 0.31 },
      { feature: 'Cycle count', importance: 0.24 },
      { feature: 'Avg discharge voltage', importance: 0.16 },
      { feature: 'Temperature integral', importance: 0.13 },
      { feature: 'Internal resistance Δ', importance: 0.10 },
      { feature: 'Rest voltage recovery', importance: 0.06 },
    ],
  }
}

export function makeReuseRecommendations() {
  return [
    {
      id: 'solar-storage',
      name: 'Solar Energy Storage',
      score: 0.91,
      category: 'Best Match',
      icon: 'Sun',
      summary:
        'Moderate C-rate duty and shallow daily cycling make rooftop solar storage the strongest fit for this pack’s remaining capacity and thermal profile.',
      explanation:
        'Recommended because predicted SOH (87.4%), remaining capacity (~87 Ah), stable discharge voltage and mild operating temperatures align with solar storage duty cycles, which typically demand 0.2–0.5C and tolerate gradual capacity fade.',
      supporting: ['SOH 87.4% (Good)', 'Remaining capacity ≈ 87 Ah', 'Low internal resistance drift', 'Stable thermal behaviour'],
      advantages: ['Shallow cycling extends second-life calendar time', 'Predictable daily charge/discharge windows', 'High round-trip value at this SOH band'],
      limitations: ['Capacity will continue to fade ~1–2% per 100 cycles', 'Requires BMS re-balancing before deployment'],
      conditions: ['Ambient 10–35 °C', 'Charge 0.3C max', 'SOC window 20–90%', 'Annual capacity test'],
      safety: {
        status: 'conditional',
        note: 'Electrical and thermal screening passed. Physical cell inspection (swelling, terminal corrosion) is still required before reuse — additional testing is required before a final safety sign-off.',
      },
    },
    {
      id: 'home-backup',
      name: 'Home Backup Power',
      score: 0.78,
      category: 'Alternative',
      icon: 'Home',
      summary: 'Occasional deep discharge duty suits this pack, though capacity fade shortens backup runtime.',
      explanation:
        'Backup duty is intermittent, so the cycle-life penalty is small; however, deep discharge events accelerate fade given the current capacity estimate.',
      supporting: ['Good voltage stability under load', 'Low average operating temperature'],
      advantages: ['Infrequent cycling preserves residual life', 'Simple integration with inverters'],
      limitations: ['Reduced runtime vs. a new pack', 'Deep discharges below 20% SOH accelerate degradation'],
      conditions: ['Keep SOC ≥ 20% under outage load', 'Indoor installation', 'Annual inspection'],
      safety: {
        status: 'conditional',
        note: 'Requires physical inspection and a load-bank test before installation. Recommendation is based on predicted SOH plus electrical screening only.',
      },
    },
    {
      id: 'industrial-storage',
      name: 'Industrial Energy Storage',
      score: 0.52,
      category: 'Not Recommended',
      icon: 'Factory',
      summary: 'Higher C-rate and continuous duty exceed this pack’s remaining capability.',
      explanation:
        'Industrial duty demands sustained currents and long daily cycles that this pack’s internal resistance trend and capacity fade would not sustain economically.',
      supporting: ['Cycle count 312 with visible fade'],
      advantages: ['—'],
      limitations: ['High C-rate duty exceeds safe operating window', 'Accelerated degradation and thermal risk'],
      conditions: ['Not advised without cell-level refurbishment'],
      safety: {
        status: 'insufficient',
        note: 'Not recommended at current health. Full cell-level testing would be required before any industrial reuse consideration.',
      },
    },
    {
      id: 'low-power-mobility',
      name: 'Low-Power Electric Mobility',
      score: 0.44,
      category: 'Not Recommended',
      icon: 'Bike',
      summary: 'Dynamic load and vibration environment raise safety and performance concerns.',
      explanation:
        'Mobility duty couples vibration, high peak currents and less controlled thermal environments — a poor match for a second-life pack of this age.',
      supporting: ['Cycle history shows varied load profiles'],
      advantages: ['—'],
      limitations: ['Peak current demands above safe envelope', 'Regulatory and insurance constraints for reused packs in mobility'],
      conditions: ['Not advised without full recertification'],
      safety: {
        status: 'insufficient',
        note: 'Safety measurements for mobility duty are unavailable — additional testing is required before any reuse decision.',
      },
    },
  ]
}

export function makeHistory(days = 14) {
  const rows = []
  const t0 = Date.now() - days * 24 * 3600 * 1000
  for (let i = 0; i < days * 8; i++) {
    const t = t0 + i * 3 * 3600 * 1000
    const cycle = Math.round(280 + (i / (days * 8)) * 32)
    const soh = Math.max(60, 100 - 0.042 * cycle - 0.000045 * cycle * cycle)
    rows.push({
      id: i,
      timestamp: new Date(t).toISOString(),
      voltage: 51.2 + (rand() - 0.5) * 1.6,
      current: 8 + (rand() - 0.5) * 6,
      temperature: 29 + (rand() - 0.5) * 6,
      soc: 60 + rand() * 35,
      cycle,
      predictedSoh: soh + (rand() - 0.5) * 0.6,
    })
  }
  return rows
}
