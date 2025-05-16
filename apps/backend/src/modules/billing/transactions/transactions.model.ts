import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import {
    TransactionData,
    TransactionType,
    TransactionStatus,
    Currency
} from '@halogen/common';

export interface TransactionDocument extends Omit<TransactionData, '_id'>, Document { }

const TransactionSchema: Schema = new Schema<TransactionData>({
    wallet: {
        type: String,
        ref: 'Wallet',
        required: true,
        index: true
    },
    project: {
        type: String,
        ref: 'Project',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    }, currency: {
        type: String,
        enum: Object.values(Currency),
        required: true,
        default: Currency.USD
    },
    type: {
        type: String,
        enum: Object.values(TransactionType),
        required: true
    },
    status: {
        type: String,
        enum: Object.values(TransactionStatus),
        required: true,
        default: TransactionStatus.PENDING
    },
    description: {
        type: String,
        required: true
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    reference: {
        type: String,
        unique: true,
        sparse: true
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = ret._id;
            delete ret.__v;
        }
    }
});

TransactionSchema.plugin(mongoosePaginate);

// Create compound indices for faster queries
TransactionSchema.index({ wallet_id: 1, created_at: -1 });
TransactionSchema.index({ project_id: 1, created_at: -1 });
TransactionSchema.index({ status: 1, type: 1 });

export default mongoose.model<TransactionDocument, mongoose.PaginateModel<TransactionDocument>>('Transaction', TransactionSchema);
