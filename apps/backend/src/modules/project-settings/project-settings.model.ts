import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProjectSettings extends Document {
  project: Types.ObjectId;
  headingFont: string;
  bodyFont: string;
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
