import { Variable } from '@halogen/common';
import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export enum VariableType {
  COLOR = 'color',
  SIZE = 'size',
  FONT = 'font',
  SPACING = 'spacing',
  SHADOW = 'shadow',
  OPACITY = 'opacity'
}

export type VariableDocumentProps = Omit<Variable, '_id'>;

export interface VariableDocument extends Omit<VariableDocumentProps, 'id'>, Document {
}

const VariableSchema: Schema = new Schema<Variable>({
  id: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true,
    enum: Object.values(VariableType)
  },
  primaryValue: {
    type: String,
    required: true
  },
  secondaryValue: {
    type: String,
    required: true
  },
  variableSet: {
    type: String,
    required: true
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

// Create a compound index on project and key to ensure uniqueness
VariableSchema.index({ project: 1, key: 1 }, { unique: true });
VariableSchema.index({ project: 1 });
VariableSchema.index({ variableSet: 1 });
VariableSchema.index({ project: 1, variableSet: 1 });
VariableSchema.index({ type: 1 });

// Add pagination support
VariableSchema.plugin(mongoosePaginate);

export default mongoose.model<VariableDocument, mongoose.PaginateModel<VariableDocument>>('Variable', VariableSchema);