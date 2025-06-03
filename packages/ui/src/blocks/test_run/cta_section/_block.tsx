"use client"

import React from 'react'
import Link from "next/link"
import { BlockProperties } from "@halogen/common/types";
import { backgroundThemeOptions } from '../../../config';

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
    const spacing = fields?.spacing?.value || "py-16 md:py-24";
    const buttonLayout = fields?.buttonLayout?.value || "both";

    const theme = fields?.theme?.value || "background";
    const colorVariables = fields?.colorVariables || {};

    const getColor = (colorKey: string, fallback: string) => {
        return colorVariables[colorKey] || fallback;
    };

    const applyOpacity = (color: string, opacity: number) => {
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return color;
    };

    const getThemeClasses = (theme: string) => {
        switch (theme) {
            case "primary":
                return {
                    section: {
                        backgroundColor: applyOpacity(getColor('primary', '#6D3DF2'), 0.05),
                        borderColor: applyOpacity(getColor('primary', '#6D3DF2'), 0.1),
                    },
                    primaryButton: {
                        backgroundColor: getColor('primary', '#6D3DF2'),
                        color: getColor('primary-foreground', '#FAFAFA'),
                    },
                    secondaryButton: {
                        borderColor: getColor('primary', '#6D3DF2'),
                        color: getColor('primary', '#6D3DF2'),
                        backgroundColor: 'transparent',
                    }
                };
            case "secondary":
                return {
                    section: {
                        backgroundColor: applyOpacity(getColor('secondary', '#F55B00'), 0.05),
                        borderColor: applyOpacity(getColor('secondary', '#F55B00'), 0.1),
                    },
                    primaryButton: {
                        backgroundColor: getColor('secondary', '#F55B00'),
                        color: getColor('secondary-foreground', '#0F0F10'),
                    },
                    secondaryButton: {
                        borderColor: getColor('secondary', '#F55B00'),
                        color: getColor('secondary', '#F55B00'),
                        backgroundColor: 'transparent',
                    }
                };
            case "muted":
                return {
                    section: {
                        backgroundColor: getColor('muted', '#F5F5F6'),
                        borderColor: applyOpacity(getColor('muted-foreground', '#757578'), 0.2),
                    },
                    primaryButton: {
                        backgroundColor: getColor('muted-foreground', '#757578'),
                        color: getColor('muted', '#F5F5F6'),
                    },
                    secondaryButton: {
                        borderColor: getColor('muted-foreground', '#757578'),
                        color: getColor('muted-foreground', '#757578'),
                        backgroundColor: 'transparent',
                    }
                };
            default:
                return {
                    section: {
                        backgroundColor: getColor('background', '#FFFFFF'),
                        borderColor: getColor('border', '#E4E4E7'),
                    },
                    primaryButton: {
                        backgroundColor: getColor('foreground', '#0A0A0A'),
                        color: getColor('background', '#FFFFFF'),
                    },
                    secondaryButton: {
                        borderColor: getColor('border', '#E4E4E7'),
                        color: getColor('foreground', '#0A0A0A'),
                        backgroundColor: 'transparent',
                    }
                };
        }
    };

    const themeStyles = getThemeClasses(theme);

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
    };

    return (
        <section
            className={`w-full ${spacing} border-y`}
            style={{
                ...themeStyles.section,
                borderTopWidth: '1px',
                borderBottomWidth: '1px',
                borderTopStyle: 'solid',
                borderBottomStyle: 'solid',
            }}
        >
            <div className="container mx-auto px-4 md:px-6">        <div className={`max-w-4xl mx-auto ${layoutClasses[layout as keyof typeof layoutClasses]}`}>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4 md:mb-6">
                    {title}
                </h2>

                <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto">
                    {subtitle}
                </p>

                <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 items-center ${buttonContainerClasses[layout as keyof typeof buttonContainerClasses]}`}>
                    {showPrimary && (
                        <Link
                            href={primaryButtonLink}
                            className="inline-flex h-12 md:h-14 items-center justify-center rounded-lg px-8 md:px-10 py-3 text-base md:text-lg font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full sm:w-auto"
                            style={themeStyles.primaryButton}
                        >
                            {primaryButtonText}
                        </Link>
                    )}

                    {showSecondary && (
                        <Link
                            href={secondaryButtonLink}
                            className="inline-flex h-12 md:h-14 items-center justify-center rounded-lg border-2 px-8 md:px-10 py-3 text-base md:text-lg font-semibold transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full sm:w-auto"
                            style={{
                                ...themeStyles.secondaryButton,
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
        theme: {
            type: "select",
            name: "theme",
            label: "Theme",
            description: "Choose a color theme for the CTA section",
            options: backgroundThemeOptions,
            defaultValue: "background"
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
        spacing: {
            type: "select",
            name: "spacing",
            label: "Section Spacing",
            description: "Vertical padding for the section",
            options: [
                { label: "Small", value: "py-12 md:py-16" },
                { label: "Medium", value: "py-16 md:py-24" },
                { label: "Large", value: "py-20 md:py-32" }
            ],
            defaultValue: "py-16 md:py-24"
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
        }
    }
};

export default CTASection;
