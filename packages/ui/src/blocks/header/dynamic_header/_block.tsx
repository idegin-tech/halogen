"use client"

import React, { useState, useEffect } from 'react'
import Link from "next/link"
import { BlockProperties } from "@halogen/common/types"
import { backgroundThemeOptions, roundnessOptions } from '../../../config'
import { cn } from '../../../utils/classNames'

interface ColorVariables {
  [key: string]: string;
}

interface LinkItem {
  text: string;
  url: string;
}

export function DynamicHeader(fields: typeof properties.contentFields & typeof properties.themeFields & typeof properties.layoutFields & { colorVariables?: ColorVariables }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Content fields
    const logo = fields?.logo?.value || "";
    const logoAlt = fields?.logoAlt?.value || "Logo";
    const links = fields?.links?.value || [];

    // CTA buttons
    const primaryButtonText = fields?.primaryButtonText?.value || "";
    const primaryButtonLink = fields?.primaryButtonLink?.value || "#";
    const secondaryButtonText = fields?.secondaryButtonText?.value || "";
    const secondaryButtonLink = fields?.secondaryButtonLink?.value || "#";

    // Layout fields
    const linksAlignment = fields?.linksAlignment?.value || "left";
    const detached = fields?.detached?.value || false;
    const sticky = fields?.sticky?.value || false;
    const spacing = fields?.spacing?.value || [];
    const roundness = fields?.roundness?.value || "medium";
    const buttonRoundness = fields?.buttonRoundness?.value || "medium";

    // Theme fields
    const backgroundColor = fields?.backgroundColor?.value || "background";
    const textColor = fields?.textColor?.value || "foreground";
    const buttonColor = fields?.buttonColor?.value || "primary";

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
            classes.push('pt-8');
        }
        if (spacing.includes('bottom')) {
            classes.push('pb-8');
        }
        return classes.join(' ');
    };

    useEffect(() => {
        if (!sticky) return;

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [sticky]);

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

    const linksAlignmentClasses = {
        left: "justify-start",
        center: "justify-center",
        right: "justify-end"
    };
    
    return (
        <header 
            className={cn(
                getSpacingClass(spacing),
                sticky && "sticky top-0 z-50"
            )}
        >
            <div
                className={cn(
                    "w-full",
                    getBackgroundColorClass(backgroundColor),
                    !detached && "border-b",
                    !detached && getBorderColorClass(backgroundColor)
                )}
            >
                <div
                    className={cn(
                        "container mx-auto px-4 md:px-6 transition-all duration-300",
                        detached && "border",
                        detached && getBorderColorClass(backgroundColor),
                        detached && getRoundnessClass(roundness),
                        detached && getBackgroundColorClass(backgroundColor),
                        ((sticky && isScrolled) || detached) && "shadow-lg"
                    )}
                >
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        {logo ? (
                            <Link href="/" className="flex items-center">
                                <img
                                    src={logo}
                                    alt={logoAlt}
                                    width={120}
                                    height={40}
                                    className="h-8 md:h-10 w-auto"
                                />
                            </Link>
                        ) : (
                            <Link href="/" className={cn(
                                "text-xl md:text-2xl font-bold",
                                getTextColorClass(textColor)
                            )}>
                                {logoAlt}
                            </Link>
                        )}
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <div className={cn(
                            "flex space-x-6",
                            linksAlignmentClasses[linksAlignment as keyof typeof linksAlignmentClasses]
                        )}>
                            {links.map((link: LinkItem, index: number) => (
                                <Link
                                    key={index}
                                    href={link.url || "#"}
                                    className={cn(
                                        "text-sm lg:text-base font-medium hover:opacity-70 transition-opacity",
                                        getTextColorClass(textColor)
                                    )}
                                >
                                    {link.text || `Link ${index + 1}`}
                                </Link>
                            ))}
                        </div>
                    </nav>

                    {/* CTA Buttons and Mobile Menu Toggle */}
                    <div className="flex items-center space-x-4">
                        {/* CTA Buttons - Desktop */}
                        <div className="hidden md:flex items-center space-x-3">
                            {secondaryButtonText && (
                                <Link
                                    href={secondaryButtonLink}
                                    className={cn(
                                        "inline-flex items-center justify-center",
                                        getRoundnessClass(buttonRoundness),
                                        "border-2 px-4 py-2 text-sm font-medium transition-all hover:shadow-md",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                        secondaryButtonColorClasses[buttonColor as keyof typeof secondaryButtonColorClasses] || secondaryButtonColorClasses.primary
                                    )}
                                >
                                    {secondaryButtonText}
                                </Link>
                            )}
                            {primaryButtonText && (
                                <Link
                                    href={primaryButtonLink}
                                    className={cn(
                                        "inline-flex items-center justify-center",
                                        getRoundnessClass(buttonRoundness),
                                        "px-4 py-2 text-sm font-medium shadow-md transition-all hover:shadow-lg hover:scale-105",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                        buttonColorClasses[buttonColor as keyof typeof buttonColorClasses] || buttonColorClasses.primary
                                    )}
                                >
                                    {primaryButtonText}
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className={cn(
                                "md:hidden p-2 rounded-md hover:bg-opacity-10 hover:bg-gray-500 transition-colors",
                                getTextColorClass(textColor)
                            )}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle mobile menu"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className={cn(
                        "md:hidden py-4 border-t",
                        getBorderColorClass(backgroundColor)
                    )}>
                        <div className="flex flex-col space-y-4">
                            {/* Mobile Navigation Links */}
                            {links.map((link: LinkItem, index: number) => (
                                <Link
                                    key={index}
                                    href={link.url || "#"}
                                    className={cn(
                                        "text-base font-medium hover:opacity-70 transition-opacity py-2",
                                        getTextColorClass(textColor)
                                    )}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.text || `Link ${index + 1}`}
                                </Link>
                            ))}

                            {/* Mobile CTA Buttons */}
                            <div className="flex flex-col space-y-3 pt-4">
                                {secondaryButtonText && (
                                    <Link
                                        href={secondaryButtonLink}
                                        className={cn(
                                            "inline-flex items-center justify-center",
                                            getRoundnessClass(buttonRoundness),
                                            "border-2 px-4 py-3 text-base font-medium transition-all hover:shadow-md",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                            secondaryButtonColorClasses[buttonColor as keyof typeof secondaryButtonColorClasses] || secondaryButtonColorClasses.primary
                                        )}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {secondaryButtonText}
                                    </Link>
                                )}
                                {primaryButtonText && (
                                    <Link
                                        href={primaryButtonLink}
                                        className={cn(
                                            "inline-flex items-center justify-center",
                                            getRoundnessClass(buttonRoundness),
                                            "px-4 py-3 text-base font-medium shadow-md transition-all hover:shadow-lg",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                            buttonColorClasses[buttonColor as keyof typeof buttonColorClasses] || buttonColorClasses.primary
                                        )}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {primaryButtonText}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </div>
        </header>
    );
}

export const properties: BlockProperties = {
    name: "Dynamic Header",
    description: "A flexible header component with theme and layout options",
    
    contentFields: {
        logo: {
            type: "text",
            name: "logo",
            label: "Logo URL",
            description: "URL for the logo image",
            defaultValue: ""
        },
        logoAlt: {
            type: "text",
            name: "logoAlt",
            label: "Logo Alt Text / Brand Name",
            description: "Alt text for logo or brand name if no logo",
            defaultValue: "Logo"
        },        links: {
            type: "list",
            name: "links",
            label: "Navigation Links",
            description: "Navigation menu items",
            value: {
                name: "Navigation Link",
                description: "A navigation link item",
                contentFields: {
                    text: {
                        type: "text",
                        name: "text",
                        label: "Link Text",
                        description: "Display text for the link",
                        defaultValue: "Link"
                    },
                    url: {
                        type: "text",
                        name: "url",
                        label: "Link URL",
                        description: "URL for the link",
                        defaultValue: "#"
                    }
                },
                themeFields: {},
                layoutFields: {}
            },
            defaultValue: [
                { text: "Home", url: "/" },
                { text: "About", url: "/about" },
                { text: "Services", url: "/services" },
                { text: "Contact", url: "/contact" }
            ]
        },
        primaryButtonText: {
            type: "text",
            name: "primaryButtonText",
            label: "Primary Button Text",
            description: "Text for the primary CTA button",
            defaultValue: ""
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
            description: "Text for the secondary CTA button",
            defaultValue: ""
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
        textColor: {
            type: "select",
            name: "textColor",
            label: "Text Color",
            description: "Choose the text color scheme",
            options: backgroundThemeOptions,
            defaultValue: "foreground"
        },
        buttonColor: {
            type: "select",
            name: "buttonColor",
            label: "Button Color",
            description: "Choose the button color scheme",
            options: backgroundThemeOptions,
            defaultValue: "primary"
        }
    },    layoutFields: {
        linksAlignment: {
            type: "select",
            name: "linksAlignment",
            label: "Links Alignment",
            description: "How to align the navigation links",
            options: [
                { label: "Left", value: "left" },
                { label: "Center", value: "center" },
                { label: "Right", value: "right" }
            ],
            defaultValue: "left"
        },
        detached: {
            type: "switch",
            name: "detached",
            label: "Detached",
            description: "Whether the header should be detached from the page edges with rounded corners and top spacing",
            defaultValue: false
        },
        sticky: {
            type: "switch",
            name: "sticky",
            label: "Sticky",
            description: "Whether the header should stick to the top when scrolling",
            defaultValue: false
        },
        spacing: {
            type: "multi_toggle",
            name: "spacing",
            label: "Spacing",
            description: "Add vertical padding to the header",
            options: [
                { label: "Top", value: "top" },
                { label: "Bottom", value: "bottom" }
            ],
            defaultValue: []
        },
        roundness: {
            type: "select",
            name: "roundness",
            label: "Roundness",
            description: "Border radius for detached headers",
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
        }
    }
};
