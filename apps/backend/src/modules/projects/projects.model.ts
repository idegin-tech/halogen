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

ProjectSchema.plugin(mongoosePaginate);

ProjectSchema.index({ user: 1 });
ProjectSchema.index({ subdomain: 1 }, { unique: true });
ProjectSchema.index({ project_id: 1 }, { unique: true });
ProjectSchema.index({ name: 'text' }, { weights: { name: 10 } });

export default mongoose.model<ProjectDocument, mongoose.PaginateModel<ProjectDocument>>('Project', ProjectSchema);