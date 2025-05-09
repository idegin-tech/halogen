'use client';

import React, { useEffect, useState } from 'react';
import { useBuilderContext } from '@/context/builder.context';
import PropertyFormContainer from './PropertyFormContainer';
import { Button } from '@/components/ui/button'; 
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Link, Unlink, AlertCircle } from 'lucide-react';
import { getBlockProperties } from '@repo/ui/blocks';
import { BlockConfigListValue, BlockFieldConfig, BlockProperties } from '@halogen/common/types';

export default function BlockConfigForm() {
  const { state, updateBuilderState } = useBuilderContext();
  const [blockProperties, setBlockProperties] = useState<BlockProperties | null>(null);
  const [blockLoadError, setBlockLoadError] = useState<string | null>(null);
  const selectedBlock = state.blocks.find(block => block.instance_id === state.selectedBlockId);
  const [activeListItem, setActiveListItem] = useState<{ fieldName: string, itemIndex: number } | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  useEffect(() => {
    const loadBlockProperties = async () => {
      if (!selectedBlock) {
        setBlockProperties(null);
        return;
      }

      try {
        const properties = getBlockProperties(selectedBlock.folderName, selectedBlock.subFolder);
        
        if (properties) {
          setBlockProperties(properties);
          setBlockLoadError(null);
        } else {
          throw new Error(`Block properties not found for ${selectedBlock.folderName}/${selectedBlock.subFolder}`);
        }
      } catch (err: any) {
        console.error('Error loading block properties:', err);
        setBlockLoadError(err?.message || 'Failed to load block properties from UI package');
      }
    };

    loadBlockProperties();
  }, [selectedBlock]);

  const getEffectiveValues = () => {
    if (!selectedBlock) return {};
    
    const findRootBlock = (block: any): any => {
      if (block.value !== null || block.instance === null) {
        return block;
      }
      const instanceBlock = state.blocks.find(b => b.instance_id === block.instance);
      if (!instanceBlock) return block;
      
      return findRootBlock(instanceBlock);
    };
    
    const rootBlock = findRootBlock(selectedBlock);
    return rootBlock.value || {};
  };

  const getSourceBlock = () => {
    if (!selectedBlock) return null;
    
    const findRootBlock = (block: any): any => {
      if (block.value !== null || block.instance === null) {
        return block;
      }
      const instanceBlock = state.blocks.find(b => b.instance_id === block.instance);
      if (!instanceBlock) return block;
      
      return findRootBlock(instanceBlock);
    };
    
    return findRootBlock(selectedBlock);
  };

  const handleUnlinkBlock = () => {
    if (!selectedBlock || !selectedBlock.instance) return;

    const sourceBlock = state.blocks.find(b => b.instance_id === selectedBlock.instance);
    if (!sourceBlock) return;
    
    // Copy its values
    const instanceValues = JSON.parse(JSON.stringify(sourceBlock.value));
    
    const updatedBlocks = state.blocks.map(block => {
      if (block.instance_id === selectedBlock.instance_id) {
        return {
          ...block,
          instance: null,
          value: instanceValues
        };
      }
      return block;
    });

    updateBuilderState({ blocks: updatedBlocks });
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    if (!selectedBlock) return;

    const sourceBlock = getSourceBlock();
    if (!sourceBlock) return;

    const updatedBlocks = state.blocks.map(block => {
      if (block.instance_id === sourceBlock.instance_id) {
        const updatedValue = {
          ...(block.value || {}),
          [fieldName]: {
            ...(block.value?.[fieldName] || {}),
            value: value
          }
        };

        return {
          ...block,
          value: updatedValue
        };
      }
      
      return block;
    });

    updateBuilderState({ blocks: updatedBlocks });
  };

  const handleListItemChange = (fieldName: string, itemIndex: number, itemFieldName: string, value: any) => {
    if (!selectedBlock) return;
    
    const effectiveValues = getEffectiveValues();
    const currentList = effectiveValues[fieldName]?.value || [];
    const updatedList = [...currentList];

    if (!updatedList[itemIndex]) {
      updatedList[itemIndex] = {};
    }

    updatedList[itemIndex] = {
      ...updatedList[itemIndex],
      [itemFieldName]: value
    };

    handleFieldChange(fieldName, updatedList);
  };

  const addListItem = (fieldName: string) => {
    if (!selectedBlock) return;

    const effectiveValues = getEffectiveValues();
    const currentList = effectiveValues[fieldName]?.value || [];
    const updatedList = [...currentList, {}];

    handleFieldChange(fieldName, updatedList);

    setActiveListItem({ fieldName, itemIndex: updatedList.length - 1 });
    setIsPopoverOpen(true);
  };

  const removeListItem = (fieldName: string, itemIndex: number) => {
    if (!selectedBlock) return;

    const effectiveValues = getEffectiveValues();
    const currentList = effectiveValues[fieldName]?.value || [];
    const updatedList = currentList.filter((_: any, index: number) => index !== itemIndex);

    handleFieldChange(fieldName, updatedList);

    if (activeListItem?.fieldName === fieldName && activeListItem?.itemIndex === itemIndex) {
      setActiveListItem(null);
      setIsPopoverOpen(false);
    }
  };

  const renderListItemForm = (fieldName: string, listConfig: BlockFieldConfig, itemIndex: number) => {
    if (!selectedBlock) return null;

    const effectiveValues = getEffectiveValues();
    const listValue = effectiveValues[fieldName]?.value || [];
    const itemValue = listValue[itemIndex] || {};
    const listItemConfig = (listConfig.value as BlockConfigListValue).items;

    return (
      <div className="space-y-4 py-4 w-full px-2">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">Edit Item {itemIndex + 1}</h4>
          <Button
            variant="destructive"
            size="sm"
            className="h-8"
            onClick={() => removeListItem(fieldName, itemIndex)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
        <Separator />
        {Object.entries(listItemConfig).map(([itemFieldName, itemField]) => (
          <div key={itemFieldName} className="space-y-2 w-full">
            {renderItemFieldInput(
              fieldName,
              itemIndex,
              itemFieldName,
              itemField,
              itemValue[itemFieldName]
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderItemFieldInput = (fieldName: string, itemIndex: number, itemFieldName: string, itemField: any, value: any) => {
    switch (itemField.type) {
      case 'text':
        return (
          <div className="grid gap-1.5">
            <label htmlFor={`${fieldName}-${itemIndex}-${itemFieldName}`} className="text-sm font-medium">
              {itemField.label}
            </label>
            <Input
              id={`${fieldName}-${itemIndex}-${itemFieldName}`}
              placeholder={itemField.placeholder || `Enter ${itemField.label.toLowerCase()}`}
              value={value || itemField.defaultValue || ''}
              onChange={(e) => handleListItemChange(fieldName, itemIndex, itemFieldName, e.target.value)}
              className="w-full"
            />
            {itemField.description && (
              <p className="text-xs text-muted-foreground">{itemField.description}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div className="grid gap-1.5">
            <label htmlFor={`${fieldName}-${itemIndex}-${itemFieldName}`} className="text-sm font-medium">
              {itemField.label}
            </label>
            <Textarea
              id={`${fieldName}-${itemIndex}-${itemFieldName}`}
              placeholder={itemField.placeholder || `Enter ${itemField.label.toLowerCase()}`}
              value={value || itemField.defaultValue || ''}
              onChange={(e) => handleListItemChange(fieldName, itemIndex, itemFieldName, e.target.value)}
              className="w-full min-h-[80px]"
            />
            {itemField.description && (
              <p className="text-xs text-muted-foreground">{itemField.description}</p>
            )}
          </div>
        );

      case 'url':
        return (
          <div className="grid gap-1.5">
            <label htmlFor={`${fieldName}-${itemIndex}-${itemFieldName}`} className="text-sm font-medium">
              {itemField.label}
            </label>
            <Input
              id={`${fieldName}-${itemIndex}-${itemFieldName}`}
              type="url" 
              placeholder={itemField.placeholder || `Enter URL`}
              value={value || itemField.defaultValue || ''}
              onChange={(e) => handleListItemChange(fieldName, itemIndex, itemFieldName, e.target.value)}
              className="w-full"
            />
            {itemField.description && (
              <p className="text-xs text-muted-foreground">{itemField.description}</p>
            )}
          </div>
        );

      default:
        return (
          <div className="grid gap-1.5">
            <label htmlFor={`${fieldName}-${itemIndex}-${itemFieldName}`} className="text-sm font-medium">
              {itemField.label}
            </label>
            <Input
              id={`${fieldName}-${itemIndex}-${itemFieldName}`}
              placeholder={itemField.placeholder || `Enter ${itemField.label.toLowerCase()}`}
              value={value || itemField.defaultValue || ''}
              onChange={(e) => handleListItemChange(fieldName, itemIndex, itemFieldName, e.target.value)}
              className="w-full"
            />
            {itemField.description && (
              <p className="text-xs text-muted-foreground">{itemField.description}</p>
            )}
          </div>
        );
    }
  };

  const renderFieldInput = (fieldName: string, field: any) => {
    const effectiveValues = getEffectiveValues();
    const value = effectiveValues[fieldName]?.value ?? field.defaultValue;

    if (field.type === 'list') {
      const listConfig = field.value as BlockConfigListValue;
      const listItems = value || [];

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">{field.label}</label>
              {field.description && (
                <span className="text-xs text-muted-foreground block">{field.description}</span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addListItem(fieldName)}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>

          {listItems.length === 0 ? (
            <div className="text-center p-4 border border-dashed rounded-lg border-muted bg-muted/50">
              <p className="text-sm text-muted-foreground">No items added yet</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => addListItem(fieldName)}
              >
                Add First Item
              </Button>
            </div>
          ) : (
            <div className="grid gap-1">
              {listItems.map((item: any, index: number) => {
                const nameField = Object.keys(listConfig.items).find(
                  (key: string) => {
                    const itemConfig = (listConfig.items as Record<string, any>)[key];
                    return itemConfig?.name === 'name' || key === 'name';
                  }
                );

                const displayName = nameField && item[nameField]
                  ? item[nameField]
                  : `Item ${index + 1}`;

                const isActive = activeListItem?.fieldName === fieldName && activeListItem?.itemIndex === index;

                return (
                  <Popover
                    key={`${fieldName}-${index}`}
                    open={isActive && isPopoverOpen}
                    onOpenChange={(open) => {
                      if (open) {
                        setActiveListItem({ fieldName, itemIndex: index });
                        setIsPopoverOpen(true);
                      } else {
                        setIsPopoverOpen(false);
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Card
                        className={`cursor-pointer hover:border-primary transition-colors ${isActive ? 'border-primary' : ''}`}
                      >
                        <CardContent className="p-3">
                          <p className="font-medium">{displayName}</p>
                        </CardContent>
                      </Card>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      {renderListItemForm(fieldName, field, index)}
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    switch (field.type) {
      case 'text':
        return (
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">{field.label}</label>
            <Input
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              className="w-full"
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">{field.label}</label>
            <Textarea
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              className="w-full min-h-[100px]"
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">{field.label}</label>
            <Select
              value={value}
              onValueChange={(val) => handleFieldChange(fieldName, val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`checkbox-${fieldName}`}
              checked={value}
              onCheckedChange={(checked) => handleFieldChange(fieldName, checked)}
            />
            <label htmlFor={`checkbox-${fieldName}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {field.label}
            </label>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'switch':
        return (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">{field.label}</label>
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
            </div>
            <Switch
              checked={value}
              onCheckedChange={(checked) => handleFieldChange(fieldName, checked)}
            />
          </div>
        );

      case 'url':
        return (
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">{field.label}</label>
            <Input
              type="url"
              placeholder={field.placeholder || `Enter URL`}
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              className="w-full"
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'color':
        return (
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">{field.label}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                className="w-10 h-10 rounded-md cursor-pointer border border-input"
              />
              <Input
                value={value}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                placeholder="#FFFFFF"
                className="flex-1"
              />
            </div>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      default:
        return (
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">{field.label}</label>
            <Input
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              className="w-full"
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );
    }
  };

  if (!selectedBlock) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6 text-muted-foreground select-none">
        <div>
          <p className="mb-2 text-lg font-medium">No Block Selected</p>
          <p className="text-sm">Select a block in the preview to edit its properties</p>
        </div>
      </div>
    );
  }
  
  if (blockLoadError) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6">
        <div className="max-w-md bg-red-50 border-2 border-red-300 rounded-lg p-6 text-red-800">
          <div className="flex items-center mb-3">
            <AlertCircle className="h-6 w-6 mr-2 text-red-600" />
            <h3 className="font-semibold text-lg">Block Properties Error</h3>
          </div>
          <p className="mb-3">Failed to load block properties from UI package:</p>
          <p className="font-mono bg-white/80 p-2 rounded text-sm border border-red-200 mb-2">
            {selectedBlock.folderName}/{selectedBlock.subFolder}
          </p>
          <p className="text-sm mt-2">{blockLoadError}</p>
          <p className="mt-4 text-xs opacity-70">
            Make sure this block exists in the shared UI package at:<br />
            <code>packages/ui/src/blocks/{selectedBlock.folderName}/{selectedBlock.subFolder}/_block.tsx</code>
          </p>
        </div>
      </div>
    );
  }

  if (!blockProperties) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6 text-muted-foreground select-none">
        <div>
          <p className="mb-2 text-lg font-medium">Loading Block Properties</p>
          <p className="text-sm">Please wait...</p>
        </div>
      </div>
    );
  }

  const isLinkedBlock = selectedBlock.value === null && selectedBlock.instance !== null;
  const sourceBlockId = isLinkedBlock ? selectedBlock.instance : selectedBlock.instance_id;

  return (
    <PropertyFormContainer
      leftComponent={
        <div className='truncate'>
          <h3 className="text-md font-semibold">{blockProperties.name}</h3>
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground select-none truncate">{blockProperties.description}</p>
            {isLinkedBlock && (
              <Badge variant="secondary" className="ml-1">
                <Link className="h-3 w-3 mr-1" />
                Linked
              </Badge>
            )}
          </div>
        </div>
      }
      rightComponent={
        <>
          <Select>
            <SelectTrigger className="w-[120px]" size="sm">
              <SelectValue placeholder="Select View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
            </SelectContent>
          </Select>
        </>
      }
    >
      <div className="space-y-6">
        {isLinkedBlock && (
          <div className="bg-secondary/10 p-3 rounded-md border border-secondary mb-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-sm text-secondary-foreground">
                   Edits will update the source block.
                </p>
                <p className="text-xs text-muted-foreground">
                  Source block ID: {sourceBlockId}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleUnlinkBlock}
              >
                <Unlink className="h-4 w-4 mr-1" />
                Unlink
              </Button>
            </div>
          </div>
        )}
      
        {Object.entries(blockProperties.fields).map(([fieldName, field]) => (
          <div key={fieldName} className="space-y-2">
            {renderFieldInput(fieldName, field)}
          </div>
        ))}
        <div className='h-20' />
      </div>
    </PropertyFormContainer>
  );
}