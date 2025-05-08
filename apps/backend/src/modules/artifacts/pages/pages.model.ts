import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface Page {
  _id?: string;
  name: string;
  path: string;
  isStatic?: boolean;
  project: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PageDocumentProps = Omit<Page, '_id'>;

export interface PageDocument extends PageDocumentProps, Document {}

const PageSchema: Schema = new Schema<Page>({
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