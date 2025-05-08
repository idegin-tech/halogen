export interface User {
    _id?: string;
    displayName: string;
    email: string;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserWithPassword extends User {
    password: string;
}

export interface UserSecret {
    _id?: string;
    user: string;
    passwordHash: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
}
