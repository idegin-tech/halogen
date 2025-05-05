import { PageData } from "./builder.types"


export type BlockFieldConfig = {
    type: "text" | "textarea" | "select" | "checkbox" | "radio" | "number" | "color" | "url" | "file" | "switch"
    name: string
    label: string
    description?: string
    required?: boolean
    defaultValue?: any
    value?: any;
    options?: Array<{ label: string; value: any }>
    placeholder?: string
    min?: number
    max?: number
    step?: number
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
    fileName: string;

    value: Record<string, any>;
}
