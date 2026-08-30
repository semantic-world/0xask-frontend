/** Shapes the admin console reads from the API. */

export type VisibilityLevel = "PUBLIC" | "PORTFOLIO" | "RESTRICTED" | "PRIVATE" | "SECRET";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUPERSEDED";
export type ProjectStatus =
  | "DISCOVERED"
  | "ANALYZED"
  | "DRAFT"
  | "REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "BLOCKED";

export type Page<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  is_owner: boolean;
  last_login_at: string | null;
};

export type Session = {
  user: AdminUser;
  expires_at: string;
  absolute_expires_at: string;
};

export type Dashboard = {
  profile_name: string | null;
  projects: Record<string, number>;
  knowledge: {
    by_status: Record<string, number>;
    by_visibility: Record<string, number>;
    pending_review: number;
  };
  repositories: Record<string, number>;
  sources: Record<string, number>;
  jobs: Record<string, number>;
  github_connected: boolean;
  github_login: string | null;
  last_sync_at: string | null;
  next_sync_at: string | null;
  site_published: boolean;
  ask_enabled: boolean;
};

export type Disclosure = {
  knowledge_by_visibility: Record<string, number>;
  approved_public: number;
  restricted: number;
  blocked: number;
  secrets_detected: number;
  redacted_sources: number;
  private_repositories: number;
  repositories_allowed_to_disclose: number;
  last_security_scan_at: string | null;
};

export type ProjectSummary = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  category: string;
  status: ProjectStatus;
  visibility: VisibilityLevel;
  approval_status: ApprovalStatus;
  is_featured: boolean;
  sort_order: number;
  technologies: string[];
  published_at: string | null;
  updated_at: string;
};

export type Project = ProjectSummary & {
  summary: string | null;
  role: string | null;
  why_it_exists: string | null;
  what_was_built: string | null;
  architecture: string | null;
  contribution: string | null;
  engineering_challenges: string | null;
  result_impact: string | null;
  lessons: string | null;
  repository_url: string | null;
  documentation_url: string | null;
  demo_url: string | null;
  started_on: string | null;
  ended_on: string | null;
  blocked_reason: string | null;
};

export type KnowledgeItem = {
  id: string;
  kind: string;
  subject_type: string;
  subject_id: string | null;
  statement: string;
  detail?: string | null;
  visibility: VisibilityLevel;
  approval_status: ApprovalStatus;
  suggested_visibility: VisibilityLevel | null;
  confidence: string;
  source_id: string | null;
  current_version: number;
  approved_at: string | null;
  created_at: string;
};

export type Source = {
  id: string;
  kind: string;
  title: string;
  uri: string | null;
  repository_id: string | null;
  visibility: VisibilityLevel;
  was_redacted: boolean;
  byte_size: number | null;
  collected_at: string | null;
  created_at: string;
};

export type Policy = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  scope: string;
  decision: "ALLOW" | "RESTRICT" | "BLOCK";
  default_visibility: VisibilityLevel | null;
  conditions: Record<string, unknown>;
  priority: number;
  is_active: boolean;
  is_system: boolean;
};

export type Setting = {
  key: string;
  value: { value: unknown };
  description: string | null;
  updated_at: string;
};

export type AuditEntry = {
  id: string;
  created_at: string;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string | null;
  status_code: number | null;
};

export type Job = {
  id: string;
  kind: string;
  state: string;
  attempts: number;
  max_attempts: number;
  run_at: string;
  finished_at: string | null;
  last_error: string | null;
  result: Record<string, unknown> | null;
};

export type JobSummary = {
  counts: Record<string, number>;
  registered_kinds: string[];
  recent: Job[];
};

export type Repository = {
  id: string;
  full_name: string;
  name: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE" | "INTERNAL";
  is_fork: boolean;
  is_archived: boolean;
  primary_language: string | null;
  topics: string[];
  stars: number;
  html_url: string | null;
  pushed_at: string | null;
  last_synced_at: string | null;
  last_synced_commit: string | null;
  analysis_version: number;
  is_tracked: boolean;
  disclosure_allowed: boolean;
  exclusion_reason: string | null;
  secrets_detected: number;
};

export type SyncRun = {
  id: string;
  trigger: string;
  outcome: string;
  started_at: string;
  finished_at: string | null;
  accounts_discovered: number;
  repositories_discovered: number;
  repositories_changed: number;
  repositories_analyzed: number;
  repositories_skipped: number;
  knowledge_created: number;
  knowledge_updated: number;
  secrets_detected: number;
  error: string | null;
};

export type GithubStatus = {
  connected: boolean;
  login: string | null;
  token_hint: string | null;
  connected_at: string | null;
  last_used_at: string | null;
  accounts: number;
  repositories: number;
  tracked_repositories: number;
  private_repositories: number;
  last_sync: SyncRun | null;
  next_scheduled_sync_at: string | null;
  rate_limit_remaining: number | null;
};
