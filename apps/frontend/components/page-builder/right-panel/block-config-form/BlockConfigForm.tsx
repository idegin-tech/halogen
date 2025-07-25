import React, { useEffect, useState } from 'react';
import { useBuilderContext } from '@/context/builder.context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Plus,
  Trash2,
  Link,
  Unlink,
  AlertCircle,
  ListIcon,
  Check,
  ChevronDown,
  Settings,
  X,
  FileText,
  Palette,
  Layout,
  Info
} from 'lucide-react';
import { getBlockProperties } from '@repo/ui/blocks';
import { BlockConfigListValue, BlockFieldConfig, BlockProperties } from '@halogen/common/types';
import { motion } from 'framer-motion';
import { ImageInput } from './ImageInput';

export default function BlockConfigForm() {
  const { state, updateBuilderState } = useBuilderContext();
  const [blockProperties, setBlockProperties] = useState<BlockProperties | null>(null);
  const [blockLoadError, setBlockLoadError] = useState<string | null>(null);
  const selectedBlock = state.blocks.find(block => block.instance_id === state.selectedBlockId);
  const [activeListItem, setActiveListItem] = useState<{ fieldName: string, itemIndex: number } | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const [localFormState, setLocalFormState] = useState<Record<string, any>>({});
  const [localListItemsState, setLocalListItemsState] = useState<Record<string, Record<number, Record<string, any>>>>({});


  const FieldLabel = ({ label, description, htmlFor }: { label: string; description?: string; htmlFor?: string }) => (
    <div className="flex items-center gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      {description && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{description}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
  useEffect(() => {
    const loadBlockProperties = async () => {
      if (!selectedBlock) {
        setBlockProperties(null);
        return;
      }

      try {
        const properties = await getBlockProperties(selectedBlock.folderName, selectedBlock.subFolder);

        if (properties) {
          setBlockProperties(properties);
          setBlockLoadError(null);

          setLocalFormState({});
          setLocalListItemsState({});
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
      const instanceId = block.ref || block.instance;
      const instanceBlock = state.blocks.find(b => b.instance_id === instanceId);
      if (!instanceBlock) return block;

      return findRootBlock(instanceBlock);
    };

    const rootBlock = findRootBlock(selectedBlock);
    return rootBlock.value || {};
  };

  const getFieldValue = (fieldName: string) => {
    if (fieldName in localFormState) {
      return localFormState[fieldName];
    }

    const effectiveValues = getEffectiveValues();
    return effectiveValues[fieldName]?.value;
  };

  const getListItemValue = (fieldName: string, itemIndex: number, itemFieldName: string) => {
    if (
      fieldName in localListItemsState &&
      itemIndex in localListItemsState[fieldName] &&
      itemFieldName in localListItemsState[fieldName][itemIndex]
    ) {
      return localListItemsState[fieldName][itemIndex][itemFieldName];
    }

    const effectiveValues = getEffectiveValues();
    const listValue = effectiveValues[fieldName]?.value || [];
    const itemValue = listValue[itemIndex] || {};
    return itemValue[itemFieldName];
  };
  const updateLocalFieldValue = (fieldName: string, value: any) => {
    console.log(`📝 updateLocalFieldValue - fieldName: ${fieldName}, value: ${value}`);
    setLocalFormState(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const updateLocalListItemValue = (fieldName: string, itemIndex: number, itemFieldName: string, value: any) => {
    setLocalListItemsState(prev => ({
      ...prev,
      [fieldName]: {
        ...(prev[fieldName] || {}),
        [itemIndex]: {
          ...(prev[fieldName]?.[itemIndex] || {}),
          [itemFieldName]: value
        }
      }
    }));
  };

  const commitFieldChange = (fieldName: string) => {
    if (!(fieldName in localFormState)) {
      console.log(`Field ${fieldName} not found in localFormState, unable to commit change`);
      return;
    }

    const valueToCommit = localFormState[fieldName];
    console.log(`Committing field change for ${fieldName} with value:`, valueToCommit);

    handleFieldChange(fieldName, valueToCommit);

    setLocalFormState(prev => {
      const { [fieldName]: _, ...rest } = prev;
      return rest;
    });
  };

  const commitListItemChange = (fieldName: string, itemIndex: number, itemFieldName: string) => {
    if (
      !(fieldName in localListItemsState) ||
      !(itemIndex in localListItemsState[fieldName]) ||
      !(itemFieldName in localListItemsState[fieldName][itemIndex])
    ) return;

    const effectiveValues = getEffectiveValues();
    const currentList = effectiveValues[fieldName]?.value || [];
    const updatedList = [...currentList];

    if (!updatedList[itemIndex]) {
      updatedList[itemIndex] = {};
    }

    updatedList[itemIndex] = {
      ...updatedList[itemIndex],
      [itemFieldName]: localListItemsState[fieldName][itemIndex][itemFieldName]
    };

    handleFieldChange(fieldName, updatedList);

    setLocalListItemsState(prev => {
      const newState = { ...prev };
      delete newState[fieldName][itemIndex][itemFieldName];
      return newState;
    });
  };

  const getSourceBlock = () => {
    if (!selectedBlock) return null;

    const findRootBlock = (block: any): any => {
      if (block.value !== null || block.instance === null) {
        return block;
      }

      const instanceId = block.ref || block.instance;
      const instanceBlock = state.blocks.find(b => b.instance_id === instanceId);
      if (!instanceBlock) return block;

      return findRootBlock(instanceBlock);
    };

    return findRootBlock(selectedBlock);
  };

  const handleUnlinkBlock = () => {
    if (!selectedBlock || !selectedBlock.instance) return;

    const sourceBlock = state.blocks.find(b => b.instance_id === selectedBlock.instance);
    if (!sourceBlock) return;

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

    console.log(`🔄 handleFieldChange: ${fieldName} = ${value}`);

    const sourceBlock = getSourceBlock();
    if (!sourceBlock) return;

    const sourceBlockId = sourceBlock.instance_id;

    const updatedBlocks = state.blocks.map(block => {
      if (block.instance_id === sourceBlockId) {
        const updatedValue = {
          ...(block.value || {}),
          [fieldName]: {
            ...(block.value?.[fieldName] || {}),
            value: value
          }
        };

        console.log(`✅ Updated block ${sourceBlockId} with field ${fieldName}:`, updatedValue);

        return {
          ...block,
          value: updatedValue
        };
      }

      return block;
    });

    updateBuilderState({ blocks: updatedBlocks });
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
    const listItemConfig = listConfig.value as BlockConfigListValue;

    if (!listItemConfig || typeof listItemConfig !== 'object') {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p className="text-sm">Invalid list configuration</p>
        </div>
      );
    }

    const renderFieldSection = (sectionName: string, fields: Record<string, BlockFieldConfig>, icon: React.ReactNode) => {
      if (!fields || typeof fields !== 'object') return null;
      const fieldEntries = Object.entries(fields);
      if (fieldEntries.length === 0) return null;

      return (
        <AccordionItem value={sectionName}>
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              {icon}
              {sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="space-y-3">
              {fieldEntries.map(([itemFieldName, itemField]) => (
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
          </AccordionContent>
        </AccordionItem>
      );
    };

    return (
      <div className="w-full pb-8">
        <div className="flex items-center justify-between mb-1 py-2 px-3 sticky top-0 bg-background z-10">
          <h4 className="font-medium text-lg flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            Edit Item {itemIndex + 1}
          </h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
            onClick={() => removeListItem(fieldName, itemIndex)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>        
        <Separator className="my-2" />

        <Accordion type="multiple" defaultValue={['content', 'theme', 'layout']} className='px-2'>
          {renderFieldSection('content', listItemConfig.contentFields || {}, <FileText className="h-4 w-4" />)}
          {renderFieldSection('theme', listItemConfig.themeFields || {}, <Palette className="h-4 w-4" />)}
          {renderFieldSection('layout', listItemConfig.layoutFields || {}, <Layout className="h-4 w-4" />)}
        </Accordion>
      </div>
    );
  };

  const renderItemFieldInput = (fieldName: string, itemIndex: number, itemFieldName: string, itemField: any, value: any) => {
    switch (itemField.type) {
      case 'text':
        return (
          <div className="grid gap-1.5">
            <label htmlFor={`${fieldName}-${itemIndex}-${itemFieldName}`} className="text-sm font-medium text-muted-foreground">
              {itemField.label}
            </label>
            <Input
              id={`${fieldName}-${itemIndex}-${itemFieldName}`}
              placeholder={itemField.placeholder || `Enter ${itemField.label.toLowerCase()}`}
              value={getListItemValue(fieldName, itemIndex, itemFieldName) ?? (value || itemField.defaultValue || '')}
              onChange={(e) => updateLocalListItemValue(fieldName, itemIndex, itemFieldName, e.target.value)}
              onBlur={() => commitListItemChange(fieldName, itemIndex, itemFieldName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitListItemChange(fieldName, itemIndex, itemFieldName);
                }
              }}
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
            <label htmlFor={`${fieldName}-${itemIndex}-${itemFieldName}`} className="text-sm font-medium text-muted-foreground">
              {itemField.label}
            </label>
            <Textarea
              id={`${fieldName}-${itemIndex}-${itemFieldName}`}
              placeholder={itemField.placeholder || `Enter ${itemField.label.toLowerCase()}`}
              value={getListItemValue(fieldName, itemIndex, itemFieldName) ?? (value || itemField.defaultValue || '')}
              onChange={(e) => updateLocalListItemValue(fieldName, itemIndex, itemFieldName, e.target.value)}
              onBlur={() => commitListItemChange(fieldName, itemIndex, itemFieldName)}
              className="w-full min-h-[80px] resize-none"
            />
            {itemField.description && (
              <p className="text-xs text-muted-foreground">{itemField.description}</p>
            )}
          </div>
        );
      case 'url':
        return (
          <div className="grid gap-1.5">
            <label htmlFor={`${fieldName}-${itemIndex}-${itemFieldName}`} className="text-sm font-medium text-muted-foreground">
              {itemField.label}
            </label>
            <Input
              id={`${fieldName}-${itemIndex}-${itemFieldName}`}
              type="url"
              placeholder={itemField.placeholder || `Enter URL`}
              value={getListItemValue(fieldName, itemIndex, itemFieldName) ?? (value || itemField.defaultValue || '')}
              onChange={(e) => updateLocalListItemValue(fieldName, itemIndex, itemFieldName, e.target.value)}
              onBlur={() => commitListItemChange(fieldName, itemIndex, itemFieldName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitListItemChange(fieldName, itemIndex, itemFieldName);
                }
              }}
              className="w-full"
            />
            {itemField.description && (
              <p className="text-xs text-muted-foreground">{itemField.description}</p>
            )}
          </div>
        );
      case 'image':
        return (
          <div className="grid gap-1.5">
            <label htmlFor={`${fieldName}-${itemIndex}-${itemFieldName}`} className="text-sm font-medium text-muted-foreground">
              {itemField.label}
            </label>
            <ImageInput
              value={getListItemValue(fieldName, itemIndex, itemFieldName) ?? (value || itemField.defaultValue || '')}
              onChange={(value) => updateLocalListItemValue(fieldName, itemIndex, itemFieldName, value)}
              onBlur={() => commitListItemChange(fieldName, itemIndex, itemFieldName)}
              placeholder={itemField.placeholder || `Enter image URL or select from project`}
              description={itemField.description} />          </div>);

      case 'single_toggle':
        return (
          <div className="grid gap-1.5">
            <label htmlFor={`${fieldName}-${itemIndex}-${itemFieldName}`} className="text-sm font-medium text-muted-foreground">
              {itemField.label}
            </label>            <ToggleGroup
              type="single"
              value={getListItemValue(fieldName, itemIndex, itemFieldName) ?? (value || itemField.defaultValue)}
              onValueChange={(val: string) => {
                updateLocalListItemValue(fieldName, itemIndex, itemFieldName, val);
                commitListItemChange(fieldName, itemIndex, itemFieldName);
              }}
              className="justify-start"
            >
              {itemField.options?.map((option: any) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {itemField.description && (
              <p className="text-xs text-muted-foreground">{itemField.description}</p>
            )}
          </div>
        ); case 'multi_toggle':
        return (
          <div className="grid gap-1.5">
            <label htmlFor={`${fieldName}-${itemIndex}-${itemFieldName}`} className="text-sm font-medium text-muted-foreground">
              {itemField.label}
            </label>            <ToggleGroup
              type="multiple"
              variant="outline"
              size="sm"
              value={getListItemValue(fieldName, itemIndex, itemFieldName) ?? (value || itemField.defaultValue || [])}
              onValueChange={(val: string[]) => {
                updateLocalListItemValue(fieldName, itemIndex, itemFieldName, val);
                commitListItemChange(fieldName, itemIndex, itemFieldName);
              }}
              className="justify-start gap-1 w-full"
            >
              {itemField.options?.map((option: any) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  className="flex-1 min-w-0 px-3 py-2 text-xs font-medium transition-all duration-200 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm hover:bg-muted/50 border-muted-foreground/20 data-[state=on]:border-primary"
                >
                  <span className="truncate">{option.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {itemField.description && (
              <p className="text-xs text-muted-foreground">{itemField.description}</p>
            )}
          </div>
        ); default:
        return (
          <div className="grid gap-1.5">
            <FieldLabel
              label={itemField.label}
              description={itemField.description}
              htmlFor={`${fieldName}-${itemIndex}-${itemFieldName}`}
            />
            <Input
              id={`${fieldName}-${itemIndex}-${itemFieldName}`}
              placeholder={itemField.placeholder || `Enter ${itemField.label.toLowerCase()}`}
              value={getListItemValue(fieldName, itemIndex, itemFieldName) ?? (value || itemField.defaultValue || '')}
              onChange={(e) => updateLocalListItemValue(fieldName, itemIndex, itemFieldName, e.target.value)}
              onBlur={() => commitListItemChange(fieldName, itemIndex, itemFieldName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitListItemChange(fieldName, itemIndex, itemFieldName);
                }
              }}
              className="w-full"
            />
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

      if (!listConfig || typeof listConfig !== 'object') {
        return (
          <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-muted">
            <div className="flex items-center gap-2">
              <ListIcon className="h-5 w-5 text-destructive" />
              <div>
                <label className="text-sm font-medium text-destructive">{field.label}</label>
                <p className="text-xs text-destructive">Invalid list configuration - missing structure</p>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-muted">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-2">
              <ListIcon className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">{field.label}</label>
                {field.description && (
                  <span className="text-xs text-muted-foreground block mt-0.5">{field.description}</span>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => addListItem(fieldName)}
              className="h-8 border-primary/20 hover:border-primary hover:bg-primary/10 text-primary hover:text-primary"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>

          {listItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-lg border-muted bg-background text-center">
              <ListIcon className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-muted-foreground mb-3">No items added yet</p>
              <Button
                variant="default"
                size="sm"
                className="mt-1"
                onClick={() => addListItem(fieldName)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add First Item
              </Button>
            </div>
          ) : (<div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {listItems.map((item: any, index: number) => {
              const nameField = Object.keys(listConfig.contentFields || {}).find(
                (key: string) => key === 'name'
              ) || Object.keys(listConfig.contentFields || {}).find(
                (key: string) => {
                  const itemConfig = listConfig.contentFields[key];
                  return itemConfig?.name === 'name';
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
                      className={`cursor-pointer px-0 py-2 transition-all duration-200 ${isActive
                        ? 'border-primary shadow-sm shadow-primary/20'
                        : 'hover:border-primary/50 hover:shadow-sm'
                        }`}
                    >
                      <CardContent className="px-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                            {index + 1}
                          </div>
                          <p className="font-medium">{displayName}</p>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isActive ? 'rotate-180' : ''}`} />
                      </CardContent>
                    </Card>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[23rem] mt-16 p-0 shadow-lg mr-5 max-h-[80vh] overflow-y-auto"
                    align="end"
                    sideOffset={40}
                    alignOffset={-40}
                  >
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
            <FieldLabel label={field.label} description={field.description} />
            <Input
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              value={getFieldValue(fieldName) ?? value}
              onChange={(e) => updateLocalFieldValue(fieldName, e.target.value)}
              onBlur={() => commitFieldChange(fieldName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitFieldChange(fieldName);
                }
              }}
              className="w-full"
            />
          </div>
        );
      case 'textarea':
        return (
          <div className="grid gap-1.5">
            <FieldLabel label={field.label} description={field.description} />
            <Textarea
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              value={getFieldValue(fieldName) ?? value}
              onChange={(e) => updateLocalFieldValue(fieldName, e.target.value)}
              onBlur={() => commitFieldChange(fieldName)}
              className="w-full min-h-[100px] resize-none"
            />
          </div>
        );
      case 'select':
        return (
          <div className="grid gap-1.5">
            <FieldLabel label={field.label} description={field.description} />
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
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-start space-x-3 bg-muted/30 hover:bg-muted/50 p-3 rounded-lg transition-colors border border-border">
            <div className="pt-0.5">
              <Checkbox
                id={`checkbox-${fieldName}`}
                checked={value}
                onCheckedChange={(checked) => handleFieldChange(fieldName, checked)}
                className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor={`checkbox-${fieldName}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {field.label}
                </label>
                {field.description && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{field.description}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        );
      case 'switch':
        return (
          <div className="flex items-center justify-between bg-muted/30 hover:bg-muted/50 p-3 rounded-lg transition-colors border border-border">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">{field.label}</label>
                {field.description && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{field.description}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            <div className="relative flex items-center">
              {value && (
                <span className="absolute right-10 font-medium text-xs text-primary">
                  ON
                </span>
              )}
              <Switch
                checked={value}
                onCheckedChange={(checked) => handleFieldChange(fieldName, checked)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        );
      case 'single_toggle':
        return (
          <div className="grid gap-1.5">
            <FieldLabel label={field.label} description={field.description} />
            <ToggleGroup
              type="single"
              value={value || field.defaultValue}
              onValueChange={(val: string) => handleFieldChange(fieldName, val)}
              className="justify-start"
            >
              {field.options?.map((option: any) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        ); case 'multi_toggle':
        return (
          <div className="grid gap-1.5">
            <FieldLabel label={field.label} description={field.description} />
            <ToggleGroup
              type="multiple"
              variant="outline"
              size="sm"
              value={value || field.defaultValue || []}
              onValueChange={(val: string[]) => handleFieldChange(fieldName, val)}
              className="justify-start gap-1 w-full"
            >
              {field.options?.map((option: any) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  className="flex-1 min-w-0 px-3 py-2 text-xs font-medium transition-all duration-200 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm hover:bg-muted/50 border-muted-foreground/20 data-[state=on]:border-primary"
                >
                  <span className="truncate">{option.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        );
      case 'url':
        return (
          <div className="grid gap-1.5">
            <FieldLabel label={field.label} description={field.description} />
            <Input
              type="url"
              placeholder={field.placeholder || `Enter URL`}
              value={getFieldValue(fieldName) ?? value}
              onChange={(e) => updateLocalFieldValue(fieldName, e.target.value)}
              onBlur={() => commitFieldChange(fieldName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitFieldChange(fieldName);
                }
              }}
              className="w-full"
            />
          </div>
        ); case 'image':
        return (
          <ImageInput
            label={field.label}
            placeholder={field.placeholder || `Enter image URL or select from project`}
            value={getFieldValue(fieldName) ?? value}
            onChange={(value) => updateLocalFieldValue(fieldName, value)}
            onBlur={() => commitFieldChange(fieldName)}
            description={field.description}
            fieldName={fieldName}
          />
        );
      case 'color':
        return (
          <div className="grid gap-1.5">
            <FieldLabel label={field.label} description={field.description} />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={getFieldValue(fieldName) ?? value}
                onChange={(e) => {
                  updateLocalFieldValue(fieldName, e.target.value);
                  commitFieldChange(fieldName); // Immediate update for color picker
                }}
                className="w-10 h-10 rounded-md cursor-pointer border border-input"
              />
              <Input
                value={getFieldValue(fieldName) ?? value}
                onChange={(e) => updateLocalFieldValue(fieldName, e.target.value)}
                onBlur={() => commitFieldChange(fieldName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitFieldChange(fieldName);
                  }
                }}
                placeholder="#FFFFFF"
                className="flex-1"
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="grid gap-1.5">
            <FieldLabel label={field.label} description={field.description} />
            <Input
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              value={getFieldValue(fieldName) ?? value}
              onChange={(e) => updateLocalFieldValue(fieldName, e.target.value)}
              onBlur={() => commitFieldChange(fieldName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitFieldChange(fieldName);
                }
              }}
              className="w-full"
            />
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

  const isLinkedBlock = selectedBlock.value === null && selectedBlock.instance !== null; return (
    <>
      <div className="space-y-6 pb-8">
        {isLinkedBlock && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary/5 p-3 rounded-lg border border-secondary/20 mb-4"
          >
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link className="h-4 w-4 text-secondary" />
                  <p className="text-sm font-medium text-secondary">Linked Block</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Edits will update the source block
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-secondary/20 hover:border-secondary/40 hover:bg-secondary/10 text-secondary"
                onClick={handleUnlinkBlock}
              >
                <Unlink className="h-4 w-4 mr-1.5" />
                Unlink
              </Button>
            </div>
          </motion.div>
        )}

        {blockProperties.fields ? (
          <div className="space-y-4">
            {Object.entries(blockProperties.fields).map(([fieldName, field]) => (
              <motion.div
                key={fieldName}
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {renderFieldInput(fieldName, field)}
              </motion.div>
            ))}
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={['content', 'theme', 'layout']}>
            {Object.keys(blockProperties.contentFields || {}).length > 0 && (
              <AccordionItem value="content">
                <AccordionTrigger className="text-md font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Content
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-4">
                    {Object.entries(blockProperties.contentFields || {}).map(([fieldName, field]) => (
                      <motion.div
                        key={fieldName}
                        className="space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {renderFieldInput(fieldName, field)}
                      </motion.div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {Object.keys(blockProperties.themeFields || {}).length > 0 && (
              <AccordionItem value="theme">
                <AccordionTrigger className="text-md font-medium">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Theme
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-4">
                    {Object.entries(blockProperties.themeFields || {}).map(([fieldName, field]) => (
                      <motion.div
                        key={fieldName}
                        className="space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {renderFieldInput(fieldName, field)}
                      </motion.div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {Object.keys(blockProperties.layoutFields || {}).length > 0 && (
              <AccordionItem value="layout">
                <AccordionTrigger className="text-md font-medium">
                  <div className="flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    Layout
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-4">
                    {Object.entries(blockProperties.layoutFields || {}).map(([fieldName, field]) => (
                      <motion.div
                        key={fieldName}
                        className="space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {renderFieldInput(fieldName, field)}
                      </motion.div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </div>
    </>
  );
}