import React from 'react';
import { headers } from 'next/headers';
import * as UiBlocks from '@repo/ui/blocks';
import { BlockInstance, PageData } from '@halogen/common/types';
import { fetchProjectData } from '@/lib/api';

export default async function CatchAllPage({ params }: { 
  params: Promise<{ slug: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
 }) {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  const subdomain = host.split('.')[0];
  const allParams = await params;
  const pathSegment = allParams.slug ? `/${allParams.slug.join('/')}` : '/';
  try {
    const projectData = await fetchProjectData(subdomain, pathSegment, [subdomain]);

    if (!projectData) {
      return (
        <div className="container mx-auto p-8">
          <h1 className="text-3xl font-bold mb-6">Page Not Found</h1>
          <p>Could not find any content for this page.</p>
        </div>
      );
    }

    const matchingPage = projectData.pages?.find((page: PageData) => page.path === pathSegment);

    if (!matchingPage) {
      return (
        <div className="container mx-auto p-8">
          <h1 className="text-3xl font-bold mb-6">Page Not Found</h1>
          {/* <p>No page found matching this path: {pathSegment}</p> */}
        </div>
      );
    }

    const pageBlocks: BlockInstance[] = projectData.blocks?.filter((block: BlockInstance) => block.page_id === matchingPage.page_id);

    if (!pageBlocks || pageBlocks.length === 0) {
      return (
        <div className="container mx-auto p-8">
          <h1 className="text-3xl font-bold mb-6">Empty Page</h1>
          <p>This page has no content blocks.</p>
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
      <div className="site-content">
        {sortedBlocks.length === 0 ? (
          <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Empty Page</h1>
            <p>This page has no content blocks.</p>
          </div>
        ) : (
          sortedBlocks.map(block => {
            const BlockComponent = UiBlocks.getBlockComponent(block.folderName, block.subFolder);

            if (!BlockComponent) {
              return (
                <div key={block.instance_id} className="p-4 bg-red-50 border border-red-300 text-red-700">
                  {/* Failed to load component: {block.folderName}/{block.subFolder} */}
                </div>
              );
            }

            const rootBlock = getRootBlock(block);
            const blockValues = rootBlock.value || {}; 
            const safeBlockValues = typeof blockValues === 'object' && blockValues !== null 
              ? Object.fromEntries(
                  Object.entries(blockValues)
                    .map(([key, val]) => {
                      if (val && typeof val === 'object' && 'value' in val) {
                        return [key, val.value];
                      }
                      return [key, val];
                    })
                )
              : {};

            return (
              <div key={block.instance_id} className="block-wrapper">
                {/* <BlockComponent {...safeBlockValues} /> */}
              </div>
            );
          })
        )}
      </div>
    );
  } catch (error) {
    console.error('Failed to render page:', error);

    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Error</h1>
        <div className="bg-red-50 p-4 rounded-md border border-red-300">
          <p className="text-xl mb-2">Could not load page content.</p>
          {/* <p><strong>Subdomain:</strong> {`${subdomain}`}</p>
          <p><strong>Path:</strong> {`${pathSegment}`}</p> */}
        </div>
      </div>
    );
  }
}
