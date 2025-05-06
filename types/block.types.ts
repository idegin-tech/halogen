import { PageData } from "./builder.types"


export type BlockFieldConfig = {
    type: "text" | "textarea" | "select" | "checkbox" | "radio" | "number" | "color" | "url" | "file" | "switch" | "list"
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
    items:BlockFieldConfig;
} 

export type BlockProperties = {
    name: string
    description: string;
    fields: Record<string, BlockFieldConfig>;
}

export type BlockInstance = {
    id: string;
    index: number;
    page: PageData | string;
    folderName: string;
    subFolder: string;
    value: Record<string, any> | null;
    instance: string | null;
}
