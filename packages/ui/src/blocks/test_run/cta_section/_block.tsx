import { BlockProperties } from "@halogen/common/types";
import { themeColorOptions, blockSpacingValue, borderWidthOptions, roundnessOptions, shadowOptions, alignmentOptions } from '../../../config';



function hasValueProp(val: unknown): val is { value: unknown } {
    return val !== null && typeof val === 'object' && 'value' in val;
}

function getStringField(obj: Record<string, unknown>, key: string, defaultValue: string): string {
    if (!obj) return defaultValue;
    const val = obj[key];
    if (val === undefined || val === null) return defaultValue;
    if (typeof val === 'string') return val;
    if (hasValueProp(val) && typeof val.value === 'string') return val.value;
    return defaultValue;
}
function getArrayField(obj: Record<string, unknown>, key: string, defaultValue: string[]): string[] {
    if (!obj) return defaultValue;
    const val = obj[key];
    if (Array.isArray(val)) return val;
    if (hasValueProp(val) && Array.isArray(val.value)) return val.value;
    return defaultValue;
}
function getBoolField(obj: Record<string, unknown>, key: string, defaultValue: boolean): boolean {
    if (!obj) return defaultValue;
    const val = obj[key];
    if (typeof val === 'boolean') return val;
    if (hasValueProp(val) && typeof val.value === 'boolean') return val.value;
    return defaultValue;
}

export function CTASection(fields: Record<string, unknown>) {
    const content = properties.contentFields;
    const theme = properties.themeFields;
    const layout = properties.layoutFields;

    const title = getStringField(fields, 'title', content.title?.defaultValue ?? 'Ready to get started?');
    const subtitle = getStringField(fields, 'subtitle', content.subtitle?.defaultValue ?? 'Join thousands of companies already growing with our platform.');
    const primaryButtonText = getStringField(fields, 'primaryButtonText', content.primaryButtonText?.defaultValue ?? 'Get Started');
    const primaryButtonLink = getStringField(fields, 'primaryButtonLink', content.primaryButtonLink?.defaultValue ?? '#');
    const secondaryButtonText = getStringField(fields, 'secondaryButtonText', content.secondaryButtonText?.defaultValue ?? 'Learn More');
    const secondaryButtonLink = getStringField(fields, 'secondaryButtonLink', content.secondaryButtonLink?.defaultValue ?? '#');

    const backgroundColor = getStringField(fields, 'backgroundColor', theme.backgroundColor?.defaultValue ?? 'background');
    const headingColor = getStringField(fields, 'headingColor', theme.headingColor?.defaultValue ?? 'foreground');
    const paragraphColor = getStringField(fields, 'paragraphColor', theme.paragraphColor?.defaultValue ?? 'muted');
    const buttonColor = getStringField(fields, 'buttonColor', theme.buttonColor?.defaultValue ?? 'primary');
    const borderColor = getStringField(fields, 'borderColor', theme.borderColor?.defaultValue ?? 'border');
    const borderWidth = getStringField(fields, 'borderWidth', theme.borderWidth?.defaultValue ?? 'border-0');
    const shadowSize = getStringField(fields, 'shadowSize', theme.shadowSize?.defaultValue ?? 'none');
    const roundness = getStringField(fields, 'roundness', theme.roundness?.defaultValue ?? 'medium');
    const buttonRoundness = getStringField(fields, 'buttonRoundness', theme.buttonRoundness?.defaultValue ?? 'medium');
    const spacing = getArrayField(fields, 'spacing', theme.spacing?.defaultValue ?? []);

    const textAlign = getStringField(fields, 'layout', layout.layout?.defaultValue ?? 'center');
    const buttonLayout = getStringField(fields, 'buttonLayout', layout.buttonLayout?.defaultValue ?? 'both');
    const detached = getBoolField(fields, 'detached', layout.detached?.defaultValue ?? false);

    const sectionClass = [
        detached ? 'container justify-center mx-auto' : '',
        Array.isArray(spacing) && spacing.includes('top') ? `pt-[${blockSpacingValue}]` : '',
        Array.isArray(spacing) && spacing.includes('bottom') ? `pb-[${blockSpacingValue}]` : '',
    ].filter(Boolean).join(' ');

    const mainContentClass = [
        'p-10 w-full flex flex-col items-center',
        backgroundColor !== 'background' ? `bg-${backgroundColor}` : 'bg-background',
        borderColor !== 'border' ? `border-${borderColor}` : 'border-border',
        borderWidth !== 'border-0' ? `border-${borderWidth}` : '',
        shadowSize !== 'none' ? `shadow-${shadowSize}` : '',
        detached ? `rounded-${roundness}` : '',
        'transition-all',
    ].filter(Boolean).join(' ');

    const headingClass = [
        'text-3xl font-bold mb-4',
        headingColor !== 'foreground' ? `text-${headingColor}` : 'text-foreground',
        textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left',
    ].filter(Boolean).join(' ');

    const subtitleClass = [
        'text-lg mb-8',
        paragraphColor !== 'muted' ? `text-${paragraphColor}` : 'text-muted',
        textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left',
    ].filter(Boolean).join(' ');

    const buttonBaseClass = [
        'px-6 py-3 font-semibold transition-colors',
        buttonRoundness !== 'medium' ? `rounded-${buttonRoundness}` : 'rounded-md',
        buttonColor !== 'primary' ? `bg-${buttonColor}` : 'bg-primary',
        'text-white',
        'hover:opacity-90',
    ].filter(Boolean).join(' ');

    const secondaryButtonClass = [
        'px-6 py-3 font-semibold transition-colors',
        buttonRoundness !== 'medium' ? `rounded-${buttonRoundness}` : 'rounded-md',
        'bg-transparent',
        buttonColor !== 'primary' ? `border border-${buttonColor} text-${buttonColor}` : 'border border-primary text-primary',
        'hover:opacity-90',
    ].filter(Boolean).join(' ');

    const showPrimary = buttonLayout === 'primary' || buttonLayout === 'both';
    const showSecondary = buttonLayout === 'secondary' || buttonLayout === 'both';

    return (
        <section className={sectionClass}>
            <div id="main-content" className={mainContentClass}>
                <h2 className={headingClass}>{title}</h2>
                <p className={subtitleClass}>{subtitle}</p>
                <div className={`flex gap-4 mt-6 ${textAlign === 'center' ? 'justify-center' : textAlign === 'right' ? 'justify-end' : 'justify-start'}`}>
                    {showPrimary && (
                        <a href={primaryButtonLink} className={buttonBaseClass}>
                            {primaryButtonText}
                        </a>
                    )}
                    {showSecondary && (
                        <a href={secondaryButtonLink} className={secondaryButtonClass}>
                            {secondaryButtonText}
                        </a>
                    )}
                </div>
            </div>
        </section>
    );
}

