import { ProjectData } from "./builder.types";


export interface ProjectQueryOptions {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export enum ProjectIntegration {
    CMS = 'cms',
    AOS = 'aos',
    MAILING_LIST = 'mailing_list',
}

export interface ProjectSettings {
    _id?: string;
    project: string;
    headingFont: string;
    bodyFont: string;
    integrations: ProjectIntegration[];
    createdAt?: string;
    updatedAt?: string;
}

export interface ProjectSettingsDTO {
    headingFont?: string;
    bodyFont?: string;
}

export interface ProjectMetadata {
    _id?: string;
    project: string;
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    favicon?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProjectMetadataDTO {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    favicon?: string;
}

export enum ProjectUserRole {
    MANAGER = 'manager',
    DEVELOPER = 'developer',
}

export enum ProjectUserStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    SUSPENDED = 'suspended'
}

export interface ProjectUser {
    _id?: string;
    project: string;
    user: string;
    role: ProjectUserRole;
    status: ProjectUserStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectUserQueryOptions {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: ProjectUserStatus | ProjectUserStatus[];
}

export enum DomainStatus {
    PENDING = 'pending',
    PENDING_DNS = 'pending_dns',
    PROPAGATING = 'propagating',
    ACTIVE = 'active',
    FAILED = 'failed',
    SUSPENDED = 'suspended'
}

export interface DomainData {
    _id?: string;
    name: string;
    project: string;
    status: DomainStatus;
    isActive: boolean;
    verifiedAt?: string;
    sslIssuedAt?: string;
    sslExpiresAt?: string;
    lastVerificationAttempt?: string;
    verificationFailReason?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface DomainQueryOptions {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: DomainStatus | DomainStatus[];
    isActive?: boolean;
}