import mongoose, { Schema, Document } from 'mongoose';
import { Project } from '@halogen/common';

export type ProjectDocumentProps = Omit<Project, '_id'>;

export interface ProjectDocument extends ProjectDocumentProps, Document {}

const ProjectSchema: Schema = new Schema<Project>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subdomain: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  user: {
    type: String,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  thumbnail: {
    type: String
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

// Index for faster lookups
ProjectSchema.index({ user: 1 });
ProjectSchema.index({ subdomain: 1 }, { unique: true });

export default mongoose.model<ProjectDocument>('Project', ProjectSchema);