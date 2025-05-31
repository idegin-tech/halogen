"use client"

import Link from "next/link"
import { useState, useRef, useEffect, useMemo } from "react"
import { BlockProperties } from "@halogen/common/types";

interface NavigationItem {
  name: string;
  href: string;
  children?: NavigationItem[];
}

interface ColorVariables {
  [key: string]: string;
}

export function BasicHeader(fields: typeof properties.contentFields & typeof properties.themeFields & typeof properties.layoutFields & { colorVariables?: ColorVariables }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
    // Extract field values with proper fallbacks
  const navigation = (fields?.navigation?.value || []) as NavigationItem[];
  const alignment = fields?.alignment?.value || "justify-between";
  const height = fields?.height?.value || "h-16 md:h-20";
  const buttonLayout = fields?.buttonLayout?.value || "primary";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        activeDropdown &&
        dropdownRefs.current[activeDropdown] &&
        !dropdownRefs.current[activeDropdown]?.contains(event.target as Node)
      ) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [activeDropdown])
  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name)
  }
  // Get theme from fields
  const theme = fields?.theme?.value || "primary";
  const colorVariables = fields?.colorVariables || {};

  // Helper function to get color value with fallback
  const getColor = (colorKey: string, fallback: string) => {
    return colorVariables[colorKey] || fallback;
  };

  // Helper function to apply opacity to hex color
  const applyOpacity = (color: string, opacity: number) => {
    if (color.startsWith('#')) {
      const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
      return color + alpha;
    }
    return color;
  };

  // Theme-based styling with dynamic colors
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case "primary":
        return {
          header: {
            backgroundColor: applyOpacity(getColor('primary', '#6D3DF2'), 0.05),
            borderColor: applyOpacity(getColor('primary', '#6D3DF2'), 0.2),
            backdropFilter: 'blur(8px)',
          },
          logo: {
            backgroundColor: applyOpacity(getColor('primary', '#6D3DF2'), 0.1),
          },
          primaryButton: {
            backgroundColor: getColor('primary', '#6D3DF2'),
            color: getColor('primary-foreground', '#FAFAFA'),
          },
          secondaryButton: {
            borderColor: applyOpacity(getColor('primary', '#6D3DF2'), 0.2),
            color: getColor('primary', '#6D3DF2'),
          }
        };
      case "secondary":
        return {
          header: {
            backgroundColor: applyOpacity(getColor('secondary', '#F55B00'), 0.05),
            borderColor: applyOpacity(getColor('secondary', '#F55B00'), 0.2),
            backdropFilter: 'blur(8px)',
          },
          logo: {
            backgroundColor: applyOpacity(getColor('secondary', '#F55B00'), 0.1),
          },
          primaryButton: {
            backgroundColor: getColor('secondary', '#F55B00'),
            color: getColor('secondary-foreground', '#0F0F10'),
          },
          secondaryButton: {
            borderColor: applyOpacity(getColor('secondary', '#F55B00'), 0.2),
            color: getColor('secondary', '#F55B00'),
          }
        };
      case "accent":
        return {
          header: {
            backgroundColor: applyOpacity(getColor('accent', '#F5F5F6'), 0.05),
            borderColor: applyOpacity(getColor('accent', '#F5F5F6'), 0.2),
            backdropFilter: 'blur(8px)',
          },
          logo: {
            backgroundColor: applyOpacity(getColor('accent', '#F5F5F6'), 0.1),
          },
          primaryButton: {
            backgroundColor: getColor('accent', '#F5F5F6'),
            color: getColor('accent-foreground', '#0F0F10'),
          },
          secondaryButton: {
            borderColor: applyOpacity(getColor('accent', '#F5F5F6'), 0.2),
            color: getColor('accent', '#F5F5F6'),
          }
        };
      case "muted":
        return {
          header: {
            backgroundColor: getColor('muted', '#F5F5F6'),
            borderColor: applyOpacity(getColor('muted-foreground', '#757578'), 0.2),
            backdropFilter: 'blur(8px)',
          },
          logo: {
            backgroundColor: applyOpacity(getColor('muted-foreground', '#757578'), 0.1),
          },
          primaryButton: {
            backgroundColor: getColor('muted-foreground', '#757578'),
            color: getColor('muted', '#F5F5F6'),
          },
          secondaryButton: {
            borderColor: applyOpacity(getColor('muted-foreground', '#757578'), 0.2),
            color: getColor('muted-foreground', '#757578'),
          }
        };
      // Linear gradient combinations
      case "gradient-primary-secondary":
        return {
          header: {
            background: `linear-gradient(to right, ${applyOpacity(getColor('primary', '#6D3DF2'), 0.05)}, ${applyOpacity(getColor('secondary', '#F55B00'), 0.05)})`,
            borderColor: applyOpacity(getColor('primary', '#6D3DF2'), 0.2),
            backdropFilter: 'blur(8px)',
          },
          logo: {
            backgroundColor: applyOpacity(getColor('primary', '#6D3DF2'), 0.1),
          },
          primaryButton: {
            backgroundColor: getColor('primary', '#6D3DF2'),
            color: getColor('primary-foreground', '#FAFAFA'),
          },
          secondaryButton: {
            borderColor: applyOpacity(getColor('primary', '#6D3DF2'), 0.2),
            color: getColor('primary', '#6D3DF2'),
          }
        };
      case "gradient-background-card":
        return {
          header: {
            background: `linear-gradient(to right, ${applyOpacity(getColor('background', '#FFFFFF'), 0.05)}, ${applyOpacity(getColor('card', '#FFFFFF'), 0.05)})`,
            borderColor: applyOpacity(getColor('border', '#E4E4E7'), 0.2),
            backdropFilter: 'blur(8px)',
          },
          logo: {
            backgroundColor: applyOpacity(getColor('background', '#FFFFFF'), 0.1),
          },
          primaryButton: {
            backgroundColor: getColor('foreground', '#0A0A0A'),
            color: getColor('background', '#FFFFFF'),
          },
          secondaryButton: {
            borderColor: getColor('border', '#E4E4E7'),
            color: getColor('foreground', '#0A0A0A'),
          }
        };
      case "gradient-primary-accent":
        return {
          header: {
            background: `linear-gradient(to right, ${applyOpacity(getColor('primary', '#6D3DF2'), 0.05)}, ${applyOpacity(getColor('accent', '#F5F5F6'), 0.05)})`,
            borderColor: applyOpacity(getColor('primary', '#6D3DF2'), 0.2),
            backdropFilter: 'blur(8px)',
          },
          logo: {
            backgroundColor: applyOpacity(getColor('primary', '#6D3DF2'), 0.1),
          },
          primaryButton: {
            backgroundColor: getColor('primary', '#6D3DF2'),
            color: getColor('primary-foreground', '#FAFAFA'),
          },
          secondaryButton: {
            borderColor: applyOpacity(getColor('primary', '#6D3DF2'), 0.2),
            color: getColor('primary', '#6D3DF2'),
          }
        };
      case "gradient-secondary-muted":
        return {
          header: {
            background: `linear-gradient(to right, ${applyOpacity(getColor('secondary', '#F55B00'), 0.05)}, ${applyOpacity(getColor('muted', '#F5F5F6'), 0.05)})`,
            borderColor: applyOpacity(getColor('secondary', '#F55B00'), 0.2),
            backdropFilter: 'blur(8px)',
          },
          logo: {
            backgroundColor: applyOpacity(getColor('secondary', '#F55B00'), 0.1),
          },
          primaryButton: {
            backgroundColor: getColor('secondary', '#F55B00'),
            color: getColor('secondary-foreground', '#0F0F10'),
          },
          secondaryButton: {
            borderColor: applyOpacity(getColor('secondary', '#F55B00'), 0.2),
            color: getColor('secondary', '#F55B00'),
          }
        };
      // Radial gradient combinations
      case "gradient-radial-primary-secondary":
        return {
          header: {
            background: `radial-gradient(ellipse at center, ${applyOpacity(getColor('primary', '#6D3DF2'), 0.05)}, ${applyOpacity(getColor('secondary', '#F55B00'), 0.05)})`,
            borderColor: applyOpacity(getColor('primary', '#6D3DF2'), 0.2),
            backdropFilter: 'blur(8px)',
          },
          logo: {
            backgroundColor: applyOpacity(getColor('primary', '#6D3DF2'), 0.1),
          },
          primaryButton: {
            backgroundColor: getColor('primary', '#6D3DF2'),
            color: getColor('primary-foreground', '#FAFAFA'),
          },
          secondaryButton: {
            borderColor: applyOpacity(getColor('primary', '#6D3DF2'), 0.2),
            color: getColor('primary', '#6D3DF2'),
          }
        };
      case "gradient-radial-background-card":
        return {
          header: {
            background: `radial-gradient(ellipse at center, ${applyOpacity(getColor('background', '#FFFFFF'), 0.05)}, ${applyOpacity(getColor('card', '#FFFFFF'), 0.05)})`,
            borderColor: applyOpacity(getColor('border', '#E4E4E7'), 0.2),
            backdropFilter: 'blur(8px)',
          },
          logo: {
            backgroundColor: applyOpacity(getColor('background', '#FFFFFF'), 0.1),
          },
          primaryButton: {
            backgroundColor: getColor('foreground', '#0A0A0A'),
            color: getColor('background', '#FFFFFF'),
          },
          secondaryButton: {
            borderColor: getColor('border', '#E4E4E7'),
            color: getColor('foreground', '#0A0A0A'),
          }
        };
      case "none":
        return {
          header: {
            backgroundColor: 'transparent',
            borderColor: applyOpacity(getColor('border', '#E4E4E7'), 0.4),
            backdropFilter: 'blur(8px)',
          },
          logo: {
            backgroundColor: applyOpacity(getColor('background', '#FFFFFF'), 0.5),
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: getColor('border', '#E4E4E7'),
          },
          primaryButton: {
            backgroundColor: getColor('foreground', '#0A0A0A'),
            color: getColor('background', '#FFFFFF'),
          },
          secondaryButton: {
            borderColor: getColor('border', '#E4E4E7'),
            color: getColor('foreground', '#0A0A0A'),
          }
        };
      default:
        return {
          header: {
            backgroundColor: applyOpacity(getColor('background', '#FFFFFF'), 0.95),
            borderColor: applyOpacity(getColor('border', '#E4E4E7'), 0.4),
            backdropFilter: 'blur(8px)',
          },
          logo: {
            backgroundColor: applyOpacity(getColor('primary', '#6D3DF2'), 0.1),
          },
          primaryButton: {
            backgroundColor: getColor('primary', '#6D3DF2'),
            color: getColor('primary-foreground', '#FAFAFA'),
          },
          secondaryButton: {
            borderColor: getColor('border', '#E4E4E7'),
            color: getColor('foreground', '#0A0A0A'),
          }
        };
    }
  };

  const themeStyles = getThemeClasses(theme);

  // Button layout logic
  const showPrimary = buttonLayout === "primary" || buttonLayout === "both";
  const showSecondary = buttonLayout === "secondary" || buttonLayout === "both";
  // Render buttons function for desktop
  const renderButtons = () => (
    <div className="flex items-center gap-3">      {showSecondary && fields?.secondaryButtonText?.value && (
        <Link
          href={fields?.secondaryButtonLink?.value || "#"}
          className="hidden md:inline-flex h-9 md:h-10 items-center justify-center rounded-md border px-4 md:px-6 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          style={{
            ...themeStyles.secondaryButton,
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          {fields?.secondaryButtonText?.value}
        </Link>
      )}
      {showPrimary && fields?.primaryButtonText?.value && (
        <Link
          href={fields?.primaryButtonLink?.value || "#contact"}
          className="hidden md:inline-flex h-9 md:h-10 items-center justify-center rounded-md px-4 md:px-6 py-2 text-sm font-medium shadow-md transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          style={themeStyles.primaryButton}
        >
          {fields?.primaryButtonText?.value}
        </Link>
      )}
      <button
        className="md:hidden text-foreground p-2 rounded-md hover:bg-accent/50"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          {isMenuOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </>
          ) : (
            <>
              <line x1="4" x2="20" y1="12" y2="12"></line>
              <line x1="4" x2="20" y1="6" y2="6"></line>
              <line x1="4" x2="20" y1="18" y2="18"></line>
            </>
          )}
        </svg>
      </button>
    </div>
  );  return (
    <header 
      className="sticky top-0 z-40 w-full border-b"
      style={{
        ...themeStyles.header,
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
      }}
    >
      <div className={`container mx-auto flex ${height} items-center ${alignment}`}>
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          {/* Logo - Image Only (No Text Fallback) */}          {fields?.logoImage?.value ? (
            <div 
              className="relative h-9 w-9 md:h-10 md:w-10 overflow-hidden rounded-lg"
              style={themeStyles.logo}
            >
              <img 
                src={fields.logoImage.value} 
                alt={fields?.companyName?.value || "Company Logo"}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div 
              className="relative h-9 w-9 md:h-10 md:w-10 overflow-hidden rounded-lg flex items-center justify-center"
              style={themeStyles.logo}
            >
              <span className="text-lg md:text-xl font-bold text-foreground/60">
                {fields?.companyLogoInitial?.value || "C"}
              </span>
            </div>
          )}
          <span className="text-lg md:text-xl font-bold tracking-tight text-foreground">
            {fields?.companyName?.value || "Consulta"}
          </span>
        </div>

        {/* Navigation - Only show when alignment is justify-between */}
        {alignment === "justify-between" && (          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navigation.map((item: NavigationItem) => (
              <div key={item.name} className="relative" ref={(el) => {
                dropdownRefs.current[item.name] = el;
              }}>
                {item.children && item.children.length > 0 ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                        activeDropdown === item.name
                          ? "bg-primary/10 text-foreground"
                          : "text-foreground/80 hover:text-foreground hover:bg-accent/50"
                      }`}
                      aria-expanded={activeDropdown === item.name}
                    >
                      {item.name}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform duration-200 ${
                          activeDropdown === item.name ? "rotate-180" : ""
                        }`}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    {activeDropdown === item.name && (
                      <div className="absolute top-full left-0 mt-1 w-56 rounded-md border border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-5 duration-200">                        <div className="py-1">
                          {item.children.map((child: NavigationItem) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              className="block px-4 py-2 text-sm text-foreground/80 hover:bg-primary/10 hover:text-foreground transition-colors"
                              onClick={() => setActiveDropdown(null)}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className="px-3 py-2 text-sm font-medium rounded-md text-foreground/80 transition-colors hover:text-foreground hover:bg-accent/50"
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Action Buttons */}
        {renderButtons()}
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 animate-in slide-in-from-top duration-300">
          <div className="container py-3">            <nav className="flex flex-col space-y-1">
              {navigation.map((item: NavigationItem) => (
                <div key={item.name} className="w-full">
                  {item.children && item.children.length > 0 ? (
                    <div className="w-full">
                      <button
                        onClick={() => toggleDropdown(item.name)}
                        className={`flex w-full items-center justify-between px-4 py-3 text-sm font-medium rounded-md ${
                          activeDropdown === item.name
                            ? "bg-primary/10 text-foreground"
                            : "text-foreground/80 hover:bg-accent/50 hover:text-foreground"
                        }`}
                      >
                        {item.name}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transition-transform duration-200 ${
                            activeDropdown === item.name ? "rotate-180" : ""
                          }`}
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                      {activeDropdown === item.name && (                        <div className="ml-4 mt-1 border-l-2 border-border/40 pl-4 animate-in slide-in-from-left duration-200">
                          {item.children.map((child: NavigationItem) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              className="block py-2 px-3 text-sm text-foreground/80 hover:bg-primary/10 hover:text-foreground rounded-md transition-colors"
                              onClick={() => {
                                setActiveDropdown(null)
                                setIsMenuOpen(false)
                              }}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className="block px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-accent/50 hover:text-foreground rounded-md transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}              <div className="pt-2 flex flex-col gap-2">
                {showSecondary && fields?.secondaryButtonText?.value && (
                  <Link
                    href={fields?.secondaryButtonLink?.value || "#"}
                    className="flex h-10 items-center justify-center rounded-md border px-6 py-2 text-sm font-medium w-full"
                    style={{
                      ...themeStyles.secondaryButton,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {fields?.secondaryButtonText?.value}
                  </Link>
                )}
                {showPrimary && fields?.primaryButtonText?.value && (
                  <Link
                    href={fields?.primaryButtonLink?.value || "#contact"}
                    className="flex h-10 items-center justify-center rounded-md px-6 py-2 text-sm font-medium shadow-md w-full"
                    style={themeStyles.primaryButton}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {fields?.primaryButtonText?.value}
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

export const properties: BlockProperties = {
  name: "Basic Header",
  description: "A responsive header with dropdown navigation, mobile menu, and customizable buttons",
  
  contentFields: {
    companyName: {
      type: "text",
      name: "companyName",
      label: "Company Name",
      description: "Name of your company or brand",
      defaultValue: "Consulta"
    },
    companyLogoInitial: {
      type: "text",
      name: "companyLogoInitial",
      label: "Logo Initial",
      description: "Initial letter for your company logo",
      defaultValue: "C"
    },
    logoImage: {
      type: "image",
      name: "logoImage",
      label: "Logo Image",
      description: "Upload a logo image (optional, overrides logo initial)",
      defaultValue: ""
    },
    primaryButtonText: {
      type: "text",
      name: "primaryButtonText",
      label: "Primary Button Text",
      description: "Text for the primary button",
      defaultValue: "Get Started"
    },
    primaryButtonLink: {
      type: "text",
      name: "primaryButtonLink",
      label: "Primary Button Link",
      description: "Link for the primary button",
      defaultValue: "#contact"
    },
    secondaryButtonText: {
      type: "text",
      name: "secondaryButtonText",
      label: "Secondary Button Text",
      description: "Text for the secondary button (optional)",
      defaultValue: ""
    },
    secondaryButtonLink: {
      type: "text",
      name: "secondaryButtonLink",
      label: "Secondary Button Link",
      description: "Link for the secondary button",
      defaultValue: ""
    },
    navigation: {
      type: "list",
      name: "navigation",
      label: "Navigation Items",
      description: "Main navigation items",
      value: {
        name: "Navigation Item",
        description: "Navigation menu item",
        contentFields: {
          name: {
            type: "text",
            name: "name",
            label: "Name",
            description: "Navigation item name",
            defaultValue: ""
          },
          href: {
            type: "text",
            name: "href",
            label: "Link",
            description: "Navigation item link",
            defaultValue: ""
          },
          children: {
            type: "list",
            name: "children",
            label: "Dropdown Items",
            description: "Dropdown menu items (leave empty for no dropdown)",
            value: {
              name: "Dropdown Item",
              description: "Dropdown menu item",
              contentFields: {
                name: {
                  type: "text",
                  name: "name",
                  label: "Name",
                  description: "Dropdown item name",
                  defaultValue: ""
                },
                href: {
                  type: "text",
                  name: "href",
                  label: "Link",
                  description: "Dropdown item link",
                  defaultValue: ""
                }
              },
              themeFields: {},
              layoutFields: {}
            },
            defaultValue: []
          }
        },
        themeFields: {},
        layoutFields: {}
      },
      defaultValue: [
        { name: "Home", href: "/" },
        { name: "Services", href: "/services" },
        { name: "About", href: "/about" },
        { name: "Case Studies", href: "#case-studies" },
        { name: "Contact", href: "#contact" }
      ]
    }
  },
  themeFields: {
    theme: {
      type: "theme",
      name: "theme",
      label: "Header Theme",
      description: "Choose a theme for the header styling",
      defaultValue: "primary"
    }
  },

  layoutFields: {
    alignment: {
      type: "select",
      name: "alignment",
      label: "Content Alignment",
      description: "How to align header content",
      options: [
        { label: "Space Between", value: "justify-between" },
        { label: "Center", value: "justify-center" },
        { label: "Start", value: "justify-start" },
        { label: "End", value: "justify-end" }
      ],
      defaultValue: "justify-between"
    },
    height: {
      type: "select",
      name: "height",
      label: "Header Height",
      description: "Height of the header",
      options: [
        { label: "Small", value: "h-14" },
        { label: "Medium", value: "h-16 md:h-20" },
        { label: "Large", value: "h-20 md:h-24" }
      ],
      defaultValue: "h-16 md:h-20"
    },
    buttonLayout: {
      type: "select",
      name: "buttonLayout",
      label: "Button Layout",
      description: "How to arrange action buttons",
      options: [
        { label: "Primary Only", value: "primary" },
        { label: "Both Buttons", value: "both" },
        { label: "Secondary Only", value: "secondary" }
      ],
      defaultValue: "primary"
    }
  }
};
