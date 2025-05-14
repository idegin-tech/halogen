import mongoose, { Schema, Document } from 'mongoose';
import { ProjectMetadata } from '@halogen/common';
import mongoosePaginate from 'mongoose-paginate-v2';

export type ProjectMetadataDocumentProps = Omit<ProjectMetadata, '_id'>;

export interface ProjectMetadataDocument extends ProjectMetadataDocumentProps, Document {}

const ProjectMetadataSchema: Schema = new Schema<ProjectMetadata>({
  project: {
    type: String,
    ref: 'Project',
    required: true,
    unique: true
  },
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },  
  keywords: {
    type: String,
    trim: true
  },
  ogTitle: {
    type: String,
    trim: true
  },
  ogDescription: {
    type: String,
    trim: true
  },
  ogImage: {
    type: String,
    trim: true
  },
  favicon: {
    type: String,
    trim: true,
    default: null
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

ProjectMetadataSchema.plugin(mongoosePaginate);

// Create indices for common query patterns
ProjectMetadataSchema.index({ project: 1 }, { unique: true });

export default mongoose.model<ProjectMetadataDocument, mongoose.PaginateModel<ProjectMetadataDocument>>('ProjectMetadata', ProjectMetadataSchema);
