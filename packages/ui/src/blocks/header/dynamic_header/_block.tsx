"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { cn } from "../../../utils/classNames"
import { BlockProperties } from "@halogen/common/types"
// Options are now defined inline in the properties object

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
  const themeSelection = fields?.themeSelection?.value || "background";
  const backgroundColor = fields?.backgroundColor?.value || "";
  const textColor = fields?.textColor?.value || "";
  const gradientType = fields?.gradientType?.value || "";
  const gradientDirection = fields?.gradientDirection?.value || "to-right";
  const gradientStyle = fields?.gradientStyle?.value || "";
  
  // Layout fields
  const alignment = fields?.alignment?.value || "left";
  const paddingTop = fields?.paddingTop?.value || "medium";
  const paddingBottom = fields?.paddingBottom?.value || "medium";
  const paddingLeft = fields?.paddingLeft?.value || "medium";
  const paddingRight = fields?.paddingRight?.value || "medium";
  const marginTop = fields?.marginTop?.value || "none";
  const marginBottom = fields?.marginBottom?.value || "none";
  const roundedCorners = fields?.roundedCorners?.value || "none";
  const isDetached = fields?.detachedMode?.value || false;
  const headerHeight = fields?.headerHeight?.value || "medium";
  const headerWidth = fields?.headerWidth?.value || "full";  // Color mapping for each theme
  const getThemeColors = () => {
    // If custom colors are provided, use them
    if (backgroundColor || textColor) {
      return {
        text: textColor ? `text-[${textColor}]` : "text-foreground",
        border: "border-border",
        primaryButton: "bg-primary text-primary-foreground hover:bg-primary/90",
        outlineButton: "border-border text-foreground hover:bg-accent hover:text-accent-foreground",
        mobileMenuBg: backgroundColor ? `bg-[${backgroundColor}]` : "bg-background",
        linkHover: "hover:text-primary",
      };
    }

    // If gradient is applied, use neutral colors that work with gradients
    if (gradientType && gradientStyle) {
      return {
        text: "text-white",
        border: "border-white/20",
        primaryButton: "bg-white text-black hover:bg-white/90",
        outlineButton: "border-white/30 text-white hover:bg-white/10",
        mobileMenuBg: "gradient-overlay",
        linkHover: "hover:text-white/80",
      };
    }

    const themeMap = {
      background: {
        text: "text-foreground",
        border: "border-border",
        primaryButton: "bg-primary text-primary-foreground hover:bg-primary/90",
        outlineButton: "border-border text-foreground hover:bg-accent hover:text-accent-foreground",
        mobileMenuBg: "bg-background",
        linkHover: "hover:text-primary",
      },
      primary: {
        text: "text-primary-foreground",
        border: "border-primary-foreground/20",
        primaryButton: "bg-primary-foreground text-primary hover:bg-primary-foreground/90",
        outlineButton: "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10",
        mobileMenuBg: "bg-primary",
        linkHover: "hover:text-primary-foreground/80",
      },
      secondary: {
        text: "text-secondary-foreground",
        border: "border-secondary-foreground/20",
        primaryButton: "bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90",
        outlineButton: "border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10",
        mobileMenuBg: "bg-secondary",
        linkHover: "hover:text-secondary-foreground/80",
      },
      muted: {
        text: "text-muted-foreground",
        border: "border-muted-foreground/20",
        primaryButton: "bg-foreground text-background hover:bg-foreground/90",
        outlineButton: "border-muted-foreground/30 text-muted-foreground hover:bg-muted-foreground/10",
        mobileMenuBg: "bg-muted",
        linkHover: "hover:text-foreground",
      },
      accent: {
        text: "text-accent-foreground",
        border: "border-accent-foreground/20",
        primaryButton: "bg-accent-foreground text-accent hover:bg-accent-foreground/90",
        outlineButton: "border-accent-foreground/30 text-accent-foreground hover:bg-accent-foreground/10",
        mobileMenuBg: "bg-accent",
        linkHover: "hover:text-accent-foreground/80",
      },
      card: {
        text: "text-card-foreground",
        border: "border-card-foreground/20",
        primaryButton: "bg-card-foreground text-card hover:bg-card-foreground/90",
        outlineButton: "border-card-foreground/30 text-card-foreground hover:bg-card-foreground/10",
        mobileMenuBg: "bg-card",
        linkHover: "hover:text-card-foreground/80",
      },
    };

    return themeMap[themeSelection as keyof typeof themeMap] || themeMap.background;
  };

  // Generate background style based on theme and gradient
  const getBackgroundStyle = () => {
    // If custom background color is provided
    if (backgroundColor) {
      return {
        backgroundColor: backgroundColor,
      };
    }

    // If gradient is configured
    if (gradientType && gradientStyle) {
      const [from, to] = gradientStyle.split("-to-");

      // Map gradient directions to CSS values
      const directionMap = {
        "to-right": "to right",
        "to-left": "to left",
        "to-bottom": "to bottom",
        "to-top": "to top",
        "to-bottom-right": "to bottom right",
        "to-bottom-left": "to bottom left",
        "to-top-right": "to top right",
        "to-top-left": "to top left",
        "from-center": "from center",
      };

      const direction = directionMap[gradientDirection as keyof typeof directionMap] || "to right";

      const gradientMap = {
        linear: `linear-gradient(${direction}, hsl(var(--${from})), hsl(var(--${to})))`,
        radial:
          gradientDirection === "from-center"
            ? `radial-gradient(circle, hsl(var(--${from})), hsl(var(--${to})))`
            : `radial-gradient(circle at ${direction.replace("to ", "")}, hsl(var(--${from})), hsl(var(--${to})))`,
        conic: `conic-gradient(from 0deg at center, hsl(var(--${from})), hsl(var(--${to})), hsl(var(--${from})))`,
      };

      return {
        background: gradientMap[gradientType as keyof typeof gradientMap],
      };
    }

    // Default theme-based background
    return {
      backgroundColor: `hsl(var(--${themeSelection}))`,
    };
  };

  // Generate padding classes
  const getPaddingClasses = () => {
    const paddingMap = {
      none: "p-0",
      small: "p-2",
      medium: "p-4",
      large: "p-6",
      xl: "p-8",
    };

    return cn(
      paddingMap[paddingTop as keyof typeof paddingMap],
      paddingMap[paddingBottom as keyof typeof paddingMap],
      paddingMap[paddingLeft as keyof typeof paddingMap],
      paddingMap[paddingRight as keyof typeof paddingMap]
    );
  };

  // Generate margin classes
  const getMarginClasses = () => {
    const marginMap = {
      none: "m-0",
      small: "m-2",
      medium: "m-4",
      large: "m-6",
      xl: "m-8",
    };

    return cn(
      marginMap[marginTop as keyof typeof marginMap],
      marginMap[marginBottom as keyof typeof marginMap]
    );
  };

  // Determine alignment class
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

  // Determine header height class
  const getHeightClass = () => {
    switch (headerHeight) {
      case "small":
        return "h-12"
      case "large":
        return "h-20"
      case "xl":
        return "h-24"
      default:
        return "h-16"
    }
  }

  // Determine header width class
  const getWidthClass = () => {
    switch (headerWidth) {
      case "container":
        return "max-w-7xl mx-auto"
      case "large":
        return "max-w-6xl mx-auto"
      case "medium":
        return "max-w-4xl mx-auto"
      default:
        return "w-full"
    }
  }

  const colors = getThemeColors()

  return (
    <div className={cn(
      "sticky top-0 z-50 w-full",
      getMarginClasses(),
      isDetached && "container mx-auto max-w-7xl px-4 py-3"
    )}>
      <header
        className={cn(
          "w-full border backdrop-blur-sm",
          colors.text,
          colors.border,
          getRoundedClass(),
          getPaddingClasses(),
          getWidthClass(),
          isDetached ? "shadow-lg" : "border-b",
        )}
        style={getBackgroundStyle()}
      >
        <div className={cn("container mx-auto px-6", getHeightClass())}>
          <div className={cn("flex items-center", getAlignmentClass(), getHeightClass())}>
            {/* Logo */}
            {showLogo && (
              <div className="flex shrink-0 items-center">
                {logoImage ? (
                  <img 
                    src={logoImage} 
                    alt={logoText || "Logo"} 
                    width={120} 
                    // height={40} 
                    // className="h-8 w-auto" 
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
                "hidden md:flex md:flex-1 md:items-center",
                alignment === "center" ? "md:justify-center" :
                alignment === "right" ? "md:justify-end" :
                alignment === "space-between" ? "md:justify-center" : "md:justify-start",
                showLogo && "md:px-6"
              )}>
                <ul className="flex space-x-8">
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
            )}

            {/* CTA Buttons */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {showPrimaryButton && (
                <Link
                  href={primaryButtonUrl}
                  className={cn(
                    "inline-flex h-10 items-center justify-center rounded-md px-5 py-2 text-sm font-medium shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    colors.primaryButton,
                  )}
                >
                  {primaryButtonText}
                </Link>
              )}
              {showSecondaryButton && (
                <Link
                  href={secondaryButtonUrl}
                  className={cn(
                    "inline-flex h-10 items-center justify-center rounded-md border px-5 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    colors.outlineButton,
                  )}
                >
                  {secondaryButtonText}
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                type="button"
                className={cn(
                  "inline-flex items-center justify-center rounded-md p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  colors.linkHover
                )}
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {isDrawerOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isDrawerOpen && (
          <div className={cn("md:hidden", colors.mobileMenuBg)}>
            <div className="space-y-1 px-6 pb-3 pt-2">
              {showNavigation && navigationItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.url}
                  className={cn(
                    "block rounded-md px-3 py-2 text-base font-medium transition-colors",
                    colors.linkHover
                  )}
                  onClick={() => setIsDrawerOpen(false)}
                >
                  {item.text}
                </Link>
              ))}
              <div className="mt-4 space-y-2">
                {showPrimaryButton && (
                  <Link
                    href={primaryButtonUrl}
                    className={cn(
                      "block w-full rounded-md px-3 py-2 text-center text-base font-medium transition-colors",
                      colors.primaryButton
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
                      "block w-full rounded-md border px-3 py-2 text-center text-base font-medium transition-colors",
                      colors.outlineButton
                    )}
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    {secondaryButtonText}
                  </Link>
                )}
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
    },    logoImage: {
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
    },    navigationItems: {
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
  },
  themeFields: {
    themeSelection: {
      type: "theme",
      name: "themeSelection",
      label: "Theme",
      description: "Choose a theme for styling",
      defaultValue: "background"
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
    },
    gradientType: {
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
    gradientDirection: {
      type: "select",
      name: "gradientDirection",
      label: "Gradient Direction",
      description: "Direction of the gradient",
      options: [
        { label: "To Right", value: "to-right" },
        { label: "To Left", value: "to-left" },
        { label: "To Bottom", value: "to-bottom" },
        { label: "To Top", value: "to-top" }
      ],
      defaultValue: "to-right"
    },
    gradientStyle: {
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
  },
  layoutFields: {
    alignment: {
      type: "select",
      name: "alignment",
      label: "Alignment",
      description: "Text alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" }
      ],
      defaultValue: "left"
    },
    paddingTop: {
      type: "select",
      name: "paddingTop",
      label: "Padding Top",
      description: "Top padding",
      options: [
        { label: "None", value: "pt-0" },
        { label: "Small", value: "pt-2" },
        { label: "Medium", value: "pt-4" },
        { label: "Large", value: "pt-8" }
      ],
      defaultValue: "pt-4"
    },
    paddingBottom: {
      type: "select",
      name: "paddingBottom",
      label: "Padding Bottom",
      description: "Bottom padding",
      options: [
        { label: "None", value: "pb-0" },
        { label: "Small", value: "pb-2" },
        { label: "Medium", value: "pb-4" },
        { label: "Large", value: "pb-8" }
      ],
      defaultValue: "pb-4"
    },
    paddingLeft: {
      type: "select",
      name: "paddingLeft",
      label: "Padding Left",
      description: "Left padding",
      options: [
        { label: "None", value: "pl-0" },
        { label: "Small", value: "pl-2" },
        { label: "Medium", value: "pl-4" },
        { label: "Large", value: "pl-8" }
      ],
      defaultValue: "pl-4"
    },
    paddingRight: {
      type: "select",
      name: "paddingRight",
      label: "Padding Right",
      description: "Right padding",
      options: [
        { label: "None", value: "pr-0" },
        { label: "Small", value: "pr-2" },
        { label: "Medium", value: "pr-4" },
        { label: "Large", value: "pr-8" }
      ],
      defaultValue: "pr-4"
    },
    marginTop: {
      type: "select",
      name: "marginTop",
      label: "Margin Top",
      description: "Top margin",
      options: [
        { label: "None", value: "mt-0" },
        { label: "Small", value: "mt-2" },
        { label: "Medium", value: "mt-4" },
        { label: "Large", value: "mt-8" }
      ],
      defaultValue: "mt-0"
    },
    marginBottom: {
      type: "select",
      name: "marginBottom",
      label: "Margin Bottom",
      description: "Bottom margin",
      options: [
        { label: "None", value: "mb-0" },
        { label: "Small", value: "mb-2" },
        { label: "Medium", value: "mb-4" },
        { label: "Large", value: "mb-8" }
      ],
      defaultValue: "mb-0"
    },
    roundedCorners: {
      type: "select",
      name: "roundedCorners",
      label: "Rounded Corners",
      description: "Border radius",
      options: [
        { label: "None", value: "rounded-none" },
        { label: "Small", value: "rounded-sm" },
        { label: "Medium", value: "rounded-md" },
        { label: "Large", value: "rounded-lg" },
        { label: "Full", value: "rounded-full" }
      ],
      defaultValue: "rounded-none"
    },
    detachedMode: {
      type: "switch",
      name: "detachedMode",
      label: "Detached Mode",
      description: "Display header as a detached card with shadow",
      defaultValue: false
    },
    headerHeight: {
      type: "select",
      name: "headerHeight",
      label: "Header Height",
      description: "Height of the header",
      options: [
        { label: "Small", value: "small" },
        { label: "Medium", value: "medium" },
        { label: "Large", value: "large" },
        { label: "Extra Large", value: "xl" }
      ],
      defaultValue: "medium"
    },
    headerWidth: {
      type: "select",
      name: "headerWidth",
      label: "Header Width",
      description: "Width constraint of the header",
      options: [
        { label: "Full Width", value: "full" },
        { label: "Container", value: "container" },
        { label: "Large", value: "large" },
        { label: "Medium", value: "medium" }
      ],
      defaultValue: "full"
    }
  }
};
