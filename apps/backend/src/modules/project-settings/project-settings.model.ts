import mongoose, { Schema, Document, Types } from 'mongoose';
import { ProjectSettings as ProjectSettingsType, ProjectIntegration } from '@halogen/common/types';

export interface IProjectSettings extends Document, Omit<ProjectSettingsType, '_id' | 'project' | 'createdAt' | 'updatedAt'> {
  project: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSettingsSchema = new Schema<IProjectSettings>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    integrations: {
      type: [String],
      enum: Object.values(ProjectIntegration),
      default: []
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

ProjectSettingsSchema.index({ project: 1 }, { unique: true });

//@ts-ignore
export const ProjectSettings = mongoose.model<IProjectSettings>('ProjectSettings', ProjectSettingsSchema);

export default ProjectSettings;
