import React, { useState } from 'react'
import { Variable, VariableSet } from '@halogen/common/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@/components/ui/popover'
import ColorPicker from 'react-pick-color'

interface ThemeColorSectionProps {
  colorVariables: Variable[];
  variableSetName: string;
  setVariableSetName: (name: string) => void;
  handleVariableChange: (variableId: string, value: string) => void;
  validation: {
    invalid: boolean;
    message: string;
  };
  handleSubmit: (e: React.FormEvent) => void;
}

export default function ThemeColorSection({
  colorVariables,
  variableSetName,
  setVariableSetName,
  handleVariableChange,
  validation,
  handleSubmit
}: ThemeColorSectionProps) {
  const [colorPickerVisible, setColorPickerVisible] = useState<{[key: string]: boolean}>({});

  const toggleColorPicker = (variableId: string) => {
    setColorPickerVisible(prev => {
      const newState = { ...prev };
      // Close all other color pickers
      Object.keys(newState).forEach(key => {
        newState[key] = key === variableId ? !newState[key] : false;
      });
      return newState;
    });
  };

  const handleColorChange = (color: { hex: string }, variableId: string) => {
    handleVariableChange(variableId, color.hex);
    // Keep color picker open until user explicitly closes it
  };

  if (!colorVariables.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>No color variables found in this theme set.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Color Variables</h3>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="space-y-2">
          <div className="grid gap-1.5">
            <label htmlFor="variable-set-name" className="text-sm font-medium">Theme Set Name</label>
            <Input
              id="variable-set-name"
              placeholder="Enter theme set name"
              value={variableSetName}
              onChange={(e) => setVariableSetName(e.target.value)}
              className={`w-full ${validation.invalid && variableSetName.trim() ? 'border-destructive ring-destructive' : ''}`}
            />
            {validation.invalid && variableSetName.trim() && (
              <p className="text-xs text-destructive">{validation.message}</p>
            )}
          </div>
          <Button 
            variant="default"
            type="submit"
            className="w-full mt-2"
            disabled={validation.invalid}
          >
            Save Theme Name
          </Button>
        </div>
      </form>
      <div className="grid grid-cols-1 gap-4 mt-4">
        {colorVariables.map(variable => (
          <div key={variable.variable_id} className="flex items-center gap-2 p-2 border rounded-md hover:border-primary transition-colors">
            <div 
              className="h-10 w-10 rounded-md border border-border flex-shrink-0 cursor-pointer"
              style={{ backgroundColor: variable.primaryValue }}
              onClick={() => toggleColorPicker(variable.variable_id)}
            />
            <div className="flex-1">
              <p className="font-medium">{variable.name}</p>
              <p className="text-xs text-muted-foreground">{variable.primaryValue}</p>
            </div>
            <Popover open={colorPickerVisible[variable.variable_id]} onOpenChange={() => toggleColorPicker(variable.variable_id)}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">Edit Color</Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-2">
                  <ColorPicker 
                    color={variable.primaryValue} 
                    onChange={(color) => handleColorChange(color, variable.variable_id)}
                  />
                  <div className="mt-2 flex justify-between">
                    <p className="text-sm">Selected: {variable.primaryValue}</p>
                    <Button 
                      size="sm" 
                      variant="default" 
                      onClick={() => toggleColorPicker(variable.variable_id)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        ))}
      </div>
    </div>
  )
}
