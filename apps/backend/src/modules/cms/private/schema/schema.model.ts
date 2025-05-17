import mongoose, {Schema, Document} from 'mongoose';
import {SchemaData, SchemaFieldTypes} from '@halogen/common';
import mongoosePaginate from 'mongoose-paginate-v2';

export type SchemaDocumentProps = Omit<SchemaData, '_id' | 'collection'> & {
    collectionId: string;
};

export interface SchemaDocument extends SchemaDocumentProps, Document {
}

const SchemaFieldValidationSchema = new Schema({
    required: {
        type: Boolean,
        default: false
    },
    unique: {
        type: Boolean,
        default: false
    },
    minLength: {
        type: Number,
        default: 0
    },
    maxLength: {
        type: Number,
        default: 0
    },
    minValue: {
        type: Number,
        default: 0
    },
    maxValue: {
        type: Number,
        default: 0
    },
    regex: {
        type: String,
        default: ''
    }
}, {_id: false});

const SchemaFieldSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: true
    },
    isDisabled: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        default: null
    },
    autoGenerateFrom: {
        type: String,
        default: null
    },
    validation: {
        type: SchemaFieldValidationSchema,
        required: true,
        default: () => ({})
    }
}, {_id: false});

const SchemaSchema: Schema = new Schema<SchemaData>({
    type: {
        type: String,
        enum: Object.values(SchemaFieldTypes),
        required: true
    },
    fields: {
        type: [SchemaFieldSchema],
        default: []
    },
    project: {
        type: String,
        ref: 'Project',
        required: true
    },
    collection: {
        type: String,
        ref: 'Collection',
        required: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = ret._id;
            ret.collectionId = ret.collection;
            delete ret.__v;
        }
    }
});

SchemaSchema.plugin(mongoosePaginate);

SchemaSchema.index({project: 1, collection: 1});

export default mongoose.model<SchemaDocument, mongoose.PaginateModel<SchemaDocument>>('Schema', SchemaSchema);

