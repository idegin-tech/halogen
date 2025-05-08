import mongoose, { Schema, Document } from 'mongoose';
import { UserSecret } from '@halogen/common';

export type UserSecretDocumentProps = Omit<UserSecret, '_id'>;

export interface UserSecretDocument extends UserSecretDocumentProps, Document {}

const UserSecretSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      ret.id = ret._id;
      delete ret.passwordHash;
      delete ret.__v;
    }
  }
});

export default mongoose.model<UserSecretDocument>('UserSecret', UserSecretSchema);