export interface Project {
    _id?: string;
    name: string;
    description?: string;
    subdomain: string;
    user: string;
    isPublished: boolean;
    thumbnail?: string;
    createdAt: Date;
    updatedAt: Date;
}