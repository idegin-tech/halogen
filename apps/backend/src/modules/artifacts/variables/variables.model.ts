import { Variable } from '@halogen/common';
import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

// Using the variable types from the common package
export type VariableType = 'color' | 'text' | 'size' | 'boolean';

export type VariableDocumentProps = Omit<Variable, '_id'>;

export interface VariableDocument extends Omit<VariableDocumentProps, 'id'>, Document {
}

const VariableSchema: Schema = new Schema<Variable>({
  variable_id: {
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
  },  type: {
    type: String,
    required: true,
    trim: true,
    enum: ['color', 'text', 'size', 'boolean']
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

VariableSchema.index({ project: 1, key: 1 }, { unique: true });
VariableSchema.index({ project: 1 });
VariableSchema.index({ variableSet: 1 });
VariableSchema.index({ project: 1, variableSet: 1 });
VariableSchema.index({ type: 1 });

VariableSchema.plugin(mongoosePaginate);

export default mongoose.model<VariableDocument, mongoose.PaginateModel<VariableDocument>>('Variable', VariableSchema);