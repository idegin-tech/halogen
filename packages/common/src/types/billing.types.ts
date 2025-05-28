export enum Currency {
    NGN = 'NGN',
    USD = 'USD'
}

export interface WalletData {
    _id?: string;
    project: string;
    balance: number;
    currency: Currency;
    created_at?: Date;
    updated_at?: Date;
}

export enum TransactionType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
    PAYMENT = 'PAYMENT',
    REFUND = 'REFUND',
    SUBSCRIPTION = 'SUBSCRIPTION'
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED'
}

export interface TransactionData {
    _id?: string;
    wallet: string;
    project: string;
    amount: number;
    currency: Currency;
    type: TransactionType;
    status: TransactionStatus;
    description: string;
    metadata?: Record<string, any>;
    reference?: string;
    created_at?: Date;
    updated_at?: Date;
}
