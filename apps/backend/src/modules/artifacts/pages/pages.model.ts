import { PageData } from '@halogen/common';
import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export type PageDocumentProps = Omit<PageData, '_id'>;

export interface PageDocument extends PageDocumentProps, Document {}

const PageSchema: Schema = new Schema<PageData>({
  page_id: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  path: {
    type: String,
    required: true,
    trim: true
  },
  isStatic: {
    type: Boolean,
    default: false
  },
  project: {
    type: String,
    ref: 'Project',
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

PageSchema.index({ project: 1, path: 1 }, { unique: true });
PageSchema.index({ project: 1 });

PageSchema.plugin(mongoosePaginate);

export default mongoose.model<PageDocument, mongoose.PaginateModel<PageDocument>>('Page', PageSchema);