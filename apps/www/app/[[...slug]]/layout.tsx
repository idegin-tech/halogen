import type { Metadata, ResolvingMetadata } from "next";
import { headers } from "next/headers";
import "../globals.css";
import Script from "next/script";
import { extractSubdomain } from "@/lib/subdomain";
import { fetchProjectData } from "@/lib/api";

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
  try {
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
        className={`antialiased bg-background text-foreground min-h-screen grid grid-cols-1`}
      >
        {children}
      </body>
    </html>
  );
}
