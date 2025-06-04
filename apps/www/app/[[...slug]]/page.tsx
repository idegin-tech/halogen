import React from 'react';
import { headers } from 'next/headers';
import * as UiBlocks from '@repo/ui/blocks';
import { BlockInstance, PageData } from '@halogen/common/types';
import { fetchProjectData } from '@/lib/api';
import { extractSubdomain } from '@/lib/subdomain';
import { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string[] }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const subdomain = extractSubdomain(host);

  const resolvedParams = await params;
  const pathSegment = resolvedParams.slug ? `/${resolvedParams.slug.join('/')}` : '/';
  try {
    const projectData = await fetchProjectData(subdomain, pathSegment, [`${subdomain}-metadata`]);
    if (!projectData || !projectData.metadata) {

      const parentMetadata = await parent;
      return {
        title: parentMetadata.title,
        description: parentMetadata.description
      };
    }

    const favicon = projectData.metadata.favicon || undefined;

    const metadata = projectData.metadata;
    const title = metadata.title || 'Halogen Site';
    const description = metadata.description || 'Created with Halogen';
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
        creator: `@${metadata.ogTitle || title}`,
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    const parentMetadata = await parent;
    return {
      title: parentMetadata.title,
      description: parentMetadata.description
    };
  }
}

const extractNestedValues = (obj: any): any => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if ('value' in obj && Object.keys(obj).length === 1) {
    return extractNestedValues(obj.value);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => extractNestedValues(item));
  }

  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => [key, extractNestedValues(val)])
  );
};

