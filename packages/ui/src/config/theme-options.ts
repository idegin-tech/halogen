import { BlockFieldConfig } from "@halogen/common/types";

export const themeOptions: Record<string, BlockFieldConfig> = {
  theme: {
    type: "theme",
    name: "theme",
    label: "Theme",
    description: "Choose a theme for styling",
    defaultValue: "primary"
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

// Individual option exports for easier access
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
