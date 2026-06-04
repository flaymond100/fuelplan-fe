// ── DB row types (snake_case, mirrors Supabase schema) ──────────────────────

export type Discipline = 'cycling';
export type Sex = 'female' | 'male' | 'other' | 'prefer_not_to_say';
export type SweatRate = 'low' | 'medium' | 'high';
export type CaffeineTolerance = 'none' | 'low' | 'high';
export type FuelForm = 'gels' | 'chews' | 'bars' | 'drink_mix' | 'real_food';
export type Diet = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';
export type Restriction = 'gluten' | 'dairy' | 'nuts' | 'soy' | 'eggs' | 'shellfish';

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  weight_kg: number | null;
  birth_date: string | null;
  sex: Sex | null;
  height_cm: number | null;
  disciplines: Discipline[];
  ftp_watts: number | null;
  running_threshold_sec_per_km: number | null;
  max_hr: number | null;
  weekly_training_hours: number | null;
  sweat_rate: SweatRate | null;
  max_carbs_g_hr: number | null;
  caffeine_tolerance: CaffeineTolerance | null;
  fuel_forms: FuelForm[];
  diet: Diet | null;
  restrictions: Restriction[];
  restrictions_other: string | null;
  avoid_notes: string | null;
  supplements: string[] | null;
  created_at: string;
}

// ── plan_json schema (see decisions/0003-plan-json-schema.md) ───────────────

export type PlanPhaseId =
  | 'pre_race_d3'
  | 'pre_race_d2'
  | 'pre_race_d1'
  | 'pre_race_morning'
  | 'race'
  | 'recovery';

export interface PlanNutrientTotals {
  carbsG: number;
  fluidsMl: number;
  sodiumMg: number;
  caffeineMg: number;
  kcal: number;
}

// Additive fields (decision 0004) — all optional, schemaVersion stays 1.
export type PlanItemKind = 'meal' | 'snack' | 'fuel' | 'supplement' | 'hydration' | 'action';
export type MacroTone = 'default' | 'green' | 'amber' | 'red';
export type AlertSeverity = 'info' | 'success' | 'warning' | 'danger';

export interface PlanMacroChip {
  label: string;
  tone?: MacroTone;
}

export interface PlanAlert {
  severity: AlertSeverity;
  title: string;
  body: string;
}

export interface PlanItem extends PlanNutrientTotals {
  offsetMin: number;
  label: string;
  what: string;
  // Backend persists macros as fatG / proteinG (see planGenerator.ts validateItem),
  // which diverges from decision 0003's "fat"/"protein". Matching deployed reality.
  fatG: number;
  proteinG: number;
  notes: string | null;
  kind?: PlanItemKind;
  detail?: string;
}

export interface PlanPhase {
  id: PlanPhaseId;
  label: string;
  startOffsetMin: number;
  endOffsetMin: number;
  totals: PlanNutrientTotals;
  items: PlanItem[];
  macros?: PlanMacroChip[];
}

export interface PlanJson {
  schemaVersion: number;
  summary: string;
  estimatedDurationMin: number;
  totals: PlanNutrientTotals;
  phases: PlanPhase[];
  warnings: string[];
  alerts?: PlanAlert[];
}

export interface PlanRequestParams {
  discipline?: string;
  effortLevel?: string;
  targetFinishTime?: string;
  aidStations?: string;
  planWindow?: '24h' | '48h' | '72h';
  carbsOverride?: number | null;
  caffeine?: string;
  weather?: {
    tempMaxC: number;
    tempMinC: number;
    precipitationProbabilityPct: number;
    windSpeedMaxKmh: number;
    weatherCode: number;
  } | null;
  gpxMeta?: { startLat: number; startLng: number; pointCount: number };
}

export interface PlanRow {
  id: string;
  user_id: string;
  race_name: string | null;
  race_date: string | null;
  distance_km: number | null;
  elevation_m: number | null;
  start_time: string | null;
  gpx_file_path: string | null;
  plan_json: PlanJson;
  request_params: PlanRequestParams;
  created_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_sub_id: string | null;
  plan: 'free' | 'pro' | 'pay_per_plan';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end: string | null;
  updated_at: string;
}

export interface PlanCreditsRow {
  id: string;
  user_id: string;
  credits: number;
  used_this_month: number;
  reset_at: string | null;
  updated_at: string;
}

// ── Domain types (camelCase) ──────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string | null;
  fullName: string | null;
  weightKg: number | null;
  birthDate: string | null;
  sex: Sex | null;
  heightCm: number | null;
  disciplines: Discipline[];
  ftpWatts: number | null;
  runningThresholdSecPerKm: number | null;
  maxHr: number | null;
  weeklyTrainingHours: number | null;
  sweatRate: SweatRate | null;
  maxCarbsGHr: number | null;
  caffeineTolerance: CaffeineTolerance | null;
  fuelForms: FuelForm[];
  diet: Diet | null;
  restrictions: Restriction[];
  restrictionsOther: string | null;
  avoidNotes: string | null;
  supplements: string[];
}

export interface Plan {
  id: string;
  raceName: string | null;
  raceDate: string | null;
  distanceKm: number | null;
  elevationM: number | null;
  startTime: string | null;
  gpxFilePath: string | null;
  planJson: Record<string, unknown>;
  createdAt: string;
}
