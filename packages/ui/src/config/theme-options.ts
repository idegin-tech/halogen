import { BlockFieldConfig } from "@halogen/common/types";

export const themeColorOptions = [
  { label: "Primary", value: "primary" },
  { label: "Primary Foreground", value: "primary-foreground" },
  { label: "Secondary", value: "secondary" },
  { label: "Secondary Foreground", value: "secondary-foreground" },
  { label: "Background", value: "background" },
  { label: "Foreground", value: "foreground" },
  { label: "Muted", value: "muted" },
  { label: "Muted Foreground", value: "muted-foreground" },
  { label: "Card", value: "card" },
  { label: "Card Foreground", value: "card-foreground" },
  { label: "Accent", value: "accent" },
  { label: "Accent Foreground", value: "accent-foreground" },
  { label: "Border", value: "border" },
];

export const variantOptions = [
  { label: "Solid", value: "solid" },
  { label: "Outline", value: "outline" },
  { label: "Ghost", value: "ghost" },
  { label: "Soft", value: "soft" },
];

export const backgroundTypeOptions = [
  { label: "Solid", value: "solid" },
  { label: "Gradient", value: "gradient" },
  { label: "Image", value: "image" },
  { label: "Video", value: "video" },
];

export const roundnessOptions = [
  { label: "None", value: "none" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
  { label: "Extra Large", value: "xl" },
  { label: "Full", value: "full" },
];

export const borderWidthOptions = [
  { label: "None", value: "0" },
  { label: "Thin", value: "1" },
  { label: "Default", value: "2" },
  { label: "Medium", value: "4" },
  { label: "Thick", value: "8" },
];

export const shadowOptions = [
  { label: "None", value: "none" },
  { label: "Small", value: "sm" },
  { label: "Large", value: "lg" },
  { label: "Extra Large", value: "xl" },
];


export const themeOptions: Record<string, BlockFieldConfig> = {
  theme: {
    type: "select",
    name: "theme",
    label: "Color Scheme",
    description: "Choose a color scheme for styling",
    options: themeColorOptions,
    defaultValue: "background"
  },
  variant: {
    type: "select",
    name: "variant",
    label: "Variant",
    description: "Choose a visual variant style",
    options: variantOptions,
    defaultValue: "solid"
  },
  backgroundType: {
    type: "select",
    name: "backgroundType",
    label: "Background Type",
    description: "Choose the background type",
    options: backgroundTypeOptions,
    defaultValue: "solid"
  },
  backgroundColor: {
    type: "color",
    name: "backgroundColor",
    label: "Background Color",
    description: "Custom background color",
    defaultValue: "#ffffff"
  },
  textColor: {
    type: "color",
    name: "textColor",
    label: "Text Color",
    description: "Custom text color",
    defaultValue: "#000000"
  }
};

export const backgroundColorOptions = themeOptions.backgroundColor;
export const textColorOptions = themeOptions.textColor;

export const gradientOptions: Record<string, BlockFieldConfig> = {
  gradient: {
    type: "select",
    name: "gradient",
    label: "Gradient",
    description: "Background gradient style",
    options: [
      { label: "None", value: "" },
      { label: "Primary to Secondary", value: "primary-to-secondary" },
      { label: "Secondary to Muted", value: "secondary-to-muted" },
      { label: "Primary to Accent", value: "primary-to-accent" },
      { label: "Background to Card", value: "background-to-card" },
      { label: "Muted to Card", value: "muted-to-card" },
      { label: "Accent to Card", value: "accent-to-card" },
      { label: "Card to Accent", value: "card-to-accent" }
    ],
    defaultValue: ""
  },
  type: {
    type: "select",
    name: "gradientType",
    label: "Gradient Type",
    description: "Type of gradient",
    options: [
      { label: "Linear", value: "linear" },
      { label: "Radial", value: "radial" },
      { label: "Conic", value: "conic" }
    ],
    defaultValue: "linear"
  },
  direction: {
    type: "select",
    name: "gradientDirection",
    label: "Gradient Direction",
    description: "Direction of the gradient",
    options: [
      { label: "To Right", value: "to-right" },
      { label: "To Left", value: "to-left" },
      { label: "To Bottom", value: "to-bottom" },
      { label: "To Top", value: "to-top" },
      { label: "To Bottom Right", value: "to-bottom-right" },
      { label: "To Bottom Left", value: "to-bottom-left" },
      { label: "To Top Right", value: "to-top-right" },
      { label: "To Top Left", value: "to-top-left" },
      { label: "From Center", value: "from-center" }
    ],
    defaultValue: "to-right"
  },
  style: {
    type: "select",
    name: "gradientStyle",
    label: "Gradient Style",
    description: "Style of the gradient",
    options: [
      { label: "Subtle", value: "subtle" },
      { label: "Bold", value: "bold" },
      { label: "Vibrant", value: "vibrant" }
    ],
    defaultValue: "subtle"
  }
};
