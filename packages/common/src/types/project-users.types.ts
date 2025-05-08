export enum ProjectUserRole {
  OWNER = 'owner',
  MANAGER = 'manager'
}

export interface ProjectUser {
  _id?: string;
  project: string;
  user: string;
  role: ProjectUserRole;
  createdAt: Date;
  updatedAt: Date;
}