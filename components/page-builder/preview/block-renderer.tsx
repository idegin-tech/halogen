'use client';

import { useBuilderContext } from '@/context/builder.context';
import { BlockInstance } from '@/types/block.types';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

type BlockRendererProps = {
  pageId?: string;
};

export default function BlockRenderer({ pageId }: BlockRendererProps) {
  const { state } = useBuilderContext();
  const [blocksToRender, setBlocksToRender] = useState<BlockInstance[]>([]);

  useEffect(() => {
    const targetPageId = pageId || state.selectedPageId;
    
    if (targetPageId) {
      const filteredBlocks = state.blocks
        .filter(block => block.page === targetPageId)
        .sort((a, b) => a.index - b.index);
      
      setBlocksToRender(filteredBlocks);
    } else {
      setBlocksToRender([...state.blocks].sort((a, b) => a.index - b.index));
    }
  }, [pageId, state.selectedPageId, state.blocks]);

  return (
    <div className="block-renderer">
      {blocksToRender.map(block => (
        <BlockComponent 
          key={block.id}
          block={block}
          isSelected={state.selectedBlockId === block.id}
        />
      ))}
    </div>
  );
}

type BlockComponentProps = {
  block: BlockInstance;
  isSelected: boolean;
};

function BlockComponent({ block, isSelected }: BlockComponentProps) {
  const [Component, setComponent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { updateBuilderState } = useBuilderContext();
  
  const handleBlockClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateBuilderState({ selectedBlockId: block.id });
  };
  
  useEffect(() => {
    const importComponent = async () => {
      try {
        const componentPath = `@/blocks/${block.folderName}/${block.fileName.replace('.tsx', '')}`;
        
        const module = await import(componentPath);
        
        const component = module.default || (
          module[block.fileName.split('.')[0]] || 
          Object.values(module).find(exportedItem => 
            typeof exportedItem === 'function' && 
            exportedItem.name && 
            exportedItem.name !== 'properties'
          )
        );
        
        setComponent(() => component);
      } catch (err) {
        console.error(`Error loading component: ${block.folderName}/${block.fileName}`, err);
        setError(`Failed to load component: ${block.folderName}/${block.fileName}`);
      }
    };

    importComponent();
  }, [block.folderName, block.fileName]);

  if (error) {
    return <div className="block-error p-4 bg-red-50 border border-red-300 text-red-700">
      {error}
    </div>;
  }

  if (!Component) {
    return <div className="block-loading p-4">Loading component...</div>;
  }

  const blockClassName = isSelected 
    ? "block-wrapper block-selected relative cursor-pointer" 
    : "block-wrapper relative cursor-pointer hover:outline hover:outline-2 hover:outline-blue-200";

  return (
    <div className={blockClassName} onClick={handleBlockClick}>
      {isSelected && (
        <div className="absolute inset-0 outline-dashed outline-primary bg-primary/10 pointer-events-none z-50"></div>
      )}
      <Component {...block.value} />
    </div>
  );
}

export const DynamicBlockRenderer = dynamic(() => Promise.resolve(BlockRenderer), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading block renderer...</div>,
});