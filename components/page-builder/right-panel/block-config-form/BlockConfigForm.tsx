'use client';
import React, { useEffect, useState } from 'react';
import { useBuilderContext } from '@/context/builder.context';
import PropertyFormContainer from './PropertyFormContainer';
import { Button, Input, Textarea, Select, SelectItem, Switch, Checkbox, Divider, Popover, PopoverContent, PopoverTrigger, Card, CardBody, Badge } from '@heroui/react';
import { BlockConfigListValue, BlockFieldConfig, BlockProperties } from '@/types/block.types';
import { PlusIcon, TrashIcon, LinkIcon, UnlinkIcon } from 'lucide-react';

export default function BlockConfigForm() {
  const { state, updateBuilderState } = useBuilderContext();
  const [blockProperties, setBlockProperties] = useState<BlockProperties | null>(null);
  const selectedBlock = state.blocks.find(block => block.id === state.selectedBlockId);
  const [activeListItem, setActiveListItem] = useState<{ fieldName: string, itemIndex: number } | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  useEffect(() => {
    const loadBlockProperties = async () => {
      if (!selectedBlock) {
        setBlockProperties(null);
        return;
      }

      try {
        const componentPath = `@/blocks/${selectedBlock.folderName}/${selectedBlock.subFolder}/_block`;
        const module = await import(componentPath);
        const properties: BlockProperties = module.properties;

        if (properties) {
          setBlockProperties(properties);
        }
      } catch (err) {
        console.error('Error loading block properties:', err);
      }
    };

    loadBlockProperties();
  }, [selectedBlock]);

  const getEffectiveValues = () => {
    if (!selectedBlock) return {};
    
    // Find the root block by following the instance chain
    const findRootBlock = (block: any): any => {
      if (block.value !== null || block.instance === null) {
        return block;
      }
      // Find the referenced block by ID
      const instanceBlock = state.blocks.find(b => b.id === block.instance);
      if (!instanceBlock) return block;
      
      return findRootBlock(instanceBlock);
    };
    
    const rootBlock = findRootBlock(selectedBlock);
    return rootBlock.value || {};
  };

  const getSourceBlock = () => {
    if (!selectedBlock) return null;
    
    // Find the root block by following the instance chain
    const findRootBlock = (block: any): any => {
      if (block.value !== null || block.instance === null) {
        return block;
      }
      // Find the referenced block by ID
      const instanceBlock = state.blocks.find(b => b.id === block.instance);
      if (!instanceBlock) return block;
      
      return findRootBlock(instanceBlock);
    };
    
    return findRootBlock(selectedBlock);
  };

  const handleUnlinkBlock = () => {
    if (!selectedBlock || !selectedBlock.instance) return;

    // Find the source block by ID
    const sourceBlock = state.blocks.find(b => b.id === selectedBlock.instance);
    if (!sourceBlock) return;
    
    // Copy its values
    const instanceValues = JSON.parse(JSON.stringify(sourceBlock.value));
    
    const updatedBlocks = state.blocks.map(block => {
      if (block.id === selectedBlock.id) {
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
      if (block.id === sourceBlock.id) {
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
            color="danger"
            size="sm"
            variant="light"
            startContent={<TrashIcon className="h-4 w-4" />}
            onClick={() => removeListItem(fieldName, itemIndex)}
          >
            Remove
          </Button>
        </div>
        <Divider />
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
          <Input
            label={itemField.label}
            placeholder={itemField.placeholder || `Enter ${itemField.label.toLowerCase()}`}
            value={value || itemField.defaultValue || ''}
            onChange={(e) => handleListItemChange(fieldName, itemIndex, itemFieldName, e.target.value)}
            description={itemField.description}
            variant="bordered"
            fullWidth
          />
        );

      case 'textarea':
        return (
          <Textarea
            label={itemField.label}
            placeholder={itemField.placeholder || `Enter ${itemField.label.toLowerCase()}`}
            value={value || itemField.defaultValue || ''}
            onChange={(e) => handleListItemChange(fieldName, itemIndex, itemFieldName, e.target.value)}
            description={itemField.description}
            variant="bordered"
            fullWidth
            minRows={3}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            label={itemField.label}
            placeholder={itemField.placeholder || `Enter URL`}
            value={value || itemField.defaultValue || ''}
            onChange={(e) => handleListItemChange(fieldName, itemIndex, itemFieldName, e.target.value)}
            description={itemField.description}
            variant="bordered"
            fullWidth
          />
        );

      default:
        return (
          <Input
            label={itemField.label}
            placeholder={itemField.placeholder || `Enter ${itemField.label.toLowerCase()}`}
            value={value || itemField.defaultValue || ''}
            onChange={(e) => handleListItemChange(fieldName, itemIndex, itemFieldName, e.target.value)}
            description={itemField.description}
            variant="bordered"
            fullWidth
          />
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
                <span className="text-xs text-gray-500 block">{field.description}</span>
              )}
            </div>
            <Button
              color="primary"
              size="sm"
              variant="light"
              startContent={<PlusIcon className="h-4 w-4" />}
              onClick={() => addListItem(fieldName)}
            >
              Add Item
            </Button>
          </div>

          {listItems.length === 0 ? (
            <div className="text-center p-4 border border-dashed rounded-lg border-gray-300 bg-gray-50">
              <p className="text-sm text-gray-500">No items added yet</p>
              <Button
                color="primary"
                size="sm"
                variant="flat"
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
                    placement="right"
                    isOpen={isActive && isPopoverOpen}
                    onOpenChange={(open) => {
                      if (open) {
                        setActiveListItem({ fieldName, itemIndex: index });
                        setIsPopoverOpen(true);
                      } else {
                        setIsPopoverOpen(false);
                      }
                    }}
                    backdrop="transparent"
                    showArrow={true}
                    offset={12}
                  >
                    <PopoverTrigger>
                      <Card
                        className={`cursor-pointer hover:border-primary transition-colors ${isActive ? 'border-primary' : ''}`}
                        isPressable
                      >
                        <CardBody className="p-3">
                          <p className="font-medium">{displayName}</p>
                        </CardBody>
                      </Card>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
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
          <Input
            label={field.label}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            description={field.description}
            variant="bordered"
            fullWidth
          />
        );

      case 'textarea':
        return (
          <Textarea
            label={field.label}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            description={field.description}
            variant="bordered"
            fullWidth
            minRows={3}
          />
        );

      case 'select':
        return (
          <Select
            label={field.label}
            placeholder={`Select ${field.label.toLowerCase()}`}
            selectedKeys={[value]}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            description={field.description}
            variant="bordered"
            fullWidth
          >
            {field.options?.map((option: any) => (
              <SelectItem key={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        );

      case 'checkbox':
        return (
          <Checkbox
            checked={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
          >
            {field.label}
            {field.description && (
              <span className="text-xs text-gray-500 block">{field.description}</span>
            )}
          </Checkbox>
        );

      case 'switch':
        return (
          <div className="flex items-center justify-between">
            <div>
              <span>{field.label}</span>
              {field.description && (
                <span className="text-xs text-gray-500 block">{field.description}</span>
              )}
            </div>
            <Switch
              checked={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
            />
          </div>
        );

      case 'url':
        return (
          <Input
            type="url"
            label={field.label}
            placeholder={field.placeholder || `Enter URL`}
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            description={field.description}
            variant="bordered"
            fullWidth
          />
        );

      case 'color':
        return (
          <div className="space-y-1">
            <label className="text-sm font-medium">{field.label}</label>
            {field.description && (
              <span className="text-xs text-gray-500 block">{field.description}</span>
            )}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                className="w-10 h-10 rounded-md cursor-pointer"
              />
              <Input
                value={value}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                placeholder="#FFFFFF"
                className="flex-1"
                variant="bordered"
              />
            </div>
          </div>
        );

      default:
        return (
          <Input
            label={field.label}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            description={field.description}
            variant="bordered"
            fullWidth
          />
        );
    }
  };

  if (!selectedBlock || !blockProperties) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6 text-content4 select-none">
        <div>
          <p className="mb-2 text-lg font-medium">No Block Selected</p>
          <p className="text-sm">Select a block in the preview to edit its properties</p>
        </div>
      </div>
    );
  }

  const isLinkedBlock = selectedBlock.value === null && selectedBlock.instance !== null;
  const sourceBlockId = isLinkedBlock ? selectedBlock.instance : selectedBlock.id;

  return (
    <PropertyFormContainer
      leftComponent={
        <div className='truncate'>
          <h3 className="text-md font-semibold">{blockProperties.name}</h3>
          <div className="flex items-center gap-1">
            <p className="text-xs text-content4 select-none truncate">{blockProperties.description}</p>
            {isLinkedBlock && (
              <Badge color="secondary" variant="flat" size="sm" className="ml-1">
                <LinkIcon className="h-3 w-3 mr-1" />
                Linked
              </Badge>
            )}
          </div>
        </div>
      }
      rightComponent={
        <>
          <Select
            size='sm'
            items={[]}
            placeholder="Select View"
          >
            <SelectItem>Content</SelectItem>
            <SelectItem>Outline</SelectItem>
          </Select>
        </>
      }
    >
      <div className="space-y-6">
        {isLinkedBlock && (
          <div className="bg-secondary-50 p-3 rounded-md border border-secondary-200 mb-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-sm text-secondary-700">
                  <strong>This is a linked block.</strong> Edits will update the source block.
                </p>
                <p className="text-xs text-secondary-600">
                  Source block ID: {sourceBlockId?.substring(0, 8)}
                </p>
              </div>
              <Button
                size="sm"
                color="secondary"
                variant="flat"
                startContent={<UnlinkIcon className="h-4 w-4" />}
                onClick={handleUnlinkBlock}
              >
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