import type { Metadata, ResolvingMetadata } from "next";
import { headers } from "next/headers";
import "../globals.css";
import Script from "next/script";
import { extractSubdomain } from "@/lib/subdomain";
import { fetchProjectData } from "@/lib/api";
import Link from "next/link";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string[] }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const subdomain = extractSubdomain(host);

  try {
    const projectData = await fetchProjectData(subdomain, '/', [`${subdomain}-layout-metadata`]);

    if (!projectData || !projectData.metadata) {
      const parentMetadata = await parent;
      return {
        title: parentMetadata.title,
        description: parentMetadata.description
      };
    }

    const metadata = projectData.metadata;
    const title = metadata.title || 'Halogen Site';
    const description = metadata.description || 'Created with Halogen';
    const favicon = metadata.favicon || undefined;
    const keywords = metadata.keywords || '';

    return {
      title,
      description,
      keywords,
      icons: favicon ? { icon: favicon, apple: favicon } : undefined,
      openGraph: {
        title: metadata.ogTitle || title,
        description: metadata.ogDescription || description,
        images: metadata.ogImage ? [{ url: metadata.ogImage }] : undefined,
        siteName: title,
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: metadata.ogTitle || title,
        description: metadata.ogDescription || description,
        images: metadata.ogImage ? [metadata.ogImage] : undefined,
        creator: '@halogenhq',
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

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] Layout component subdomain extraction details:
      - Original host: ${host}
      - Extracted subdomain: ${subdomain}
      - Will be used in API URL: ${process.env.NEXT_PUBLIC_API_URL}/preview/projects/subdomain/${subdomain}?path=/&includeMetadata=true
    `);
  }

  let projectVariables: any[] = [];
  let headingFont: string | null = null;
  let bodyFont: string | null = null;
  let googleFontsUrl: string | null = null;
  
  try {
    const projectData = await fetchProjectData(subdomain, '/', [`${subdomain}-layout`]);
    // console.log('THE PROJECT KEYS::', Object.keys(projectData))
    // console.log('VARIABLES :::', projectData?.variables)

    if (projectData?.variables) {
      projectVariables = projectData.variables;
      
      if (projectData.settings) {
        headingFont = projectData.settings.headingFont;
        bodyFont = projectData.settings.bodyFont;
        
        if (headingFont || bodyFont) {
          const fontFamilies = [];
          if (headingFont) fontFamilies.push(headingFont.replace(/\s/g, '+'));
          if (bodyFont && bodyFont !== headingFont) fontFamilies.push(bodyFont.replace(/\s/g, '+'));
          
          if (fontFamilies.length > 0) {
            googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontFamilies.join('&family=')}&display=swap`;
          }
        }
      }
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

    // console.log('\n\n')
    // console.log({
    //   headingFont,
    //   bodyFont,
    //   googleFontsUrl
    // })

    console.log(`FORMATTED VARIABLES:::`, tailwindThemeVariables)

  return (
    <html lang="en">
      <head>
        <Script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></Script>
        {googleFontsUrl && (
          <link 
            rel="stylesheet" 
            href={googleFontsUrl} 
            crossOrigin="anonymous" 
          />
        )}
        <style type="text/tailwindcss">
          {`
            @theme {
              ${tailwindThemeVariables}
            }
            
            ${headingFont ? `h1, h2, h3, h4, h5, h6 { font-family: "${headingFont}", sans-serif; }` : ''}
            ${bodyFont ? `body { font-family: "${bodyFont}", sans-serif; }` : ''}
          `}
        </style>
      </head>
      <body
        className={`antialiased min-h-screen grid grid-cols-1`}
        style={{
          fontFamily: bodyFont ? `"${bodyFont}", sans-serif` : undefined
        }}
      >
        {children}
      </body>
    </html>
  );
}
