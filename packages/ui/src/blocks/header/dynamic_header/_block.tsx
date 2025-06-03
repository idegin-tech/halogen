"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { cn } from "../../../utils/classNames"
import { BlockProperties } from "@halogen/common/types"
import { backgroundThemeOptions } from "../../../config"

interface NavigationItem {
  text: string;
  url: string;
}

interface ColorVariables {
  [key: string]: string;
}

export function DynamicHeader(fields: typeof properties.contentFields & typeof properties.themeFields & typeof properties.layoutFields & { colorVariables?: ColorVariables }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Extract field values with proper fallbacks
  const logoText = fields?.logoText?.value || "";
  const logoImage = fields?.logoImage?.value || "";
  const showLogo = fields?.showLogo?.value !== false;
  const showNavigation = fields?.showNavigation?.value !== false;
  const navigationItems = (fields?.navigationItems?.value || []) as NavigationItem[];
  const primaryButtonText = fields?.primaryButtonText?.value || "Get Started";
  const primaryButtonUrl = fields?.primaryButtonUrl?.value || "#";
  const secondaryButtonText = fields?.secondaryButtonText?.value || "Learn More";
  const secondaryButtonUrl = fields?.secondaryButtonUrl?.value || "#";
  const showPrimaryButton = fields?.showPrimaryButton?.value !== false;
  const showSecondaryButton = fields?.showSecondaryButton?.value || false;
    // Theme fields
  const backgroundTheme = fields?.backgroundTheme?.value || "background";
  const gradientType = fields?.gradientType?.value || "none";
  const gradientDirection = fields?.gradientDirection?.value || "to-right"; // eslint-disable-line @typescript-eslint/no-unused-vars
  const gradientStyle = fields?.gradientStyle?.value || "subtle";
  
  console.log(`🔥 DynamicHeader render - backgroundTheme: ${backgroundTheme}, fields:`, fields);
  
  // Layout fields
  const alignment = fields?.alignment?.value || "left";
  const roundedCorners = fields?.roundedCorners?.value || "none";
  const isDetached = fields?.detachedMode?.value || false;  
  
  const getThemeColors = () => {
    if (gradientType !== "none" && gradientStyle) {
      return {
        text: "text-foreground",
        border: "border-border",
        background: "bg-background",
        primaryButton: "bg-primary text-primary-foreground hover:bg-primary/90",
        outlineButton: "border-primary text-primary hover:bg-primary/10",
        mobileMenuBg: "gradient-overlay",
        linkHover: "hover:text-primary/80",
      };
    }const themeMap = {
      background: {
        text: "text-foreground",
        border: "border-border",
        background: "bg-background",
        primaryButton: "bg-primary text-primary-foreground hover:bg-primary/90",
        outlineButton: "border-primary text-primary hover:bg-primary/10",
        mobileMenuBg: "bg-background",
        linkHover: "hover:text-primary",
      },
      primary: {
        text: "text-primary-foreground",
        border: "border-primary-foreground/20",
        background: "bg-primary",
        primaryButton: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        outlineButton: "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10",
        mobileMenuBg: "bg-primary",
        linkHover: "hover:text-primary-foreground/80",
      },
      secondary: {
        text: "text-secondary-foreground",
        border: "border-secondary-foreground/20",
        background: "bg-secondary",
        primaryButton: "bg-primary text-primary-foreground hover:bg-primary/90",
        outlineButton: "border-primary text-primary hover:bg-primary/10",
        mobileMenuBg: "bg-secondary",
        linkHover: "hover:text-secondary-foreground/80",
      },
      muted: {
        text: "text-muted-foreground",
        border: "border-muted-foreground/20",
        background: "bg-muted",
        primaryButton: "bg-primary text-primary-foreground hover:bg-primary/90",
        outlineButton: "border-primary text-primary hover:bg-primary/10",
        mobileMenuBg: "bg-muted",
        linkHover: "hover:text-foreground",
      },
      accent: {
        text: "text-accent-foreground",
        border: "border-accent-foreground/20",
        background: "bg-accent",
        primaryButton: "bg-primary text-primary-foreground hover:bg-primary/90",
        outlineButton: "border-primary text-primary hover:bg-primary/10",
        mobileMenuBg: "bg-accent",
        linkHover: "hover:text-accent-foreground/80",
      },
      card: {
        text: "text-card-foreground",
        border: "border-card-foreground/20",
        background: "bg-card",
        primaryButton: "bg-primary text-primary-foreground hover:bg-primary/90",
        outlineButton: "border-primary text-primary hover:bg-primary/10",
        mobileMenuBg: "bg-card",
        linkHover: "hover:text-card-foreground/80",
      },
      destructive: {
        text: "text-destructive-foreground",
        border: "border-destructive-foreground/20",
        background: "bg-destructive",
        primaryButton: "bg-primary text-primary-foreground hover:bg-primary/90",
        outlineButton: "border-primary text-primary hover:bg-primary/10",
        mobileMenuBg: "bg-destructive",
        linkHover: "hover:text-destructive-foreground/80",
      },
    };

    return themeMap[backgroundTheme as keyof typeof themeMap] || themeMap.background;
  };  
  

  const getAlignmentClass = () => {
    switch (alignment) {
      case "center":
        return "justify-center"
      case "right":
        return "justify-end"
      case "space-between":
        return "justify-between"
      case "space-around":
        return "justify-around"
      case "space-evenly":
        return "justify-evenly"
      default:
        return "justify-start"
    }
  }

  // Determine rounded corners class
  const getRoundedClass = () => {
    if (!isDetached) return ""

    switch (roundedCorners) {
      case "sm":
        return "rounded-sm"
      case "md":
        return "rounded-md"
      case "lg":
        return "rounded-lg"
      case "xl":
        return "rounded-xl"
      case "2xl":
        return "rounded-2xl"
      case "full":
        return "rounded-full"
      default:
        return ""
    }
  }

  const colors = getThemeColors()

  return (
    <div className={cn(
      "sticky top-0 z-50 w-full ",
      isDetached && "container mx-auto max-w-7xl"
    )}>      <header
        className={cn(
          "w-full border transition-all duration-200",
          colors.text,
          colors.border,
          colors.background,
          getRoundedClass(),
          isDetached ? "shadow-sm border" : "border-b border-l-0 border-r-0 border-t-0",
        )}
      >
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            {showLogo && (
              <div className="flex shrink-0 items-center">
                {logoImage ? (
                  <img 
                    src={logoImage} 
                    alt={logoText || "Logo"} 
                    width={120} 
                    height={40} 
                    className="h-8 w-auto" 
                  />
                ) : logoText ? (
                  <span className="text-xl font-bold">{logoText}</span>
                ) : (
                  <div className="h-8 w-24 bg-current opacity-20 rounded"></div>
                )}
              </div>
            )}

            {/* Desktop Navigation */}
            {showNavigation && navigationItems.length > 0 && (
              <nav className={cn(
                "hidden md:flex md:flex-1 md:items-center md:px-6",
                getAlignmentClass()
              )}>
                <ul className={cn("flex space-x-10", alignment === "center" ? "mx-auto" : "")}>
                  {navigationItems.map((item, index) => (
                    <li key={index}>
                      <Link 
                        href={item.url} 
                        className={cn(
                          "text-sm font-medium transition-colors",
                          colors.linkHover
                        )}
                      >
                        {item.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}            {/* CTA Buttons */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {showSecondaryButton && (
                <Link
                  href={secondaryButtonUrl}
                  className={cn(
                    "inline-flex h-10 items-center justify-center rounded-md border px-5 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                    colors.outlineButton,
                  )}
                >
                  {secondaryButtonText}
                </Link>
              )}
              {showPrimaryButton && (
                <Link
                  href={primaryButtonUrl}
                  className={cn(
                    "inline-flex h-10 items-center justify-center rounded-md px-5 py-2 text-sm font-medium shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                    colors.primaryButton,
                  )}
                >
                  {primaryButtonText}
                </Link>
              )}
            </div>            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                type="button"
                className={cn(
                  "inline-flex items-center justify-center rounded-md p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                  colors.text,
                  "hover:bg-accent hover:text-accent-foreground",
                )}
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                aria-expanded={isDrawerOpen}
                aria-controls="mobile-menu"
              >
                <span className="sr-only">
                  {isDrawerOpen ? "Close main menu" : "Open main menu"}
                </span>
                {isDrawerOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>        {/* Mobile Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsDrawerOpen(false)}
            />
            
            {/* Drawer Content */}            <div
              className={cn(
                "fixed inset-x-0 top-0 z-50 h-full overflow-y-auto border-b pt-16",
                colors.text,
                colors.border,
                colors.mobileMenuBg === "gradient-overlay" ? colors.background : colors.mobileMenuBg,
                getRoundedClass()
              )}
            >
              <div className="container mx-auto px-6">
                <nav className="flex flex-col space-y-8 py-8">
                  {showNavigation && navigationItems.length > 0 && (
                    <ul className="flex flex-col space-y-6">
                      {navigationItems.map((item, index) => (
                        <li key={index}>
                          <Link
                            href={item.url}
                            className={cn("text-lg font-medium transition-colors", colors.linkHover)}
                            onClick={() => setIsDrawerOpen(false)}
                          >
                            {item.text}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {(showPrimaryButton || showSecondaryButton) && (
                    <div className="flex flex-col space-y-4">
                      {showPrimaryButton && (
                        <Link
                          href={primaryButtonUrl}
                          className={cn(
                            "inline-flex h-10 items-center justify-center rounded-md px-5 py-2 text-sm font-medium shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                            colors.primaryButton,
                          )}
                          onClick={() => setIsDrawerOpen(false)}
                        >
                          {primaryButtonText}
                        </Link>
                      )}
                      {showSecondaryButton && (
                        <Link
                          href={secondaryButtonUrl}
                          className={cn(
                            "inline-flex h-10 items-center justify-center rounded-md border px-5 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                            colors.outlineButton,
                          )}
                          onClick={() => setIsDrawerOpen(false)}
                        >
                          {secondaryButtonText}
                        </Link>
                      )}
                    </div>
                  )}
                </nav>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  )
}

export const properties: BlockProperties = {
  name: "Dynamic Header",
  description: "A flexible header component with theme and layout options",
  contentFields: {
    logoText: {
      type: "text",
      name: "logoText",
      label: "Logo Text",
      description: "Text to display as logo (if no logo image is provided)",
      defaultValue: "Your Brand"
    },
    logoImage: {
      type: "image",
      name: "logoImage",
      label: "Logo Image",
      description: "Upload a logo image",
      defaultValue: ""
    },
    showLogo: {
      type: "switch",
      name: "showLogo",
      label: "Show Logo",
      description: "Display the logo in the header",
      defaultValue: true
    },
    showNavigation: {
      type: "switch",
      name: "showNavigation",
      label: "Show Navigation",
      description: "Display navigation menu",
      defaultValue: true
    },
    navigationItems: {
      type: "list",
      name: "navigationItems",
      label: "Navigation Items",
      description: "Configure navigation menu items",
      value: {
        name: "Navigation Item",
        description: "A navigation menu item",
        contentFields: {
          text: {
            type: "text",
            name: "text",
            label: "Link Text",
            description: "Display text for the navigation link",
            defaultValue: ""
          },
          url: {
            type: "text",
            name: "url",
            label: "URL",
            description: "Destination URL for the navigation link",
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
      description: "Text for the primary call-to-action button",
      defaultValue: "Get Started"
    },
    primaryButtonUrl: {
      type: "text",
      name: "primaryButtonUrl",
      label: "Primary Button URL",
      description: "URL for the primary button",
      defaultValue: "#"
    },
    secondaryButtonText: {
      type: "text",
      name: "secondaryButtonText",
      label: "Secondary Button Text",
      description: "Text for the secondary button",
      defaultValue: "Learn More"
    },
    secondaryButtonUrl: {
      type: "text",
      name: "secondaryButtonUrl",
      label: "Secondary Button URL",
      description: "URL for the secondary button",
      defaultValue: "#"
    },
    showPrimaryButton: {
      type: "switch",
      name: "showPrimaryButton",
      label: "Show Primary Button",
      description: "Display the primary call-to-action button",
      defaultValue: true
    },
    showSecondaryButton: {
      type: "switch",
      name: "showSecondaryButton",
      label: "Show Secondary Button",
      description: "Display the secondary button",
      defaultValue: false
    }
  },  themeFields: {
    backgroundTheme: {
      type: "theme",
      name: "backgroundTheme",
      label: "Background Theme",
      description: "Choose the background theme for the header",
      options: backgroundThemeOptions,
      defaultValue: "background"
    },
    gradientType: {
      type: "select",
      name: "gradientType",
      label: "Gradient Type",
      description: "Type of gradient effect",
      options: [
        { label: "None", value: "none" },
        { label: "Linear", value: "linear" },
        { label: "Radial", value: "radial" },
        { label: "Conic", value: "conic" }
      ],
      defaultValue: "none"
    },
    gradientDirection: {
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
        { label: "To Top Left", value: "to-top-left" }
      ],
      defaultValue: "to-right"
    },
    gradientStyle: {
      type: "select",
      name: "gradientStyle",
      label: "Gradient Style",
      description: "Choose gradient color combination",
      options: [
        { label: "Subtle (Background to Muted)", value: "subtle" },
        { label: "Bold (Primary to Secondary)", value: "bold" },
        { label: "Vibrant (Accent to Primary)", value: "vibrant" }
      ],
      defaultValue: "subtle"
    }
  },
  layoutFields: {
    alignment: {
      type: "select",
      name: "alignment",
      label: "Alignment",
      description: "Navigation alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
        { label: "Space Between", value: "space-between" }
      ],
      defaultValue: "left"
    },
    roundedCorners: {
      type: "select",
      name: "roundedCorners",
      label: "Rounded Corners",
      description: "Border radius (only visible in detached mode)",
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
    detachedMode: {
      type: "switch",
      name: "detachedMode",
      label: "Detached Mode",
      description: "Display header as a detached card with shadow",
      defaultValue: false
    }
  }
};
