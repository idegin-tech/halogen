import type { Metadata, ResolvingMetadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "../globals.css";
import Script from "next/script";
import { extractSubdomain } from "@/lib/subdomain";
import { fetchProjectData } from "@/lib/api";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata will be generated dynamically through generateMetadata

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string[] }> }, 
  parent: ResolvingMetadata
): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const subdomain = extractSubdomain(host);
  
  try {
    // Fetch site-level metadata with root path
    const projectData = await fetchProjectData(subdomain, '/', [`${subdomain}-layout-metadata`]);
    
    if (!projectData || !projectData.metadata) {
      const parentMetadata = await parent;
      return {
        title: parentMetadata.title,
        description: parentMetadata.description
      };
    }
    
    const { siteMetadata = {} } = projectData.metadata || {};
    const title = projectData.metadata.title || siteMetadata.title || 'Halogen Site';
    const description = siteMetadata.description || 'Created with Halogen';
    
    // Return site-level metadata
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: siteMetadata.ogImage ? [{ url: siteMetadata.ogImage }] : undefined,
        siteName: title,
        locale: siteMetadata.locale || 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: siteMetadata.ogImage ? [siteMetadata.ogImage] : undefined,
        creator: siteMetadata.twitterCreator || '@halogenhq',
      },
    };
  } catch (error) {
    console.error('Error generating layout metadata:', error);
    const parentMetadata = await parent;
    return {
      title: parentMetadata.title,
      description: parentMetadata.description
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  
  const subdomain = extractSubdomain(host);
  console.log('[DEBUG] Layout resolved subdomain:', subdomain, 'from host:', host);
  
  // Additional debug logging for local development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] Layout component subdomain extraction details:
      - Original host: ${host}
      - Extracted subdomain: ${subdomain}
      - Will be used in API URL: ${process.env.NEXT_PUBLIC_API_URL}/preview/projects/subdomain/${subdomain}?path=/&includeMetadata=true
    `);
  }

  let projectVariables: any[] = [];
  try {
    // Use the same endpoint as page.tsx with a root path
    const projectData = await fetchProjectData(subdomain, '/', [`${subdomain}-layout`]);
    
    if (!projectData) {
      console.warn(`No project data found for subdomain ${subdomain}. Using default variables.`);
    } else if (!projectData.variables) {
      console.warn(`Project data returned but no variables found for subdomain: ${subdomain}`);
    } else {
      projectVariables = projectData.variables;
    }
  } catch (error) {
    console.error(`Failed to load project data for subdomain ${subdomain}:`, error);
  }

  const tailwindThemeVariables = projectVariables
    .filter((v) => v.type === 'color')
    .map(v => {
      const varName = v.key.startsWith('--') ? v.key.substring(2) : v.key;
      return `--color-${varName}: ${v.primaryValue};`;
    })
    .join('\n        ');

  return (
    <html lang="en">
      <head>
        <Script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></Script>
        <style type="text/tailwindcss">
          {`
            @theme {
              ${tailwindThemeVariables}
            }
          `}
        </style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
