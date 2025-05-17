import mongoose, {Schema, Document} from 'mongoose';
import {CollectionData} from '@halogen/common';
import mongoosePaginate from 'mongoose-paginate-v2';

export type CollectionDocumentProps = Omit<CollectionData, '_id'>;

export interface CollectionDocument extends CollectionDocumentProps, Document {
}

const CollectionSchema: Schema = new Schema<CollectionData>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: null
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

CollectionSchema.plugin(mongoosePaginate);

// Create compound index for project and slug to ensure uniqueness per project
CollectionSchema.index({project: 1, slug: 1}, {unique: true});
// Add text index for name to support search
CollectionSchema.index({name: 'text'});

export default mongoose.model<CollectionDocument, mongoose.PaginateModel<CollectionDocument>>('Collection', CollectionSchema);

