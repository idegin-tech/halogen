import { User } from "./users.types";

export enum DomainStatus {
  PENDING = 'PENDING',
  PENDING_DNS = 'PENDING_DNS',
  PROPAGATING = 'PROPAGATING',
  ACTIVE = 'ACTIVE',
  FAILED = 'FAILED',
  SUSPENDED = 'SUSPENDED'
}

export type ProjectData = {
  _id?: string;
  project_id: string;
  name: string;
  description?: string;
  subdomain: string;
  user: string;
  thumbnail?: string;
  tier?: number;
  createdAt: string;
  updatedAt: string;
  verificationToken?: string;
  verificationTokenUpdatedAt?: string;
  settings?: {
    headingFont: string;
    bodyFont: string;
  } | null;
  metadata?: any | null; 
}

export type DomainData = {
  _id?: string;
  name: string;
  status: DomainStatus;
  project: string | ProjectData;
  verifiedAt?: string;
  sslIssuedAt?: string;
  sslExpiresAt?: string;
  txtRecord?: {
    type: string;
    name: string;
    value: string;
  };
  isActive: boolean;
  lastVerificationAttempt?: string;
  verificationFailReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type PageData = {
  _id?: string;
  page_id: string;
  name: string;
  path?: string;
  slug?: string;
  route?: string;
  isStatic?: boolean;
  project?: ProjectData;
  createdAt?: string;
  updatedAt?: string;
}

export type VariableSet = {
  set_id: string;
  name: string;
  key: string;
  project?: string | ProjectData;
  createdAt?: string;
  updatedAt?: string;
}

export type Variable = {
  variable_id: string;
  name: string;
  key: string;
  type: "color" | "text" | "size" | "boolean";
  project?: string | ProjectData;
  primaryValue: string;
  secondaryValue: string;
  variableSet: VariableSet | string;
  createdAt?: string;
  updatedAt?: string;
}