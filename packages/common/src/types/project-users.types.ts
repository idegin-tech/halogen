export enum ProjectUserRole {
  OWNER = 'owner',
  MANAGER = 'manager'
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