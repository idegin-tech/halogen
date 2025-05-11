import React from 'react';
import { headers } from 'next/headers';
import * as UiBlocks from '@repo/ui/blocks';
import { fetchProjectData } from '@/lib/api';

export default async function CatchAllPage({ params }: { params: { slug?: string[] } }) {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  
  const subdomain = host.split('.')[0];
  const pathSegment = params.slug ? `/${params.slug.join('/')}` : '/';
  
  try {
    const projectData = await fetchProjectData(subdomain, pathSegment);

    if (!projectData || !projectData.blocks) {
      return (
        <div className="container mx-auto p-8">
          <h1 className="text-3xl font-bold mb-6">Page Not Found</h1>
          <p>Could not find any content for this page.</p>
        </div>
      );
    }

    const sortedBlocks = [...projectData.blocks].sort((a, b) => a.index - b.index);

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
                  Failed to load component: {block.folderName}/{block.subFolder}
                </div>
              );
            }
            
            const blockValues = block.value || {};
            
            return (
              <div key={block.instance_id} className="block-wrapper">
                <BlockComponent {...blockValues} />
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
          <p><strong>Subdomain:</strong> {subdomain}</p>
          <p><strong>Path:</strong> {pathSegment}</p>
        </div>
      </div>
    );
  }
}
