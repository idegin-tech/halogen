export interface Project {
    _id?: string;
    name: string;
    subdomain: string;
    user: string;
    thumbnail?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectQueryOptions {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}