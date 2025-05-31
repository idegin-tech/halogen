import { BlockFieldConfig } from "@halogen/common/types";

export const titleField: BlockFieldConfig = {
  name: 'title',
  label: 'Title',
  type: 'text',
  defaultValue: '',
  placeholder: 'Enter title...'
};

export const subtitleField: BlockFieldConfig = {
  name: 'subtitle',
  label: 'Subtitle',
  type: 'text',
  defaultValue: '',
  placeholder: 'Enter subtitle...'
};

export const descriptionField: BlockFieldConfig = {
  name: 'description',
  label: 'Description',
  type: 'textarea',
  defaultValue: '',
  placeholder: 'Enter description...'
};

export const logoTextField: BlockFieldConfig = {
  name: 'logoText',
  label: 'Logo Text',
  type: 'text',
  defaultValue: '',
  placeholder: 'Enter logo text...'
};

// Image fields
export const logoImageField: BlockFieldConfig = {
  name: 'logoImage',
  label: 'Logo Image',
  type: 'image',
  defaultValue: ''
};

export const backgroundImageField: BlockFieldConfig = {
  name: 'backgroundImage',
  label: 'Background Image',
  type: 'image',
  defaultValue: ''
};

// Link and URL fields
export const linkUrlField: BlockFieldConfig = {
  name: 'linkUrl',
  label: 'Link URL',
  type: 'text',
  defaultValue: '',
  placeholder: 'https://example.com'
};

export const linkTextField: BlockFieldConfig = {
  name: 'linkText',
  label: 'Link Text',
  type: 'text',
  defaultValue: '',
  placeholder: 'Enter link text...'
};

// Button fields
export const primaryButtonTextField: BlockFieldConfig = {
  name: 'primaryButtonText',
  label: 'Primary Button Text',
  type: 'text',
  defaultValue: 'Get Started',
  placeholder: 'Enter button text...'
};

export const primaryButtonUrlField: BlockFieldConfig = {
  name: 'primaryButtonUrl',
  label: 'Primary Button URL',
  type: 'text',
  defaultValue: '',
  placeholder: 'https://example.com'
};

export const secondaryButtonTextField: BlockFieldConfig = {
  name: 'secondaryButtonText',
  label: 'Secondary Button Text',
  type: 'text',
  defaultValue: 'Learn More',
  placeholder: 'Enter button text...'
};

export const secondaryButtonUrlField: BlockFieldConfig = {
  name: 'secondaryButtonUrl',
  label: 'Secondary Button URL',
  type: 'text',
  defaultValue: '',
  placeholder: 'https://example.com'
};

// Navigation fields
export const showNavigationField: BlockFieldConfig = {
  name: 'showNavigation',
  label: 'Show Navigation',
  type: 'switch',
  defaultValue: true
};

export const navigationItemsField: BlockFieldConfig = {
  name: 'navigationItems',
  label: 'Navigation Items',
  type: 'list',
  defaultValue: [
    { text: 'Home', url: '/' },
    { text: 'About', url: '/about' },
    { text: 'Services', url: '/services' },
    { text: 'Contact', url: '/contact' }
  ]
};

// Toggle fields
export const showPrimaryButtonField: BlockFieldConfig = {
  name: 'showPrimaryButton',
  label: 'Show Primary Button',
  type: 'switch',
  defaultValue: true
};

export const showSecondaryButtonField: BlockFieldConfig = {
  name: 'showSecondaryButton',
  label: 'Show Secondary Button',
  type: 'switch',
  defaultValue: false
};

export const showLogoField: BlockFieldConfig = {
  name: 'showLogo',
  label: 'Show Logo',
  type: 'switch',
  defaultValue: true
};

export const showBackgroundImageField: BlockFieldConfig = {
  name: 'showBackgroundImage',
  label: 'Show Background Image',
  type: 'switch',
  defaultValue: false
};

// SEO and accessibility fields
export const altTextField: BlockFieldConfig = {
  name: 'altText',
  label: 'Alt Text',
  type: 'text',
  defaultValue: '',
  placeholder: 'Describe the image...'
};

export const ariaLabelField: BlockFieldConfig = {
  name: 'ariaLabel',
  label: 'Aria Label',
  type: 'text',
  defaultValue: '',
  placeholder: 'Accessibility description...'
};
