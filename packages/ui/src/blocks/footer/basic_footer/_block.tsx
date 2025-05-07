import { BlockProperties } from "@halogen/common/types"
import Link from 'next/link'
import React from 'react'

type Props = {}

export function BasicFooter({ }: Props) {
    return (
        <>
            <footer className="bg-muted py-12 border-t border-border/40">
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                        {/* Company Info */}
                        <div className="md:col-span-1">
                            <Link href="/" className="font-bold text-xl text-primary mb-4 inline-block">
                                Stratagem
                            </Link>
                            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                                Transforming businesses through strategic insights and actionable solutions since 2008.
                            </p>
                            <div className="flex space-x-4">
                                <a href="#" className="text-muted-foreground hover:text-primary" aria-label="LinkedIn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                        <rect width="4" height="12" x="2" y="9"></rect>
                                        <circle cx="4" cy="4" r="2"></circle>
                                    </svg>
                                </a>
                                <a href="#" className="text-muted-foreground hover:text-primary" aria-label="Twitter">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="font-medium text-base mb-4">Services</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/services/strategy" className="text-sm text-muted-foreground hover:text-primary">
                                        Strategy Consulting
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/services/operations" className="text-sm text-muted-foreground hover:text-primary">
                                        Operations Excellence
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/services/digital" className="text-sm text-muted-foreground hover:text-primary">
                                        Digital Transformation
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/services/finance" className="text-sm text-muted-foreground hover:text-primary">
                                        Financial Advisory
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h3 className="font-medium text-base mb-4">Company</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/about" className="text-sm text-muted-foreground hover:text-primary">
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/team" className="text-sm text-muted-foreground hover:text-primary">
                                        Our Team
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/careers" className="text-sm text-muted-foreground hover:text-primary">
                                        Careers
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">
                                        Contact Us
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="font-medium text-base mb-4">Contact</h3>
                            <address className="not-italic">
                                <p className="text-sm text-muted-foreground mb-2">
                                    123 Business Avenue<br />
                                    New York, NY 10001
                                </p>
                                <p className="text-sm text-muted-foreground mb-2">
                                    <a href="tel:+12125551234" className="hover:text-primary">+1 (212) 555-1234</a>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <a href="mailto:info@stratagemconsulting.com" className="hover:text-primary">info@stratagemconsulting.com</a>
                                </p>
                            </address>
                        </div>
                    </div>

                    <div className="border-t border-border/40 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-xs text-muted-foreground mb-4 md:mb-0">
                            &copy; {new Date().getFullYear()} Stratagem Consulting. All rights reserved.
                        </p>
                        <div className="flex space-x-6">
                            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary">
                                Terms of Service
                            </Link>
                            <Link href="/cookies" className="text-xs text-muted-foreground hover:text-primary">
                                Cookie Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    )
}

export const properties: BlockProperties = {
    name: "Basic footer",
    description: "A simple footer with links and copyright information.",
    fields: {
        badgeText: {
            type: "text",
            name: "badgeText",
            label: "Badge Text",
            description: "The text that appears in the rounded badge at the top.",
            required: false,
            defaultValue: "Now available for all businesses",
            placeholder: "Enter badge text",
          },
    }
}