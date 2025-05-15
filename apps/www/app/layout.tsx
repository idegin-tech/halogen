import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { headers } from 'next/headers';

// Default font as fallback
const defaultFont = Geist({
  variable: "--font-default",
  subsets: ["latin"],
  display: 'swap',
});

// Function to extract subdomain from host
function getSubdomain(host: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0];
  
  // Check if it's localhost or an IP address
  if (hostname === 'localhost' || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return null;
  }
  
  // Split by dots and check for subdomains
  const parts = hostname.split('.');
  if (parts.length <= 2) return null; // No subdomain (example.com)
  
  return parts[0];
}

// Function to fetch project by subdomain
async function getProjectBySubdomain(subdomain: string) {
  try {
    // Use absolute URL to ensure it works in both development and production
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const apiUrl = `${protocol}://${process.env.NEXT_PUBLIC_API_HOST || 'localhost:4000'}/api/projects/subdomain/${subdomain}`;
    
    const response = await fetch(apiUrl, { 
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch project: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching project by subdomain:', error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const subdomain = getSubdomain(host);
  
  let title = "Halogen Website Builder";
  let description = "Render dynamic websites based on subdomain";
  
  if (subdomain) {
    const project = await getProjectBySubdomain(subdomain);
    if (project && project.metadata) {
      title = project.metadata.title || title;
      description = project.metadata.description || description;
    }
  }
  
  return {
    title,
    description,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const subdomain = getSubdomain(host);
  
  let headingFont = null;
  let bodyFont = null;
  let googleFontsUrl = null;
  
  if (subdomain) {
    const project = await getProjectBySubdomain(subdomain);
    if (project && project.settings) {
      headingFont = project.settings.headingFont;
      bodyFont = project.settings.bodyFont;
      
      if (headingFont || bodyFont) {
        // Create Google Fonts URL
        const fontFamilies = [];
        if (headingFont) fontFamilies.push(headingFont.replace(/\s/g, '+'));
        if (bodyFont && bodyFont !== headingFont) fontFamilies.push(bodyFont.replace(/\s/g, '+'));
        
        if (fontFamilies.length > 0) {
          googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontFamilies.join('&family=')}&display=swap`;
        }
      }
    }
  }

  return (
    <html lang="en" className={`${defaultFont.variable}`}>
      <head>
        {googleFontsUrl && (
          <link 
            rel="stylesheet" 
            href={googleFontsUrl} 
            crossOrigin="anonymous" 
          />
        )}
      </head>
      <body 
        className="min-h-screen bg-background"
        style={{
          fontFamily: bodyFont ? `"${bodyFont}", var(--font-default), sans-serif` : undefined
        }}
      >
        {children}
      </body>
    </html>
  );
}
