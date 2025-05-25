import { ProjectData, DomainData, DomainStatus } from "./builder.types";


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

export interface DomainQueryOptions {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: DomainStatus | DomainStatus[];
    isActive?: boolean;
}