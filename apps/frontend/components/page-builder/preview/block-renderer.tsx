'use client';

import { useBuilderContext } from '@/context/builder.context';
import { BlockInstance } from '@halogen/common/types';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AddBlock from '../components/AddBlock';
import { getBlockFromRegistry } from '@/lib/block-registry';
import { CheckIcon } from 'lucide-react';

type BlockRendererProps = {
  pageId?: string;
};

export default function BlockRenderer({ pageId }: BlockRendererProps) {
  const { state } = useBuilderContext();
  const [blocksToRender, setBlocksToRender] = useState<BlockInstance[]>([]);

  useEffect(() => {
    const targetPageId = pageId || state.selectedPageId;
    
    if (targetPageId) {
      // Filter blocks by page_id (frontend ID) instead of MongoDB page reference
      const filteredBlocks = state.blocks
        .filter(block => block.page_id === targetPageId)
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
          key={block.instance_id}
          block={block}
          isSelected={state.selectedBlockId === block.instance_id}
        />
      ))}
      <AddBlock />
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
  const { updateBuilderState, state } = useBuilderContext();
  
  const handleBlockClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateBuilderState({ selectedBlockId: block.instance_id });
};
  
  useEffect(() => {
    const importComponent = async () => {
      try {
        const folderName = block.folderName;
        const subFolder = block.subFolder;
        
        // Use the block registry to get the component
        const blockModule = await getBlockFromRegistry(folderName, subFolder);
        setComponent(() => blockModule.component);
      } catch (err) {
        console.error(`Error loading component: ${block.folderName}/${block.subFolder}/_block`, err);
        setError(`Failed to load component: ${block.folderName}/${block.subFolder}/_block`);
      }
    };

    importComponent();
  }, [block.folderName, block.subFolder]);

  if (error) {
    return <div className="block-error p-4 bg-red-50 border border-red-300 text-red-700">
      {error}
    </div>;
  }

  if (!Component) {
    return <div className="block-loading p-4">Loading component...</div>;
  }  const getRootBlock = (currentBlock: BlockInstance): BlockInstance => {
    if (currentBlock.ref || currentBlock.instance) {
      const instanceId = currentBlock.ref || currentBlock.instance;
      
      const sourceBlock = state.blocks.find(b => b.instance_id === instanceId);
      
      if (!sourceBlock) {
        console.warn(`Source block with ID ${instanceId} not found for linked block ${currentBlock.instance_id}`);
        return currentBlock; // Return current block as fallback
      }
      
      return getRootBlock(sourceBlock);
    }
    
    return currentBlock;
  };
  
  const rootBlock = getRootBlock(block);
  
  const blockValues = rootBlock.value || {};

  const blockClassName = isSelected 
    ? "block-wrapper block-selected relative cursor-pointer" 
    : "block-wrapper relative cursor-pointer hover:outline hover:outline-2 hover:outline-blue-200";

  return (
    <div className={blockClassName} onClick={handleBlockClick}>
      {isSelected && (
        <div className="absolute inset-0 outline-dashed outline-[#8A2BE2] pointer-events-none z-50">
          <small className='px-2 py-1 bg-[#8A2BE2] text-white rounded-lg shadow-md z-10 left-2 top-2 absolute flex items-center gap-1'><CheckIcon className='h-4 w-4'/> Selected</small>
        </div>
      )}
      {Component && (
        <div key={`block-content-${block.instance_id}`}>
          <Component {...blockValues} />
        </div>
      )}
    </div>
  );
}

export const DynamicBlockRenderer = dynamic(() => Promise.resolve(BlockRenderer), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading block renderer...</div>,
});