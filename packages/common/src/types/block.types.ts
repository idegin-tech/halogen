import { PageData } from "./builder.types"

export type BlockFieldConfig = {
    type: "text" | "textarea" | "select" | "number" | "color" | "image" | "switch" | "list" | "theme"
    name: string
    label: string
    description?: string
    required?: boolean
    defaultValue?: any
    value?: any | BlockConfigListValue;
    options?: Array<{ label: string; value: any }>
    placeholder?: string
    min?: number
    max?: number
    step?: number
}

export type BlockConfigListValue = {
    name: string;
    description?: string;

    contentFields: Record<string, BlockFieldConfig>;
    themeFields: Record<string, BlockFieldConfig>;
    layoutFields: Record<string, BlockFieldConfig>;
}

export type BlockProperties = {
    name: string
    description: string;
    contentFields: Record<string, BlockFieldConfig>;
    themeFields: Record<string, BlockFieldConfig>;
    layoutFields: Record<string, BlockFieldConfig>;
    fields?: Record<string, BlockFieldConfig>; // Legacy support
    theme?: Record<string, BlockFieldConfig> | null; // Legacy support
}

export type BlockInstance = {
    _id?: string;
    instance_id?: string; 
    page_id: string;      
    index: number;
    page: PageData | string; 
    folderName: string;
    subFolder: string;
    value: Record<string, any> | null;
    instance: string | null;
    ref?: string | null;  
}