'use client';
import React, { useEffect, useState } from 'react';
import { useBuilderContext } from '@/context/builder.context';
import PropertyFormContainer from './PropertyFormContainer';
import { Button, Input, Textarea, Select, SelectItem, Switch, Checkbox, Divider } from '@heroui/react';
import { BlockProperties } from '@/types/block.types';

export default function BlockConfigForm() {
  const { state, updateBuilderState } = useBuilderContext();
  const [blockProperties, setBlockProperties] = useState<BlockProperties | null>(null);
  const selectedBlock = state.blocks.find(block => block.id === state.selectedBlockId);

  useEffect(() => {
    const loadBlockProperties = async () => {
      if (!selectedBlock) {
        setBlockProperties(null);
        return;
      }

      try {
        const componentPath = `@/blocks/${selectedBlock.folderName}/${selectedBlock.fileName.replace('.tsx', '')}`;
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

  const handleFieldChange = (fieldName: string, value: any) => {
    if (!selectedBlock) return;

    const updatedBlocks = state.blocks.map(block => {
      if (block.id === selectedBlock.id) {
        return {
          ...block,
          value: {
            ...block.value,
            [fieldName]: {
              ...block.value[fieldName],
              value: value
            }
          }
        };
      }
      return block;
    });

    updateBuilderState({ blocks: updatedBlocks });
  };

  const renderFieldInput = (fieldName: string, field: any) => {
    const value = selectedBlock?.value[fieldName]?.value ?? field.defaultValue;

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
      <div className="h-full flex items-center justify-center text-center p-6 text-gray-500">
        <div>
          <p className="mb-2 text-lg font-medium">No Block Selected</p>
          <p className="text-sm">Select a block in the preview to edit its properties</p>
        </div>
      </div>
    );
  }

  return (
    <PropertyFormContainer
      leftComponent={
        <div>
          <h3 className="text-md font-semibold">{blockProperties.name}</h3>
          <p className="text-xs text-gray-500">{blockProperties.description}</p>
        </div>
      }
    >
      <div className="space-y-6">
        {Object.entries(blockProperties.fields).map(([fieldName, field]) => (
          <div key={fieldName} className="space-y-2">
            {renderFieldInput(fieldName, field)}
          </div>
        ))}
      </div>
    </PropertyFormContainer>
  );
}