export const properties: BlockProperties = {
    name: "CTA Section",
    description: "A modern call-to-action section with customizable content and theming",

    contentFields: {
        title: {
            type: "text",
            name: "title",
            label: "Title",
            description: "Main heading for the CTA section",
            defaultValue: "Ready to get started?"
        },
        subtitle: {
            type: "textarea",
            name: "subtitle",
            label: "Subtitle",
            description: "Supporting text below the title",
            defaultValue: "Join thousands of companies already growing with our platform."
        },
        primaryButtonText: {
            type: "text",
            name: "primaryButtonText",
            label: "Primary Button Text",
            description: "Text for the primary action button",
            defaultValue: "Get Started"
        },
        primaryButtonLink: {
            type: "text",
            name: "primaryButtonLink",
            label: "Primary Button Link",
            description: "URL for the primary button",
            defaultValue: "#"
        },
        secondaryButtonText: {
            type: "text",
            name: "secondaryButtonText",
            label: "Secondary Button Text",
            description: "Text for the secondary action button",
            defaultValue: "Learn More"
        },
        secondaryButtonLink: {
            type: "text",
            name: "secondaryButtonLink",
            label: "Secondary Button Link",
            description: "URL for the secondary button",
            defaultValue: "#"
        }
    }, 
    
    
    themeFields: {
        backgroundColor: {
            type: "select",
            name: "backgroundColor",
            label: "Background Color",
            description: "Choose the background color scheme",
            options: themeColorOptions,
            defaultValue: "background"
        }, 
        headingColor: {
            type: "select",
            name: "headingColor",
            label: "Heading Color",
            description: "Choose the heading color scheme",
            options: themeColorOptions,
            defaultValue: "foreground"
        },
        paragraphColor: {
            type: "select",
            name: "paragraphColor",
            label: "Paragraph Color",
            description: "Choose the paragraph color scheme",
            options: themeColorOptions,
            defaultValue: "muted"
        },        
        buttonColor: {
            type: "select",
            name: "buttonColor",
            label: "Button Color",
            description: "Choose the button color scheme",
            options: themeColorOptions,
            defaultValue: "primary"
        },        
        borderColor: {
            type: "select",
            name: "borderColor",
            label: "Border Color",
            description: "Choose the border color scheme",
            options: themeColorOptions,
            defaultValue: "border"
        },        
        borderWidth: {
            type: "select",
            name: "borderWidth",
            label: "Border Width",
            description: "Border width for the section",
            options: borderWidthOptions,
            defaultValue: "none"
        },        
        shadowSize: {
            type: "select",
            name: "shadowSize",
            label: "Shadow Size",
            description: "Shadow size for the section",
            options: shadowOptions,
            defaultValue: "none"
        },
        roundness: {
            type: "select",
            name: "roundness",
            label: "Roundness",
            description: "Border radius for detached sections",
            options: roundnessOptions,
            defaultValue: "medium"
        },
        buttonRoundness: {
            type: "select",
            name: "buttonRoundness",
            label: "Button Roundness",
            description: "Border radius for buttons",
            options: roundnessOptions,
            defaultValue: "medium"
        },
        spacing: {
            type: "multi_toggle",
            name: "spacing",
            label: "Spacing",
            description: "Add vertical padding to the section",
            options: [
                { label: "Top", value: "top" },
                { label: "Bottom", value: "bottom" }
            ],
            defaultValue: []
        }
    },
    
    
    layoutFields: {
        layout: {
            type: "select",
            name: "layout",
            label: "Content Alignment",
            description: "How to align the content",
            options: alignmentOptions,
            defaultValue: "center"
        },        
        buttonLayout: {
            type: "select",
            name: "buttonLayout",
            label: "Button Layout",
            description: "Which buttons to show",
            options: [
                { label: "Primary Only", value: "primary" },
                { label: "Both Buttons", value: "both" },
                { label: "Secondary Only", value: "secondary" }
            ],
            defaultValue: "both"
        },
        detached: {
            type: "switch",
            name: "detached",
            label: "Detached",
            description: "Whether the section should be detached from the page edges with rounded corners",
            defaultValue: false
        }
    }
};

export default CTASection;
