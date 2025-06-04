"use client"

import React, { useState, useEffect } from 'react'
import Link from "next/link"
import { BlockProperties } from "@halogen/common/types"
import { backgroundThemeOptions, roundnessOptions } from '../../../config'

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
    const secondaryButtonLink = fields?.secondaryButtonLink?.value || "#";    // Layout fields
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

    const colorVariables = fields?.colorVariables || {};

    const getColor = (colorKey: string, fallback: string) => {
        return colorVariables[colorKey] || fallback;
    };    const getRoundnessClass = (roundness: string) => {
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
    };    const getSpacingClass = (spacing: string[]) => {
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

    const getColorStyles = (backgroundColor: string, textColor: string, buttonColor: string) => {
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
                    return getColor('muted', '#F5F5F6');
                case "card":
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
                    return getColor('muted-foreground', '#757578');
                case "card":
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
        };

        return {
            header: {
                backgroundColor: getSchemeColor(backgroundColor),
                borderColor: ["background", "card"].includes(backgroundColor) ? getColor('border', '#E4E4E7') : getSchemeColor(backgroundColor),
            },
            text: {
                color: ["background", "card"].includes(textColor) ? getForegroundColor(backgroundColor) : getSchemeColor(textColor),
            },
            primaryButton: {
                backgroundColor: getSchemeColor(buttonColor),
                color: getForegroundColor(buttonColor),
            },
            secondaryButton: {
                borderColor: ["background", "card", "border"].includes(buttonColor) ? getColor('border', '#E4E4E7') : getSchemeColor(buttonColor),
                color: ["background", "card"].includes(buttonColor) ? getForegroundColor(backgroundColor) : getSchemeColor(buttonColor),
                backgroundColor: 'transparent',
            }
        };
    };

    const colorStyles = getColorStyles(backgroundColor, textColor, buttonColor);    const linksAlignmentClasses = {
        left: "justify-start",
        center: "justify-center",
        right: "justify-end"
    };
    
    return (
        <header 
            className={`${getSpacingClass(spacing)} ${sticky ? "sticky top-0 z-50" : ""}`}
        >
            <div
                className={`w-full ${detached ? '' : 'border-b'}`}
                style={{
                    ...(detached
                        ? {}
                        : {
                            ...colorStyles.header,
                            borderBottomWidth: '1px',
                            borderBottomStyle: 'solid',
                        }
                    ),
                }}
            >
                <div
                    className={`container mx-auto px-4 md:px-6 ${detached ? `border ${getRoundnessClass(roundness)} ${(sticky && isScrolled) || detached ? "shadow-lg" : ""}` : ''} transition-all duration-300`}
                    style={{
                        ...(detached
                            ? {
                                ...colorStyles.header,
                                borderWidth: '1px',
                                borderStyle: 'solid',
                            }
                            : {}
                        ),
                    }}
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
                            <Link href="/" className="text-xl md:text-2xl font-bold" style={colorStyles.text}>
                                {logoAlt}
                            </Link>
                        )}
                    </div>                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <div className={`flex space-x-6 ${linksAlignmentClasses[linksAlignment as keyof typeof linksAlignmentClasses]}`}>
                            {links.map((link: LinkItem, index: number) => (
                                <Link
                                    key={index}
                                    href={link.url || "#"}
                                    className="text-sm lg:text-base font-medium hover:opacity-70 transition-opacity"
                                    style={colorStyles.text}
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
                                    className={`inline-flex items-center justify-center ${getRoundnessClass(buttonRoundness)} border-2 px-4 py-2 text-sm font-medium transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                                    style={{
                                        ...colorStyles.secondaryButton,
                                        borderWidth: '2px',
                                        borderStyle: 'solid',
                                    }}
                                >
                                    {secondaryButtonText}
                                </Link>
                            )}
                            {primaryButtonText && (
                                <Link
                                    href={primaryButtonLink}
                                    className={`inline-flex items-center justify-center ${getRoundnessClass(buttonRoundness)} px-4 py-2 text-sm font-medium shadow-md transition-all hover:shadow-lg hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                                    style={colorStyles.primaryButton}
                                >
                                    {primaryButtonText}
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 rounded-md hover:bg-opacity-10 hover:bg-gray-500 transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle mobile menu"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                style={colorStyles.text}
                            >
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden py-4 border-t" style={{ borderColor: colorStyles.header.borderColor }}>
                        <div className="flex flex-col space-y-4">
                            {/* Mobile Navigation Links */}
                            {links.map((link: LinkItem, index: number) => (
                                <Link
                                    key={index}
                                    href={link.url || "#"}
                                    className="text-base font-medium hover:opacity-70 transition-opacity py-2"
                                    style={colorStyles.text}
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
                                        className={`inline-flex items-center justify-center ${getRoundnessClass(buttonRoundness)} border-2 px-4 py-3 text-base font-medium transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                                        style={{
                                            ...colorStyles.secondaryButton,
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                        }}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {secondaryButtonText}
                                    </Link>
                                )}
                                {primaryButtonText && (
                                    <Link
                                        href={primaryButtonLink}
                                        className={`inline-flex items-center justify-center ${getRoundnessClass(buttonRoundness)} px-4 py-3 text-base font-medium shadow-md transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                                        style={colorStyles.primaryButton}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {primaryButtonText}
                                    </Link>
                                )}                            </div>
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
