import { BlockFieldConfig } from "@halogen/common/types";

export const layoutOptions: Record<string, BlockFieldConfig> = {
  alignment: {
    type: "select",
    name: "alignment",
    label: "Alignment",
    description: "Content alignment",
    options: [
      { label: "Left", value: "left" },
      { label: "Center", value: "center" },
      { label: "Right", value: "right" },
      { label: "Space Between", value: "justify-between" },
      { label: "Space Around", value: "justify-around" },
      { label: "Space Evenly", value: "justify-evenly" }
    ],
    defaultValue: "left"
  },
  padding: {
    type: "select",
    name: "padding",
    label: "Padding",
    description: "Internal spacing",
    options: [
      { label: "None", value: "p-0" },
      { label: "Small", value: "p-2" },
      { label: "Medium", value: "p-4" },
      { label: "Large", value: "p-6" },
      { label: "Extra Large", value: "p-8" }
    ],
    defaultValue: "p-4"
  },
  margin: {
    type: "select",
    name: "margin",
    label: "Margin",
    description: "External spacing",
    options: [
      { label: "None", value: "m-0" },
      { label: "Small", value: "m-2" },
      { label: "Medium", value: "m-4" },
      { label: "Large", value: "m-6" },
      { label: "Extra Large", value: "m-8" }
    ],
    defaultValue: "m-0"
  },
  roundedCorners: {
    type: "select",
    name: "roundedCorners",
    label: "Rounded Corners",
    description: "Border radius",
    options: [
      { label: "None", value: "none" },
      { label: "Small", value: "sm" },
      { label: "Medium", value: "md" },
      { label: "Large", value: "lg" },
      { label: "Extra Large", value: "xl" },
      { label: "Full", value: "full" }
    ],
    defaultValue: "none"
  },
  height: {
    type: "select",
    name: "height",
    label: "Height",
    description: "Component height",
    options: [
      { label: "Auto", value: "h-auto" },
      { label: "Small", value: "h-12" },
      { label: "Medium", value: "h-16" },
      { label: "Large", value: "h-20" },
      { label: "Extra Large", value: "h-24" },
      { label: "Responsive Small", value: "h-12 md:h-16" },
      { label: "Responsive Medium", value: "h-16 md:h-20" },
      { label: "Responsive Large", value: "h-20 md:h-24" }
    ],
    defaultValue: "h-16"
  },
  width: {
    type: "select",
    name: "width",
    label: "Width",
    description: "Component width",
    options: [
      { label: "Auto", value: "w-auto" },
      { label: "Full", value: "w-full" },
      { label: "Screen", value: "w-screen" },
      { label: "Container", value: "container" },
      { label: "Max Width Small", value: "max-w-sm" },
      { label: "Max Width Medium", value: "max-w-md" },
      { label: "Max Width Large", value: "max-w-lg" },
      { label: "Max Width Extra Large", value: "max-w-xl" },
      { label: "Max Width 2XL", value: "max-w-2xl" },
      { label: "Max Width 4XL", value: "max-w-4xl" },
      { label: "Max Width 7XL", value: "max-w-7xl" }
    ],
    defaultValue: "w-full"  },
  isDetached: {
    type: "switch",
    name: "isDetached",
    label: "Detached",
    description: "Whether the component should be detached/floating",
    defaultValue: false
  }
};

// Individual option exports for easier access
// export const alignmentOptions = layoutOptions.alignment;
export const paddingOptions = layoutOptions.padding;
export const marginOptions = layoutOptions.margin;
export const roundedCornerOptions = layoutOptions.roundedCorners;
