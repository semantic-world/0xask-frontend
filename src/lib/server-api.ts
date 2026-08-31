/**
 * The server side API client.
 *
 * Classic pages render on the server, so they talk to the backend directly
 * rather than through the browser proxy. That is what makes the site readable
 * with client JavaScript disabled and understandable to a crawler, which the
 * blueprint treats as a requirement rather than a nice property.
 *
 * This module must never be imported from a client component. It reads
 * BACKEND_ORIGIN, which is a server only value, and importing it into the
 * browser bundle would leak the internal address. The client talks to the
 * same API through the same origin proxy in `api.ts` instead.
 *
 * Nothing here is cached by Next. The backend already caches these responses
 * in Redis and invalidates them the moment the owner publishes or blocks
 * something, and a second cache in front of that would reintroduce exactly the
 * staleness the invalidation exists to remove.
 */

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:8000";

/** How long a server render will wait before giving up on the API. */
const TIMEOUT_MS = 5000;

export class NotPublished extends Error {
  constructor() {
    super("This site is not published.");
    this.name = "NotPublished";
  }
}

export class BackendUnavailable extends Error {
  constructor(cause: string) {
    super(`The API could not be reached: ${cause}`);
    this.name = "BackendUnavailable";
  }
}

async function fetchJson<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BACKEND_ORIGIN}${path}`, {
      headers: { accept: "application/json" },
      // The backend's own cache is the cache. Adding another one here would
      // delay a publish reaching visitors.
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 404) return null;

    if (!response.ok) {
      throw new BackendUnavailable(`status ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof BackendUnavailable) throw error;
    // Next signals control flow, notFound and dynamic rendering among others,
    // by throwing errors that carry a digest. Wrapping one of those would turn
    // a framework instruction into a spurious backend failure.
    if (error && typeof error === "object" && "digest" in error) throw error;

    const reason = error instanceof Error ? error.message : String(error);
    throw new BackendUnavailable(reason);
  } finally {
    clearTimeout(timer);
  }
}

export type SiteStatus = {
  published: boolean;
  ask_enabled: boolean;
  ask_available: boolean;
  projects: number;
  answerable_claims: number;
};

export type Link = { kind: string; label: string; url: string };

export type Profile = {
  full_name: string;
  handle: string | null;
  headline: string;
  statement: string | null;
  summary: string;
  bio: string | null;
  location: string | null;
  availability: string | null;
  avatar_url: string | null;
  links: Link[];
};

export type ProjectCard = {
  slug: string;
  name: string;
  tagline: string | null;
  summary: string | null;
  category: string;
  technologies: string[];
  is_featured: boolean;
  is_open_source: boolean;
  license: string | null;
  published_at: string | null;
};

export type Media = {
  kind: string;
  url: string;
  alt_text: string;
  width: number | null;
  height: number | null;
};

export type ProjectDetail = ProjectCard & {
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
  media: Media[];
};

export type Evidence = {
  project_slug: string | null;
  project_name: string | null;
  note: string | null;
  strength: string;
};

export type Skill = {
  slug: string;
  name: string;
  category: string;
  summary: string | null;
  years_of_use: number | null;
  is_featured: boolean;
  evidence: Evidence[];
};

export type SkillGroup = { category: string; skills: Skill[] };

export type LinkedProject = {
  slug: string;
  name: string;
  tagline: string | null;
};

export type Experience = {
  role: string;
  organization_name: string | null;
  kind: string;
  location: string | null;
  started_on: string;
  ended_on: string | null;
  is_current: boolean;
  summary: string | null;
  highlights: string[];
  technologies: string[];
  projects: LinkedProject[];
};

export type Education = {
  institution: string;
  qualification: string;
  field_of_study: string | null;
  result: string | null;
  location: string | null;
  completed_on: string | null;
  summary: string | null;
};

export type Certification = {
  name: string;
  issuer: string;
  credential_url: string | null;
  issued_on: string | null;
  topics: string[];
  is_featured: boolean;
};

export type Credentials = {
  education: Education[];
  certifications: Certification[];
};

export type Resume = {
  variant: string;
  generated_at: string;
  profile: Profile;
  headline: string;
  statement: string | null;
  summary: string;
  experience: Experience[];
  projects: ProjectCard[];
  skills: SkillGroup[];
  education: Education[];
  certifications: Certification[];
};

/**
 * Whether the site serves anything at all.
 *
 * Answers even when unpublished, because the layout has to know what to render
 * before it knows whether there is anything to render. Failure is treated as
 * unpublished so a backend outage shows an honest empty state rather than a
 * stack trace.
 */
export async function getStatus(): Promise<SiteStatus> {
  try {
    const status = await fetchJson<SiteStatus>("/api/v1/status");
    return (
      status ?? {
        published: false,
        ask_enabled: false,
        ask_available: false,
        projects: 0,
        answerable_claims: 0,
      }
    );
  } catch {
    return {
      published: false,
      ask_enabled: false,
      ask_available: false,
      projects: 0,
      answerable_claims: 0,
    };
  }
}

/** Throws NotPublished when the surface is off, so pages can render one state. */
async function published<T>(path: string): Promise<T> {
  const value = await fetchJson<T>(path);
  if (value === null) throw new NotPublished();
  return value;
}

export const getProfile = () => published<Profile>("/api/v1/profile");
export const getProjects = () => published<ProjectCard[]>("/api/v1/projects");
export const getSkills = () => published<SkillGroup[]>("/api/v1/skills");
export const getExperience = () => published<Experience[]>("/api/v1/experience");
export const getCredentials = () => published<Credentials>("/api/v1/credentials");
export const getResume = (variant = "general") => published<Resume>(`/api/v1/resume/${variant}`);

/** Null rather than throwing, so a page can render its own not found. */
export const getProject = (slug: string) =>
  fetchJson<ProjectDetail>(`/api/v1/projects/${encodeURIComponent(slug)}`);