type Props = {
  params: Promise<{ slug: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CatchAllPage({ params }: Props) {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const subdomain = extractSubdomain(host);
  console.log(`Page component resolved subdomain: ${subdomain} from host: ${host}`);

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] Page component subdomain extraction details:
      - Original host: ${host}
      - Extracted subdomain: ${subdomain}
      - Will be used in API URL: ${process.env.NEXT_PUBLIC_API_URL}/preview/projects/subdomain/${subdomain}
    `);
  }
  const resolvedParams = await params;
  const pathSegment = resolvedParams.slug ? `/${resolvedParams.slug.join('/')}` : '/';

  try {
    const projectData = await fetchProjectData(subdomain, pathSegment, [subdomain]);

    if (!projectData) {
      console.error(`Project not found: Subdomain=${subdomain}, Path=${pathSegment}, Host=${host}`);      return (
        <div className="container mx-auto p-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold">Page Not Found</h1>
            <p className="text-lg">Could not find any content for this page.</p>
            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-4 p-5 border rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-3">Debug Information</h2>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Subdomain:</div>
                    <div className="font-mono px-2 py-1 rounded">{subdomain}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Path:</div>
                    <div className="font-mono px-2 py-1 rounded">{pathSegment}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Host:</div>
                    <div className="font-mono px-2 py-1 rounded">{host}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Full Domain:</div>
                    <div className="font-mono px-2 py-1 rounded">{host.split(':')[0]}</div>
                  </div>                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Error:</div>
                    <div className="font-mono px-2 py-1 rounded">Project data not found</div>
                  </div>
                </div>
              </div>
            )}
          </div>        </div>
      );
    }

    const matchingPage = projectData.pages?.find((page: PageData) => page.path === pathSegment); if (!matchingPage) {      return (
        <div className="container mx-auto p-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold">Page Not Found</h1>
            <p className="text-lg">No page found matching this path.</p>
            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-4 p-5 border rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-3">Debug Information</h2>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Subdomain:</div>
                    <div className="font-mono px-2 py-1 rounded">{subdomain}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Path:</div>
                    <div className="font-mono px-2 py-1 rounded">{pathSegment}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Host:</div>
                    <div className="font-mono px-2 py-1 rounded">{host}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Project ID:</div>
                    <div className="font-mono px-2 py-1 rounded">{projectData.project_id}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Error:</div>
                    <div className="font-mono px-2 py-1 rounded">No matching page for this path</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    const pageBlocks: BlockInstance[] = projectData.blocks?.filter((block: BlockInstance) => block.page_id === matchingPage.page_id); if (!pageBlocks || pageBlocks.length === 0) {      return (
        <div className="container mx-auto p-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold">Empty Page</h1>
            <p className="text-lg">This page has no content blocks.</p>
            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-4 p-5 border rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-3">Debug Information</h2>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Subdomain:</div>
                    <div className="font-mono px-2 py-1 rounded">{subdomain}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Path:</div>
                    <div className="font-mono px-2 py-1 rounded">{pathSegment}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Host:</div>
                    <div className="font-mono px-2 py-1 rounded">{host}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Page ID:</div>
                    <div className="font-mono px-2 py-1 rounded">{matchingPage.page_id}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Project ID:</div>
                    <div className="font-mono px-2 py-1 rounded">{projectData.project_id}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Status:</div>
                    <div className="font-mono px-2 py-1 rounded">No content blocks found for this page</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }


    const sortedBlocks = [...pageBlocks].sort((a, b) => a.index - b.index);


    const getRootBlock = (currentBlock: BlockInstance): BlockInstance => {
      if (currentBlock.ref) {
        const sourceBlock = projectData.blocks.find(
          (b: BlockInstance) => b.instance_id === currentBlock.ref
        );

        if (!sourceBlock) {
          return currentBlock;
        }

        return getRootBlock(sourceBlock);
      }

      return currentBlock;
    };

    return (
      <div className="site-content">        {sortedBlocks.length === 0 ? (        <div className="container mx-auto p-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold">Empty Page</h1>
            <p className="text-lg">This page has no content blocks.</p>
          </div>
        </div>) : (
        await Promise.all(sortedBlocks.map(async (block) => {
          const BlockComponent = await UiBlocks.getBlockComponent(block.folderName, block.subFolder);

          if (!BlockComponent) {            return (
              <div key={block.instance_id} className="p-4 border rounded-md shadow-sm">
                {process.env.NODE_ENV !== 'production' ? (
                  <p className="font-mono text-sm">Failed to load component: {block.folderName}/{block.subFolder}</p>
                ) : (
                  <p>This content cannot be displayed</p>
                )}
              </div>
            );
          }

          const rootBlock = getRootBlock(block);
          const blockValues = rootBlock.value || {};

          return (
            <div key={block.instance_id} className="block-wrapper">
              <BlockComponent {...blockValues} />
            </div>
          );
        }))
      )}
      </div>
    );
  } catch (error) {
    console.log(error)
    console.error(`Failed to render page: Subdomain=${subdomain}, Path=${pathSegment}, Host=${host}`, error);    return (
      <div className="container mx-auto p-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold">Error</h1>
          <div className="p-5 border rounded-lg shadow-sm">
            <p className="text-xl font-medium mb-2">Could not load page content</p>
            <p className="">An unexpected error occurred while trying to load this page.</p>

            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-6 p-5 border rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-3">Debug Information</h2>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Subdomain:</div>
                    <div className="font-mono px-2 py-1 rounded">{subdomain}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Path:</div>
                    <div className="font-mono px-2 py-1 rounded">{pathSegment}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Host:</div>
                    <div className="font-mono px-2 py-1 rounded">{host}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Full Domain:</div>
                    <div className="font-mono px-2 py-1 rounded">{host.split(':')[0]}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start">
                    <div className="font-medium">Error:</div>
                    <div className="font-mono px-2 py-1 rounded">{error instanceof Error ? error.message : String(error)}</div>
                  </div>

                  {error instanceof Error && error.stack && (
                    <details className="mt-4 border rounded-md">
                      <summary className="cursor-pointer p-2 font-medium">Stack Trace</summary>
                      <pre className="p-3 text-xs overflow-x-auto border-t">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
