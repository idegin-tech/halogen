"use client"

import React from 'react'
import Link from "next/link"
import { BlockProperties } from "@halogen/common/types";
import { backgroundThemeOptions, roundnessOptions, shadowOptions, shadowColorOptions } from '../../../config';

interface ColorVariables {
    [key: string]: string;
}

export function CTASection(fields: typeof properties.contentFields & typeof properties.themeFields & typeof properties.layoutFields & { colorVariables?: ColorVariables }) {
    const title = fields?.title?.value || "Ready to get started?";
    const subtitle = fields?.subtitle?.value || "Join thousands of companies already growing with our platform.";
    const primaryButtonText = fields?.primaryButtonText?.value || "Get Started";
    const primaryButtonLink = fields?.primaryButtonLink?.value || "#";
    const secondaryButtonText = fields?.secondaryButtonText?.value || "Learn More";
    const secondaryButtonLink = fields?.secondaryButtonLink?.value || "#";

    const layout = fields?.layout?.value || "center";
    const buttonLayout = fields?.buttonLayout?.value || "both";
    const detached = fields?.detached?.value || false;
    const spacing = fields?.spacing?.value || [];
    const roundness = fields?.roundness?.value || "medium";
    const buttonRoundness = fields?.buttonRoundness?.value || "medium";
    const borderWidth = fields?.borderWidth?.value || "none";
    const shadowSize = fields?.shadowSize?.value || "none";
    const shadowColor = fields?.shadowColor?.value || "border";

    // Individual color selections
    const backgroundColor = fields?.backgroundColor?.value || "background";
    const headingColor = fields?.headingColor?.value || "primary";
    const paragraphColor = fields?.paragraphColor?.value || "muted";
    const buttonColor = fields?.buttonColor?.value || "primary";
    const borderColor = fields?.borderColor?.value || "border";

    const colorVariables = fields?.colorVariables || {}; const getColor = (colorKey: string, fallback: string) => {
        return colorVariables[colorKey] || fallback;
    }; const getRoundnessClass = (roundness: string) => {
        switch (roundness) {
            case "none":
                return "";
            case "medium":
                return "rounded-lg";
            case "large":
                return "rounded-xl";
            case "extra-large":
                return "rounded-2xl";
            case "full":
                return "rounded-full";
            default:
                return "rounded-lg";
        }
    }; const getSpacingClass = (spacing: string[]) => {
        const classes = [];
        if (spacing.includes('top')) {
            classes.push('pt-16');
        }
        if (spacing.includes('bottom')) {
            classes.push('pb-16');
        }
        return classes.join(' ');
    };    const getBorderWidthClass = (borderWidth: string) => {
        switch (borderWidth) {
            case "none":
                return "";
            case "small":
                return "border";
            case "large":
                return "border-4";
            case "extra-large":
                return "border-8";
            default:
                return "";
        }
    };    const getShadowStyle = (shadowSize: string, shadowColor: string) => {
        if (shadowSize === "none") return {};
        
        const shadowColorValue = (() => {
            switch (shadowColor) {
                case "primary":
                    return getColor('primary', '#6D3DF2');
                case "secondary":
                    return getColor('secondary', '#F55B00');
                case "accent":
                    return getColor('accent', '#F1F5F9');
                case "muted":
                    return getColor('muted', '#F5F5F6');
                case "border":
                    return getColor('border', '#E4E4E7');
                default:
                    return getColor('border', '#E4E4E7');
            }
        })();

        // Convert hex to rgba for shadow
        const hexToRgba = (hex: string, alpha: number = 0.25) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        const shadowColorRgba = hexToRgba(shadowColorValue, 0.25);

        switch (shadowSize) {
            case "small":
                return { boxShadow: `0 1px 2px 0 ${shadowColorRgba}` };
            case "large":
                return { boxShadow: `0 10px 15px -3px ${shadowColorRgba}, 0 4px 6px -2px ${hexToRgba(shadowColorValue, 0.05)}` };
            case "extra-large":
                return { boxShadow: `0 25px 50px -12px ${shadowColorRgba}` };
            default:
                return {};
        }
    };const getColorStyles = (backgroundColor: string, headingColor: string, paragraphColor: string, buttonColor: string, borderColor: string, shadowColor: string) => {// Helper function to get foreground color for a given color scheme
        const getForegroundColor = (colorScheme: string) => {
            switch (colorScheme) {
                case "primary":
                    return getColor('primary-foreground', '#FAFAFA');
                case "primary-foreground":
                    return getColor('primary', '#6D3DF2');
                case "secondary":
                    return getColor('secondary-foreground', '#0F0F10');
                case "secondary-foreground":
                    return getColor('secondary', '#F55B00');
                case "muted":
                    return getColor('muted-foreground', '#757578');
                case "muted-foreground":
                    return getColor('muted', '#F5F5F6'); case "card":
                    return getColor('card-foreground', '#0A0A0A');
                case "card-foreground":
                    return getColor('card', '#FFFFFF');
                case "accent":
                    return getColor('accent-foreground', '#FAFAFA');
                case "accent-foreground":
                    return getColor('accent', '#F1F5F9');
                case "foreground":
                    return getColor('background', '#FFFFFF');
                case "border":
                    return getColor('foreground', '#0A0A0A');
                default: // background
                    return getColor('foreground', '#0A0A0A');
            }
        };

        // Helper function to get color value for a given color scheme
        const getSchemeColor = (colorScheme: string) => {
            switch (colorScheme) {
                case "primary":
                    return getColor('primary', '#6D3DF2');
                case "primary-foreground":
                    return getColor('primary-foreground', '#FAFAFA');
                case "secondary":
                    return getColor('secondary', '#F55B00');
                case "secondary-foreground":
                    return getColor('secondary-foreground', '#0F0F10');
                case "muted":
                    return getColor('muted', '#F5F5F6');
                case "muted-foreground":
                    return getColor('muted-foreground', '#757578'); case "card":
                    return getColor('card', '#FFFFFF');
                case "card-foreground":
                    return getColor('card-foreground', '#0A0A0A');
                case "accent":
                    return getColor('accent', '#F1F5F9');
                case "accent-foreground":
                    return getColor('accent-foreground', '#0F172A');
                case "foreground":
                    return getColor('foreground', '#0A0A0A');
                case "border":
                    return getColor('border', '#E4E4E7');
                default: // background
                    return getColor('background', '#FFFFFF');
            }
        };        return {
            section: {
                backgroundColor: getSchemeColor(backgroundColor),
                borderColor: getSchemeColor(borderColor),
                ...getShadowStyle(shadowSize, shadowColor),
            },heading: {
                color: ["background", "card"].includes(headingColor) ? getForegroundColor(backgroundColor) : getSchemeColor(headingColor),
            }, subtitle: {
                color: ["background", "card"].includes(paragraphColor) ? getForegroundColor(backgroundColor) : getSchemeColor(paragraphColor),
            },
            primaryButton: {
                backgroundColor: getSchemeColor(buttonColor),
                color: getForegroundColor(buttonColor),
            }, secondaryButton: {
                borderColor: ["background", "card", "border"].includes(buttonColor) ? getColor('border', '#E4E4E7') : getSchemeColor(buttonColor),
                color: ["background", "card"].includes(buttonColor) ? getForegroundColor(backgroundColor) : getSchemeColor(buttonColor),
                backgroundColor: 'transparent',
            }
        };
    };

    const colorStyles = getColorStyles(backgroundColor, headingColor, paragraphColor, buttonColor, borderColor, shadowColor);

    const showPrimary = buttonLayout === "primary" || buttonLayout === "both";
    const showSecondary = buttonLayout === "secondary" || buttonLayout === "both";

    const layoutClasses = {
        center: "text-center",
        left: "text-left",
        right: "text-right"
    };

    const buttonContainerClasses = {
        center: "justify-center",
        left: "justify-start",
        right: "justify-end"
    };    return (
        <section
            className={getSpacingClass(spacing)}
        >
            <div
                className={`w-full ${detached ? '' : getBorderWidthClass(borderWidth) || 'border-y'}`}
                style={{
                    ...(detached
                        ? {}
                        : {
                            ...colorStyles.section,
                            borderTopWidth: borderWidth === 'none' ? '1px' : undefined,
                            borderBottomWidth: borderWidth === 'none' ? '1px' : undefined,
                            borderTopStyle: 'solid',
                            borderBottomStyle: 'solid',
                        }
                    ),
                }}
            >                <div
                    className={`container md:py-24 py-16 mx-auto px-4 md:px-6 ${detached ? `${getBorderWidthClass(borderWidth)} ${getRoundnessClass(roundness)}` : ''}`}
                    style={{
                        ...(detached
                            ? {
                                ...colorStyles.section,
                                borderStyle: 'solid',
                            }
                            : {}
                        ),
                    }}
                >
                    <div className={`max-w-4xl mx-auto ${layoutClasses[layout as keyof typeof layoutClasses]}`}>
                        <h2
                            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 md:mb-6"
                            style={colorStyles.heading}
                        >
                            {title}
                        </h2>

                        <p
                            className="text-lg md:text-xl mb-8 md:mb-10 max-w-2xl mx-auto"
                            style={colorStyles.subtitle}
                        >
                            {subtitle}
                        </p>

                        <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 items-center ${buttonContainerClasses[layout as keyof typeof buttonContainerClasses]}`}>                            {showPrimary && (<Link
                                href={primaryButtonLink}
                                className={`inline-flex h-12 md:h-14 items-center justify-center ${getRoundnessClass(buttonRoundness)} px-8 md:px-10 py-3 text-base md:text-lg font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full sm:w-auto`}
                                style={colorStyles.primaryButton}
                            >
                                {primaryButtonText}
                            </Link>
                            )}

                            {showSecondary && (
                                <Link
                                    href={secondaryButtonLink}
                                    className={`inline-flex h-12 md:h-14 items-center justify-center ${getRoundnessClass(buttonRoundness)} border-2 px-8 md:px-10 py-3 text-base md:text-lg font-semibold transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full sm:w-auto`}
                                    style={{
                                        ...colorStyles.secondaryButton,
                                        borderWidth: '2px',
                                        borderStyle: 'solid',
                                    }}
                                >
                                    {secondaryButtonText}
                                </Link>
                            )}
                        </div>
                    </div>
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
            options: backgroundThemeOptions,
            defaultValue: "background"
        }, headingColor: {
            type: "select",
            name: "headingColor",
            label: "Heading Color",
            description: "Choose the heading color scheme",
            options: backgroundThemeOptions,
            defaultValue: "primary"
        },
        paragraphColor: {
            type: "select",
            name: "paragraphColor",
            label: "Paragraph Color",
            description: "Choose the paragraph color scheme",
            options: backgroundThemeOptions,
            defaultValue: "muted"
        },        buttonColor: {
            type: "select",
            name: "buttonColor",
            label: "Button Color",
            description: "Choose the button color scheme",
            options: backgroundThemeOptions,
            defaultValue: "primary"
        },        
        borderColor: {
            type: "select",
            name: "borderColor",
            label: "Border Color",
            description: "Choose the border color scheme",
            options: backgroundThemeOptions,
            defaultValue: "border"
        },        borderWidth: {
            type: "select",
            name: "borderWidth",
            label: "Border Width",
            description: "Border width for the section",
            options: [
                { label: "None", value: "none" },
                { label: "Small", value: "small" },
                { label: "Large", value: "large" },
                { label: "Extra Large", value: "extra-large" }
            ],
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
        shadowColor: {
            type: "select",
            name: "shadowColor",
            label: "Shadow Color",
            description: "Choose the shadow color scheme",
            options: shadowColorOptions,
            defaultValue: "border"
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
            label: "Text Alignment",
            description: "How to align the content",
            options: [
                { label: "Center", value: "center" },
                { label: "Left", value: "left" },
                { label: "Right", value: "right" }
            ],
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
