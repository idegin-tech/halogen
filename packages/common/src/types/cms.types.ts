export type CollectionData = {
    _id: string;
    name: string;
    slug: string;
    description: string | null;
    project: string;
}

export type SchemaData = {
    _id: string;
    type: SchemaFieldTypes;
    fields: SchemaField[];
    project: string;
    collection: string;
}

export type SchemaField = {
    _id: string;
    label: string;
    key: string;
    isDisabled: boolean;
    description: string | null;
    autoGenerateFrom: string | null;

    validation: SchemaFieldValidation;
}

export enum SchemaFieldTypes {
    SHORT_TEXT = 'short_text',
    SLUG = 'slug',
    LONG_TEXT = 'long_text',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    DATE = 'date',
    DATE_TIME = 'date_time',
    TIME = 'time',
    EMAIL = 'email',
    URL = 'url',
    PHONE = 'phone',
    IMAGE = 'image',
    RICH_TEXT = 'rich_text',
    REFERENCE_MANY = 'reference_many',
    REFERENCE_ONE = 'reference_one',
}

export type SchemaFieldValidation = {
    required: boolean;
    unique: boolean;
    minLength: number;
    maxLength: number;
    minValue: number;
    maxValue: number;
    regex: string;
}