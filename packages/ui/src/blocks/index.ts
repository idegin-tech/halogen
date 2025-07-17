import { BlockProperties } from '@halogen/common/types';
import React from 'react';

export interface BlockRegistryItem {
  component: React.ComponentType<unknown>;
  properties: BlockProperties;
}

interface BlockConfig {
  name: string;
  path: string;
  displayName: string;
  description: string;
  hasThumbnail: boolean;
}

// Helper function to get component name based on folder structure
function getComponentName(folderName: string, subFolder: string): string {
  const folderPascal = folderName.charAt(0).toUpperCase() + folderName.slice(1);
  const subFolderPascal = subFolder.charAt(0).toUpperCase() + subFolder.slice(1);
  return `${folderPascal}${subFolderPascal}`;
}

const blocksConfig: Record<string, BlockConfig[]> = {
  header: [
    {
      name: "basic_header",
      path: "header/basic_header",
      displayName: "Basic Header",
      description: "A responsive header with dropdown navigation, mobile menu, and customizable buttons",
      hasThumbnail: false
    },
    {
      name: "dynamic_header",
      path: "header/dynamic_header",
      displayName: "Dynamic Header",
      description: "A dynamic header with navigation and user menu",
      hasThumbnail: false
    }
  ],
  test_run: [
    {
      name: "cta_section",
      path: "test_run/cta_section",
      displayName: "CTA Section",
      description: "A call-to-action section with configurable content and alignment",
      hasThumbnail: false
    },
    {
      name: "blog_section",
      path: "test_run/blog_section",
      displayName: "Blog Section",
      description: "A section to display blog posts with heading, subheading, and a show more button.",
      hasThumbnail: false
    }
  ]
};

export async function getBlockProperties(folderName: string, subFolder: string): Promise<BlockProperties | null> {
  try {
    const module = await import(`./${folderName}/${subFolder}/_block`);
    return module.properties || null;
  } catch (err) {
    console.error(`Failed to load properties for block ${folderName}/${subFolder}`, err);
    return null;
  }
}

export async function getBlockComponent(folderName: string, subFolder: string): Promise<React.ComponentType<unknown> | null> {
  try {
    const module = await import(`./${folderName}/${subFolder}/_block`);
    
    // Try multiple export patterns
    const component = module.default || 
                     module[subFolder.charAt(0).toUpperCase() + subFolder.slice(1)] ||
                     module[getComponentName(folderName, subFolder)] ||
                     module.SaasHeroSection ||
                     module.BasicTestimonials ||
                     module.BasicFooter ||
                     module.BasicHeader ||
                     module.DynamicHeader ||
                     module.BasicAboutUs ||
                     module.BlogSection ||
                     module.CTASection;
    
    return component as React.ComponentType<unknown> || null;
  } catch (err) {
    console.error(`Failed to load component for block ${folderName}/${subFolder}`, err);
    return null;
  }
}

export function getAllBlockPaths(): string[] {
  const paths: string[] = [];
  
  Object.entries(blocksConfig).forEach(([folderName, blocks]) => {
    if (Array.isArray(blocks)) {
      blocks.forEach((block: BlockConfig) => {
        paths.push(`${folderName}/${block.name}`);
      });
    }
  });
  
  return paths;
}

// Synchronous versions for backwards compatibility (deprecated)
export function getBlockPropertiesSync(_folderName: string, _subFolder: string): BlockProperties | null {
  console.warn('getBlockPropertiesSync is deprecated. Use getBlockProperties instead.');
  return null;
}

export function getBlockComponentSync(_folderName: string, _subFolder: string): React.ComponentType<unknown> | null {
  console.warn('getBlockComponentSync is deprecated. Use getBlockComponent instead.');
  return null;
}