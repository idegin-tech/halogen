import * as UiBlocks from '@repo/ui/blocks';
import { BlockProperties } from '@halogen/common/types';

export interface BlockModule {
  component: React.ComponentType<any>;
  properties: BlockProperties;
}

export async function getBlockFromRegistry(
  folderName: string, 
  subFolder: string
): Promise<BlockModule> {
  try {
    const path = `${folderName}/${subFolder}`;
    
    const component = await UiBlocks.getBlockComponent(folderName, subFolder);
    
    if (component) {
      const properties = await UiBlocks.getBlockProperties(folderName, subFolder) || {} as BlockProperties;
      
      return {
        component,
        properties
      };
    }
    
    throw new Error(`Block not found in UI package: ${path}`);
  } catch (err) {
    console.error(`Error loading UI block: ${folderName}/${subFolder}`, err);
    
    const ErrorComponent = ({ error }: { error?: string }) => (
      <div className="p-6 border-2 border-red-300 bg-red-50 rounded-md">
        <h3 className="text-lg font-semibold text-red-700 mb-2">Block Error</h3>
        <p className="text-red-600 mb-2">Failed to load block from UI package:</p>
        <p className="font-mono bg-white p-2 rounded border text-sm">{folderName}/{subFolder}</p>
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
    
    return {
      component: ErrorComponent,
      properties: {
        name: `Error: ${folderName}/${subFolder}`,
        description: `This block could not be loaded from the UI package.`,
        contentFields:{},
        layoutFields: {},
        themeFields: {},
      }
    };
  }
}