import { BlockInstance as CommonBlockInstance } from '@halogen/common';
import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface BlockInstance extends Omit<CommonBlockInstance, 'page'> {
  page: string;
  project: string;
  instance_id: string;
  page_id: string; // Add frontend page_id field
  ref?: string; // Frontend instance_id reference of the block being referenced
}

export type BlockInstanceDocumentProps = Omit<BlockInstance, '_id'>;

export interface BlockInstanceDocument extends Omit<BlockInstanceDocumentProps, 'id'>, Document {}

const BlockInstanceSchema: Schema = new Schema<BlockInstance>({
  instance_id: {
    type: String,
    required: true,
    trim: true
  },
  page_id: { // Add page_id field to schema
    type: String,
    required: true,
    trim: true
  },
  index: {
    type: Number,
    required: true
  },
  page: {
    type: String,
    ref: 'Page',
    required: true
  },
  project: {
    type: String,
    ref: 'Project',
    required: true
  },
  folderName: {
    type: String,
    required: true,
    trim: true
  },
  subFolder: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: Schema.Types.Mixed,
    default: null
  },
  instance: {
    type: String,
    ref: 'BlockInstance',
    default: null
  },
  ref: {
    type: String,
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

BlockInstanceSchema.index({ project: 1 });
BlockInstanceSchema.index({ page: 1 });
BlockInstanceSchema.index({ page_id: 1 }); // Add index for page_id
BlockInstanceSchema.index({ project: 1, page: 1 });
BlockInstanceSchema.index({ instance: 1 });
BlockInstanceSchema.index({ instance_id: 1 }, { unique: true });

BlockInstanceSchema.plugin(mongoosePaginate);

export default mongoose.model<BlockInstanceDocument, mongoose.PaginateModel<BlockInstanceDocument>>('BlockInstance', BlockInstanceSchema);