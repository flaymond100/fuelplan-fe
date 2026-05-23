// ── DB row types (snake_case, mirrors Supabase schema) ──────────────────────

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  weight_kg: number | null;
  sport: 'cycling' | 'running' | null;
  supplements: string[] | null;
  created_at: string;
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
  plan_json: Record<string, unknown>;
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
  sport: 'cycling' | 'running' | null;
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
