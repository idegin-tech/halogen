import { BlockProperties } from '@halogen/common/types';
import React from 'react';

export type BlockPath = 'hero/basic_saas_hero' | 'testimonials/simple_testimonial' | 'footer/basic_footer';

export interface BlockRegistryItem {
  component: React.ComponentType<unknown>;
  properties: BlockProperties;
}

const blockRegistry: Record<string, BlockRegistryItem> = {};

interface WebpackContext {
  keys(): string[];
  (id: string): Record<string, unknown>;
  <T>(id: string): T;
  resolve(id: string): string;
  id: string;
}

declare global {
  interface NodeRequire {
    context(directory: string, useSubdirectories: boolean, regExp: RegExp): WebpackContext;
  }
}

// @ts-expect-error - require.context is provided by webpack at runtime
const blocksContext: WebpackContext = require.context('./', true, /\/_block\.tsx$/);

blocksContext.keys().forEach((path: string) => {
  try {
    const pathMatch = path.match(/^\.\/([^/]+)\/([^/]+)\/_block\.tsx$/);
    
    if (pathMatch) {
      const [, folderName, subFolder] = pathMatch;
      if (folderName && subFolder) {
        const registryPath = `${folderName}/${subFolder}`;
        
        const module = blocksContext(path);
        
        const component = module.default || 
                          module[subFolder.charAt(0).toUpperCase() + subFolder.slice(1)] ||
                          module[`${folderName.charAt(0).toUpperCase() + folderName.slice(1)}${subFolder.charAt(0).toUpperCase() + subFolder.slice(1)}`] ||
                          module.SaasHeroSection ||
                          module.BasicTestimonials ||
                          module.BasicFooter;
        
        const properties = module.properties as BlockProperties;
        
        if (component && properties) {
          blockRegistry[registryPath] = {
            component: component as React.ComponentType<unknown>,
            properties
          };
          
          if (typeof component === 'function' && 'name' in component) {
            exports[(component as { name: string }).name] = component;
          }
        } else {
          console.warn(`Block at ${path} doesn't export both a component and properties`);
        }
      }
    }
  } catch (err) {
    console.error(`Failed to load block at ${path}`, err);
  }
});

export function getBlockProperties(folderName: string, subFolder: string): BlockProperties | null {
  const path = `${folderName}/${subFolder}`;
  return blockRegistry[path]?.properties || null;
}

export function getBlockComponent(folderName: string, subFolder: string): React.ComponentType<unknown> | null {
  const path = `${folderName}/${subFolder}`;
  return blockRegistry[path]?.component || null;
}

export function getAllBlockPaths(): string[] {
  return Object.keys(blockRegistry);
}

export const blockProperties: Partial<Record<BlockPath, BlockProperties>> = {};
Object.entries(blockRegistry).forEach(([path, item]) => {
  blockProperties[path as BlockPath] = item.properties;
});

export { SaasHeroSection } from './hero/basic_saas_hero/_block';
export { BasicTestimonials } from './testimonials/simple_testimonial/_block';
export { BasicFooter } from './footer/basic_footer/_block';