import mongoose, { Schema, Document } from 'mongoose';
import { ProjectData } from '@halogen/common';
import mongoosePaginate from 'mongoose-paginate-v2';

export type ProjectDocumentProps = Omit<ProjectData, '_id'>;

export interface ProjectDocument extends ProjectDocumentProps, Document {}

const ProjectSchema: Schema = new Schema<ProjectData>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  project_id: {
    type: String,
    required: true,
    unique: true,
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
  thumbnail: {
    type: String,
    default: null
  },
  description: {
    type: String,
    trim: true
  },  tier: {
    type: Number,
    default: 0
  },
  verificationToken: {
    type: String,
    default: null,
    select: false
  },
  verificationTokenUpdatedAt: {
    type: Date,
    default: null,
    select: false
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

ProjectSchema.plugin(mongoosePaginate);

ProjectSchema.index({ user: 1 });
// Removed duplicate indexes since they're already defined in the schema fields
ProjectSchema.index({ name: 'text' }, { weights: { name: 10 } });

export default mongoose.model<ProjectDocument, mongoose.PaginateModel<ProjectDocument>>('Project', ProjectSchema);