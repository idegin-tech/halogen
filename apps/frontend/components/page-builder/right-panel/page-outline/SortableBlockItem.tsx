'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight, ChevronDown, Component } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableBlockItemProps {
  id: string;
  index: number;
  name: string;
  folderName: string;
  subFolder: string;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
}

export function SortableBlockItem({
  id,
  index,
  name,
  folderName,
  subFolder,
  isSelected,
  isExpanded,
  onToggleExpand,
  onSelect
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center py-2 px-2 rounded-md mb-1 group transition-colors",
        isSelected 
          ? "bg-primary/10 border border-primary/20" 
          : "border border-transparent hover:bg-muted/50 hover:border-muted"
      )}
      onClick={onSelect}
    >
      <button
        className="mr-1 p-1 rounded hover:bg-muted/80"
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand();
        }}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      
      <div className="flex-1 flex items-center overflow-hidden">
        <div className="flex items-center justify-center h-7 w-7 bg-primary/10 rounded-full mr-2">
          <Component className="h-4 w-4 text-primary" />
        </div>
        
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-medium truncate">
            {name}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {folderName}/{subFolder}
          </span>
        </div>
      </div>
      
      <div
        className="touch-none opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
