import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { WalletData, Currency } from '@halogen/common';

export interface WalletDocument extends Omit<WalletData, '_id'>, Document { }

const WalletSchema: Schema = new Schema<WalletData>({
    project: {
        type: String,
        ref: 'Project',
        required: true,
        unique: true,
        index: true
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    currency: {
        type: String,
        enum: Object.values(Currency),
        required: true,
        default: Currency.USD
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

WalletSchema.plugin(mongoosePaginate);

export default mongoose.model<WalletDocument, mongoose.PaginateModel<WalletDocument>>('Wallet', WalletSchema);
