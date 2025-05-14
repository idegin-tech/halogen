import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "../globals.css";
import Script from "next/script";
import { extractSubdomain } from "@/lib/subdomain";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "My Halogen Site",
//   description: "This site was generated with Halogen",
// };

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
      - Will be used in API URL: ${process.env.NEXT_PUBLIC_API_URL}/preview/projects/subdomain/${subdomain}/layout-variables
    `);
  }

  let projectVariables: any[] = [];
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = `${apiBaseUrl}/preview/projects/subdomain/${subdomain}/layout-variables`;
    
    const response = await fetch(apiUrl, {
      next: { 
        revalidate: 180,
        tags: [`layout-variables-${subdomain}`], 
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Layout variables not found for subdomain "${subdomain}". Using default variables.`);
      } else {
        throw new Error(`Failed to fetch layout variables: ${response.statusText}`);
      }
    } else {
      const result = await response.json();
      const layoutData = result.payload;

      if (!layoutData) {
        console.error(`No layout data returned for subdomain: ${subdomain}`);
      } else if (!layoutData.variables) {
        console.error(`Layout data returned but no variables found for subdomain: ${subdomain}`);
      } else {
        projectVariables = layoutData.variables;
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
