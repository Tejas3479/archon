import { atom } from "jotai";

// WHY: Event/Intent interface definitions to type-safe the frontend state
export interface Intent {
  id: string;
  domain: string;
  action: string;
  confidence: number;
  parameters: Record<string, any>;
  status: "pending" | "approved" | "ignored" | "executed";
}

// WHY: Global user public identity key
export const identityAtom = atom<string | null>(null);

// WHY: Derived vault key state (kept in JS memory during active session, never persisted plaintext)
export const vaultKeyAtom = atom<string | null>(null);

// WHY: List of pending proactive task intents fetched from events
export const intentsAtom = atom<Intent[]>([]);

// WHY: Attention budget settings (quiet: batch notifications, active: interrupt immediately)
export const attentionModeAtom = atom<"quiet" | "active">("quiet");

// WHY: User style preference weights tracked in real-time
export const preferencesAtom = atom<Record<string, number>>({
  tone_casual: 0.5,
  risk_averse: 0.5,
  diet_vegan: 0.0,
});

// WHY: Chronological execution logs and self-healing repair events for ANNEAL
export const annealLogsAtom = atom<string[]>([]);

// WHY: Current predicted on-device interrupt probability
export const attentionScoreAtom = atom<number>(0.0);

// WHY: Exposes attention probability explicitly to consumer components
export const attentionProbabilityAtom = atom<number>(0.0);

// WHY: Holds the most recent graph delta generated during self-healing
export const lastAnnealDeltaAtom = atom<any | null>(null);

// Swarm connections and family members
export interface SwarmPeer {
  peerId: string;
  name: string;
  established: boolean;
  capabilities: string[];
}
export const familyMembersAtom = atom<SwarmPeer[]>([]);

// Health stats and anomalies
export interface HealthMetric {
  heartRates: number[];
  averageRate: number;
  anomalyDetected: boolean;
  message: string;
}
export const healthMetricsAtom = atom<HealthMetric | null>(null);

// Financial statements and detected subscriptions
export interface FinanceStatement {
  transactions: { merchant: string; amount: number; category: string }[];
  subscriptions: { merchant: string; amount: number; frequency: string }[];
  suggestions: string[];
}
export const financeStatementAtom = atom<FinanceStatement | null>(null);

// Verifiable credentials wallet
export interface VCRecord {
  id: string;
  issuer: string;
  credential_subject: any;
  proof: any;
}
export const verifiableCredentialsAtom = atom<VCRecord[]>([]);

// Voice Dialogue Logs structure
export interface VoiceLogEntry {
  speaker: "user" | "archon";
  text: string;
}
export const voiceLogsAtom = atom<VoiceLogEntry[]>([]);
export const awaitingVoiceParamAtom = atom<string | null>(null);

// Spatial Scene description
export interface SpatialWidget {
  id: string;
  title: string;
  detail: string;
  position: [number, number, number];
}
export interface SpatialScene {
  orb_color: string;
  orb_pulse_rate: number;
  camera_fov: number;
  widgets: SpatialWidget[];
  animation_trigger: string | null;
}
export const spatialSceneAtom = atom<SpatialScene | null>(null);

// Travel Concierge state
export interface TravelState {
  flights: { flight_no: string; airline: string; price: number; destination: string }[];
  priceAlerts: string[];
  checkins: { booking_reference: string; seat: string; boarding_pass_url: string }[];
}
export const travelStateAtom = atom<TravelState>({
  flights: [],
  priceAlerts: [],
  checkins: [],
});

// Self Reflection reports
export interface ReflectionReport {
  actions_count: number;
  time_saved_minutes: number;
  money_saved_dollars: number;
  self_healing_count: number;
  total_finops_cost_cents: number;
  health_score: number;
  message: string;
}
export const reflectionReportAtom = atom<ReflectionReport | null>(null);

// Deployment records for RSI Coordinator
export interface DeploymentRecord {
  delta_id: string;
  status: string; // "Applied" | "FlaggedForHumanReview" | "Rejected"
  risk_score: number;
  timestamp: string;
  reason: string;
}
export const deploymentJournalAtom = atom<DeploymentRecord[]>([]);

// DeFi Portfolio
export interface DeFiSuggestion {
  should_swap: boolean;
  from: string;
  to: string;
  amount: number;
  rate: number;
  risk_score: number;
  message: string;
}
export interface DeFiPortfolio {
  eth: number;
  usdc: number;
  usdt: number;
  total_usd: number;
  swapSuggestions: DeFiSuggestion[];
}
export const defiPortfolioAtom = atom<DeFiPortfolio>({
  eth: 1.45,
  usdc: 650.00,
  usdt: 150.00,
  total_usd: 5725.00,
  swapSuggestions: [],
});

// Deepfake forensic alerts
export interface DeepfakeAlert {
  media_url: string;
  media_hash: string;
  confidence: number;
  timestamp: string;
}
export const deepfakeAlertsAtom = atom<DeepfakeAlert[]>([]);

// Enterprise Organization & SSO State
export interface Organization {
  id: string;
  name: string;
  plan: string;
}
export interface TeamMember {
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
}
export const organizationAtom = atom<Organization | null>({ id: "org_123", name: "Archon Enterprise", plan: "enterprise" });
export const teamMembersAtom = atom<TeamMember[]>([
  { userId: "user_admin", role: "admin" },
  { userId: "user_member_1", role: "member" }
]);
export const ssoTokenAtom = atom<string | null>(null);




