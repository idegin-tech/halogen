import mongoose, { Schema, Document, Types } from 'mongoose';
import { ProjectSettings as ProjectSettingsType } from '@halogen/common/types';

// Interface extending Document for mongoose use
interface IProjectSettings extends Document, Omit<ProjectSettingsType, '_id' | 'project' | 'createdAt' | 'updatedAt'> {
  project: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSettingsSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    headingFont: {
      type: String,
      required: true,
      default: 'Inter'
    },
    bodyFont: {
      type: String,
      required: true,
      default: 'Inter'
    }
  },
  { timestamps: true }
);

// Create a unique index on project to ensure one settings document per project
ProjectSettingsSchema.index({ project: 1 }, { unique: true });

export const ProjectSettings = mongoose.model<IProjectSettings>('ProjectSettings', ProjectSettingsSchema);

export default ProjectSettings;
