import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { FileData } from '@halogen/common';

// Server-side version with Date objects instead of strings
export interface File extends Omit<FileData, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}

export type FileDocumentProps = Omit<File, '_id'>;

export interface FileDocument extends FileDocumentProps, Document {}

const FileSchema: Schema = new Schema<File>(
  {
    project: {
      type: String,
      ref: 'Project',
      required: true,
      index: true
    },
    path: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    extension: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    downloadUrl: {
      type: String,
      required: true
    },
    thumbnailUrl: {
      type: String
    },
    user: {
      type: String,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Add text index for search functionality
FileSchema.index({ name: 'text', path: 'text' });

// Add pagination plugin
FileSchema.plugin(mongoosePaginate);

export const FileModel = mongoose.model<FileDocument, mongoose.PaginateModel<FileDocument>>('File', FileSchema);

export default FileModel;
