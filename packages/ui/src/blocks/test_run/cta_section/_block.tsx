"use client"

import React from 'react'
import Link from "next/link"
import { BlockProperties } from "@halogen/common/types";
import { backgroundThemeOptions, roundnessOptions, shadowOptions } from '../../../config';
import { cn } from '../../../utils/classNames';

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
    const spacing = fields?.spacing?.value || [];    const roundness = fields?.roundness?.value || "medium";
    const buttonRoundness = fields?.buttonRoundness?.value || "medium";
    const borderWidth = fields?.borderWidth?.value || "none";
    const shadowSize = fields?.shadowSize?.value || "none";

    // Individual color selections
    const backgroundColor = fields?.backgroundColor?.value || "background";
    const headingColor = fields?.headingColor?.value || "foreground";
    const paragraphColor = fields?.paragraphColor?.value || "muted-foreground";
    const buttonColor = fields?.buttonColor?.value || "primary";
    const borderColor = fields?.borderColor?.value || "border";

    const getBackgroundColorClass = (colorName: string) => {
        switch (colorName) {
            case "primary": return "bg-primary";
            case "primary-foreground": return "bg-primary-foreground";
            case "secondary": return "bg-secondary";
            case "secondary-foreground": return "bg-secondary-foreground";
            case "background": return "bg-background";
            case "foreground": return "bg-foreground";
            case "muted": return "bg-muted";
            case "muted-foreground": return "bg-muted-foreground";
            case "card": return "bg-card";
            case "card-foreground": return "bg-card-foreground";
            case "accent": return "bg-accent";
            case "accent-foreground": return "bg-accent-foreground";
            case "border": return "bg-border";
            default: return "bg-background";
        }
    };

    const getTextColorClass = (colorName: string) => {
        switch (colorName) {
            case "primary": return "text-primary";
            case "primary-foreground": return "text-primary-foreground";
            case "secondary": return "text-secondary";
            case "secondary-foreground": return "text-secondary-foreground";
            case "background": return "text-background";
            case "foreground": return "text-foreground";
            case "muted": return "text-muted";
            case "muted-foreground": return "text-muted-foreground";
            case "card": return "text-card";
            case "card-foreground": return "text-card-foreground";
            case "accent": return "text-accent";
            case "accent-foreground": return "text-accent-foreground";
            case "border": return "text-border";
            default: return "text-foreground";
        }
    };

    const getBorderColorClass = (colorName: string) => {
        switch (colorName) {
            case "primary": return "border-primary";
            case "primary-foreground": return "border-primary-foreground";
            case "secondary": return "border-secondary";
            case "secondary-foreground": return "border-secondary-foreground";
            case "background": return "border-background";
            case "foreground": return "border-foreground";
            case "muted": return "border-muted";
            case "muted-foreground": return "border-muted-foreground";
            case "card": return "border-card";
            case "card-foreground": return "border-card-foreground";
            case "accent": return "border-accent";
            case "accent-foreground": return "border-accent-foreground";
            case "border": return "border-border";
            default: return "border-border";
        }
    };

    const getRoundnessClass = (roundness: string) => {
        switch (roundness) {
            case "none": return "";
            case "medium": return "rounded-lg";
            case "large": return "rounded-xl";
            case "extra-large": return "rounded-2xl";
            case "full": return "rounded-full";
            default: return "rounded-lg";
        }
    };

    const getSpacingClass = (spacing: string[]) => {
        const classes = [];
        if (spacing.includes('top')) {
            classes.push('pt-16');
        }
        if (spacing.includes('bottom')) {
            classes.push('pb-16');
        }
        return classes.join(' ');
    };

    const getBorderWidthClass = (borderWidth: string) => {
        switch (borderWidth) {
            case "none": return "";
            case "small": return "border";
            case "large": return "border-4";
            case "extra-large": return "border-8";
            default: return "";
        }
    };

    const getShadowClass = (shadowSize: string) => {
        switch (shadowSize) {
            case "small": return "shadow-sm";
            case "large": return "shadow-lg";
            case "extra-large": return "shadow-xl";
            default: return "";
        }
    };

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

    const buttonColorClasses = {
        primary: cn("bg-primary text-primary-foreground hover:bg-primary/90"),
        secondary: cn("bg-secondary text-secondary-foreground hover:bg-secondary/90"),
        background: cn("bg-background text-foreground hover:bg-muted/50"),
        foreground: cn("bg-foreground text-background hover:bg-foreground/90"),
        muted: cn("bg-muted text-muted-foreground hover:bg-muted/50"),
        accent: cn("bg-accent text-accent-foreground hover:bg-accent/90"),
        border: cn("bg-border text-foreground hover:bg-border/90"),
        card: cn("bg-card text-card-foreground hover:bg-card/90")
    };

    const secondaryButtonColorClasses = {
        primary: cn("border-primary text-primary hover:bg-primary/10"),
        secondary: cn("border-secondary text-secondary hover:bg-secondary/10"),
        background: cn("border-background text-foreground hover:bg-background/10"),
        foreground: cn("border-foreground text-foreground hover:bg-foreground/10"),
        muted: cn("border-muted text-muted-foreground hover:bg-muted/10"),
        accent: cn("border-accent text-accent-foreground hover:bg-accent/10"),
        border: cn("border-border text-foreground hover:bg-border/10"),
        card: cn("border-card text-card-foreground hover:bg-card/10")
    };

    return (
        <section
            className={getSpacingClass(spacing)}
        >
            <div
                className={cn(
                    "w-full",
                    getBackgroundColorClass(backgroundColor),
                    !detached && (getBorderWidthClass(borderWidth) || 'border-y'),
                    !detached && getBorderColorClass(borderColor),
                    getShadowClass(shadowSize)
                )}
            >
                <div
                    className={cn(
                        "container md:py-24 py-16 mx-auto px-4 md:px-6",
                        detached && getBorderWidthClass(borderWidth),
                        detached && getBorderColorClass(borderColor),
                        detached && getRoundnessClass(roundness),
                        detached && getBackgroundColorClass(backgroundColor),
                        detached && getShadowClass(shadowSize)
                    )}
                >
                    <div className={cn(
                        "max-w-4xl mx-auto",
                        layoutClasses[layout as keyof typeof layoutClasses]
                    )}>
                        <h2
                            className={cn(
                                "text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 md:mb-6",
                                getTextColorClass(headingColor)
                            )}
                        >
                            {title}
                        </h2>

                        <p
                            className={cn(
                                "text-lg md:text-xl mb-8 md:mb-10 max-w-2xl mx-auto",
                                getTextColorClass(paragraphColor)
                            )}
                        >
                            {subtitle}
                        </p>

                        <div className={cn(
                            "flex flex-col sm:flex-row gap-4 sm:gap-6 items-center",
                            buttonContainerClasses[layout as keyof typeof buttonContainerClasses]
                        )}>
                            {showPrimary && (
                                <Link
                                    href={primaryButtonLink}
                                    className={cn(
                                        "inline-flex h-12 md:h-14 items-center justify-center",
                                        getRoundnessClass(buttonRoundness),
                                        "px-8 md:px-10 py-3 text-base md:text-lg font-semibold shadow-lg",
                                        "transition-all hover:shadow-xl hover:scale-105",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                        "w-full sm:w-auto",
                                        buttonColorClasses[buttonColor as keyof typeof buttonColorClasses] || buttonColorClasses.primary
                                    )}
                                >
                                    {primaryButtonText}
                                </Link>
                            )}

                            {showSecondary && (
                                <Link
                                    href={secondaryButtonLink}
                                    className={cn(
                                        "inline-flex h-12 md:h-14 items-center justify-center",
                                        getRoundnessClass(buttonRoundness),
                                        "border-2 px-8 md:px-10 py-3 text-base md:text-lg font-semibold",
                                        "transition-all hover:shadow-md",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                        "w-full sm:w-auto",
                                        secondaryButtonColorClasses[buttonColor as keyof typeof secondaryButtonColorClasses] || secondaryButtonColorClasses.primary
                                    )}
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
        }, 
        headingColor: {
            type: "select",
            name: "headingColor",
            label: "Heading Color",
            description: "Choose the heading color scheme",
            options: backgroundThemeOptions,
            defaultValue: "foreground"
        },
        paragraphColor: {
            type: "select",
            name: "paragraphColor",
            label: "Paragraph Color",
            description: "Choose the paragraph color scheme",
            options: backgroundThemeOptions,
            defaultValue: "muted"
        },        
        buttonColor: {
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
        },        
        borderWidth: {
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
        },        shadowSize: {
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
