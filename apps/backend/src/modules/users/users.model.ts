import mongoose, { Schema, Document } from 'mongoose';
import { User } from '@halogen/common';

export type UserDocumentProps = Omit<User, '_id'>;

export interface UserDocument extends UserDocumentProps, Document {}

const UserSchema: Schema = new Schema<User>({
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      ret.id = ret._id;
      delete ret.__v;
    }
  }
});

export default mongoose.model<UserDocument>('User', UserSchema);