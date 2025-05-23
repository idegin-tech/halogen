import mongoose, { Schema, Document } from 'mongoose';
import { DomainData, DomainStatus } from '@halogen/common';
import mongoosePaginate from 'mongoose-paginate-v2';

export type DomainDocumentProps = Omit<DomainData, '_id'>;

export interface DomainDocument extends DomainDocumentProps, Document { }

const DomainSchema: Schema = new Schema<DomainData>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function (name: string) {
                const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
                return domainRegex.test(name);
            },
            message: 'Invalid domain name format'
        }
    },
    project: {
        type: String,
        ref: 'Project',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: Object.values(DomainStatus),
        default: DomainStatus.PENDING,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true
    },
    verifiedAt: {
        type: Date,
        default: null
    },
    sslIssuedAt: {
        type: Date,
        default: null
    },
    sslExpiresAt: {
        type: Date,
        default: null
    },
    lastVerificationAttempt: {
        type: Date,
        default: null
    },
    verificationFailReason: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = ret._id;
            delete ret.__v;
            if (ret.verifiedAt) {
                ret.verifiedAt = ret.verifiedAt.toISOString();
            }
            if (ret.sslIssuedAt) {
                ret.sslIssuedAt = ret.sslIssuedAt.toISOString();
            }
            if (ret.sslExpiresAt) {
                ret.sslExpiresAt = ret.sslExpiresAt.toISOString();
            }
            if (ret.lastVerificationAttempt) {
                ret.lastVerificationAttempt = ret.lastVerificationAttempt.toISOString();
            }
            if (ret.createdAt) {
                ret.createdAt = ret.createdAt.toISOString();
            }
            if (ret.updatedAt) {
                ret.updatedAt = ret.updatedAt.toISOString();
            }
        }
    }
});

DomainSchema.plugin(mongoosePaginate);

DomainSchema.index({ project: 1, name: 1 }, { unique: true });

DomainSchema.index({ name: 'text' }, { weights: { name: 10 } });

DomainSchema.index({ status: 1 });

DomainSchema.index({ isActive: 1 });

export default mongoose.model<DomainDocument, mongoose.PaginateModel<DomainDocument>>('Domain', DomainSchema);
