export type ID = string;

export interface Company {
  id: ID;
  name: string;
  logoUrl?: string;
  logo?: string;
  coverUrl?: string;
  industry: string;
  description: string;
  employeesCount?: number;
  alumniCount?: number;
  color?: string; // brand color for accents
  isFecapPartner?: boolean;
  partnershipType?: "institutional" | "recruitment" | "academic";
  recommendationBoost?: number;
  partnerSince?: number;
  tags?: string[];
}

export interface StoryItem {
  id: ID;
  companyId: ID;
  mediaUrl: string;
  type: "job" | "event" | "hackathon" | "challenge" | "trainee" | "internship";
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  createdAt: string; // ISO
  expiresAt: string; // ISO (24h later)
}

export interface FeedPost {
  id: ID;
  companyId: ID;
  kind: "job_opened" | "hackathon" | "event" | "challenge" | "article";
  title: string;
  body: string;
  imageUrl?: string;
  createdAt: string;
  reactions: number;
  comments: number;
}

export interface JobOpportunity {
  id: ID;
  companyId: ID;
  title: string;
  seniority: "estagio" | "trainee" | "junior" | "pleno" | "senior";
  salary: string;
  workModel: "remoto" | "hibrido" | "presencial";
  location: string;
  skills: string[];
  description: string;
  benefits: string[];
  matchScore: number; // 0-100
  postedAt: string;
}

export interface UserBadge {
  id: ID;
  label: string;
  icon: string; // Ionicons name
  earnedAt: string;
}

export interface UserProfile {
  id: ID;
  name: string;
  handle: string;
  avatarUrl: string;
  course: string;
  semester: number;
  bio: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  skills: string[];
  languages: string[];
  companyDesired?: ID;
  companyCurrent?: ID;
  role?: "student" | "alumni" | "professor" | "recruiter";
  xp: number;
  level: number;
  badges: UserBadge[];
  isMe?: boolean;
}

export interface Connection {
  fromId: ID;
  toId: ID;
  strength: number; // 1-3
  since: string;
}

export interface Event {
  id: ID;
  companyId?: ID;
  title: string;
  kind: "hackathon" | "meetup" | "workshop" | "talk";
  date: string;
  location: string;
  coverUrl: string;
  description: string;
  attendees: number;
}

export interface ChatMessage {
  id: ID;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface MatchDecision {
  jobId: ID;
  decision: "like" | "pass" | "super";
  decidedAt: string;
}

export interface Notification {
  id: ID;
  title: string;
  body: string;
  icon: string;
  createdAt: string;
  read: boolean;
}
