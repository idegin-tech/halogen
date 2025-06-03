import { BlockProperties } from '@halogen/common/types';
import React from 'react';
import blocksConfig from '../blocks.json';

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
                     module.BasicAboutUs;
    
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