export interface User {
    _id?: string;
    displayName: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserWithPassword extends User {
    password: string;
}

export enum UserRole {
    ADMIN = "admin",
    DEFAULT= "default",
}

export interface UserSecret {
    _id?: string;
    userId: string;
    passwordHash: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
}
