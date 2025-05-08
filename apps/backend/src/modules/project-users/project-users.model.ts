import mongoose, { Schema, Document } from 'mongoose';
import { ProjectUser, ProjectUserRole } from '@halogen/common';

export type ProjectUserDocumentProps = Omit<ProjectUser, '_id'>;

export interface ProjectUserDocument extends ProjectUserDocumentProps, Document {}

const ProjectUserSchema: Schema = new Schema<ProjectUser>({
  project: {
    type: String,
    ref: 'Project',
    required: true
  },
  user: {
    type: String,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: Object.values(ProjectUserRole),
    required: true
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

// Compound index to ensure a user can have only one role per project
ProjectUserSchema.index({ project: 1, user: 1 }, { unique: true });

// Index for faster lookups
ProjectUserSchema.index({ project: 1 });
ProjectUserSchema.index({ user: 1 });

export default mongoose.model<ProjectUserDocument>('ProjectUser', ProjectUserSchema);