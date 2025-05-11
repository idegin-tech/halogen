"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { BlockProperties } from "@halogen/common/types";

export function BasicHeader(fields: typeof properties.fields) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  
  // Use provided navigation from fields
  const navigation = fields?.navigation?.value || [];

  // Close dropdown when clicking outside
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

  // Toggle dropdown menu
  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name)
  }

  // Extract customizable styles
  const headerStyles = {
    backgroundColor: fields?.headerBackgroundColor?.value || "",
    borderColor: fields?.headerBorderColor?.value || ""
  };

  const logoStyles = {
    backgroundColor: fields?.logoBackgroundColor?.value || "var(--primary, #000)",
    color: fields?.logoTextColor?.value || "#fff"
  };

  return (
    <header 
      className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{
        borderColor: headerStyles.borderColor || "var(--border, rgba(0,0,0,0.1))",
        backgroundColor: headerStyles.backgroundColor || "var(--background, #fff)"
      }}
    >
      <div className="container mx-auto flex h-16 md:h-20 items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="relative h-9 w-9 md:h-10 md:w-10 overflow-hidden rounded-lg"
            style={{ backgroundColor: `${logoStyles.backgroundColor}10` }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span 
                className="text-lg md:text-xl font-bold"
                style={{ color: logoStyles.color }}
              >
                {fields?.companyLogoInitial?.value || "C"}
              </span>
            </div>
            <div 
              className="absolute -bottom-4 -right-4 h-6 w-6 md:h-8 md:w-8 rounded-full"
              style={{ backgroundColor: `${logoStyles.backgroundColor}20` }}
            ></div>
          </div>
          <span className="text-lg md:text-xl font-bold tracking-tight text-foreground">
            {fields?.companyName?.value || "Consulta"}
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navigation.map((item:any) => (
            <div key={item.name} className="relative" ref={(el) => {
              dropdownRefs.current[item.name] = el;
            }}>
              {item.children ? (
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
                    <div className="absolute top-full left-0 mt-1 w-56 rounded-md border border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-5 duration-200">
                      <div className="py-1">
                        {item.children.map((child:any) => (
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

        <div className="flex items-center gap-4">
          <Link
            href={fields?.ctaButtonLink?.value || "#contact"}
            className="hidden md:inline-flex h-9 md:h-10 items-center justify-center rounded-md bg-primary px-4 md:px-6 py-2 text-sm font-medium text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {fields?.ctaButtonText?.value || "Get Started"}
          </Link>
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
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 animate-in slide-in-from-top duration-300">
          <div className="container py-3">
            <nav className="flex flex-col space-y-1">
              {navigation.map((item:any) => (
                <div key={item.name} className="w-full">
                  {item.children ? (
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
                      {activeDropdown === item.name && (
                        <div className="ml-4 mt-1 border-l-2 border-border/40 pl-4 animate-in slide-in-from-left duration-200">
                          {item.children.map((child:any) => (
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
              ))}
              <div className="pt-2">
                <Link
                  href={fields?.ctaButtonLink?.value || "#contact"}
                  className="flex h-10 items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-md w-full mt-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {fields?.ctaButtonText?.value || "Get Started"}
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

// Block properties for the page builder
export const properties: BlockProperties = {
  name: "Basic Header",
  description: "A responsive header with dropdown navigation and mobile menu",
  fields: {
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
    ctaButtonText: {
      type: "text",
      name: "ctaButtonText",
      label: "CTA Button Text",
      description: "Text for the call to action button",
      defaultValue: "Get Started"
    },
    ctaButtonLink: {
      type: "text",
      name: "ctaButtonLink",
      label: "CTA Button Link",
      description: "Link for the call to action button",
      defaultValue: "#contact"
    },
    headerBackgroundColor: {
      type: "color",
      name: "headerBackgroundColor",
      label: "Header Background Color",
      description: "Background color of the header",
      defaultValue: ""
    },
    headerBorderColor: {
      type: "color",
      name: "headerBorderColor",
      label: "Header Border Color",
      description: "Color of the bottom border",
      defaultValue: ""
    },
    logoBackgroundColor: {
      type: "color",
      name: "logoBackgroundColor",
      label: "Logo Background Color",
      description: "Background color for the logo container",
      defaultValue: "#000000"
    },
    logoTextColor: {
      type: "color",
      name: "logoTextColor",
      label: "Logo Text Color",
      description: "Text color for the logo initial",
      defaultValue: "#ffffff"
    },
    navigation: {
      type: "list",
      name: "navigation",
      label: "Navigation Items",
      description: "Main navigation items",
      value: {
        items: {
          name: {
            type: "text",
            label: "Name",
            description: "Navigation item name",
            name: "name"
          },
          href: {
            type: "text",
            label: "Link",
            description: "Navigation item link",
            name: "href"
          },
          children: {
            type: "list",
            label: "Dropdown Items",
            description: "Dropdown menu items (leave empty for no dropdown)",
            name: "children",
            value: {
              items: {
                name: {
                  type: "text",
                  label: "Name",
                  description: "Dropdown item name",
                  name: "name"
                },
                href: {
                  type: "text",
                  label: "Link",
                  description: "Dropdown item link",
                  name: "href"
                }
              }
            }
          }
        }
      },      defaultValue: [
        {
          name: "Home",
          href: "/",
        },
        {
          name: "Services",
          href: "/services",
        },
        {
          name: "About",
          href: "/about",
        },
        {
          name: "Case Studies",
          href: "#case-studies",
        },
        {
          name: "Contact",
          href: "#contact",
        },
      ]
    }
  }
};
