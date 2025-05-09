import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { BrushIcon, PaletteIcon, CircleIcon } from 'lucide-react'
import { 
  Input 
} from '@/components/ui/input'
import {
  Button
} from '@/components/ui/button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent 
} from '@/components/ui/popover'
import { useBuilderContext } from '@/context/builder.context'
import { Variable, VariableSet } from '@halogen/common/types'
import ColorPicker from 'react-pick-color'
import TopPanelContainer from './TopPanelContainer'

// Define a frontend extension of the VariableSet type for local use
interface ExtendedVariableSet extends VariableSet {
  isLocked?: boolean;
}

// Move utility functions outside the component to avoid recreation on each render
const hslToHex = (hslString: string): string => {
  if (!hslString || typeof hslString !== 'string') return '#000000';
  
  // If the value is already hex, return it
  if (hslString.startsWith('#')) {
      return hslString;
  }
  
  try {
      const parts = hslString.trim().split(' ');
      if (parts.length !== 3) return '#000000';
      
      const h = parseInt(parts[0]);
      const s = parseInt(parts[1]) / 100;
      const l = parseInt(parts[2]) / 100;
      
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = l - c / 2;
      
      let r = 0, g = 0, b = 0;
      if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
      else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
      else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
      else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
      else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
      else { r = c; g = 0; b = x; }
      
      r = Math.round((r + m) * 255);
      g = Math.round((g + m) * 255);
      b = Math.round((b + m) * 255);
      
      const toHex = (c: number) => {
          const hex = c.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
      };
      
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch (error) {
      console.error('Error converting HSL to hex:', error);
      return '#000000';
  }
};

const hexToHsl = (hex: string): string => {
  // If the hex value is already stored, return it
  if (hex.startsWith('#')) {
      return hex;
  }
  
  try {
      hex = hex.replace(/^#/, '');
      
      let r = 0, g = 0, b = 0;
      if (hex.length === 3) {
          r = parseInt(hex[0] + hex[0], 16);
          g = parseInt(hex[1] + hex[1], 16);
          b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) {
          r = parseInt(hex.substring(0, 2), 16);
          g = parseInt(hex.substring(2, 4), 16);
          b = parseInt(hex.substring(4, 6), 16);
      }
      
      r /= 255;
      g /= 255;
      b /= 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      
      if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          
          if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
          else if (max === g) h = (b - r) / d + 2;
          else if (max === b) h = (r - g) / d + 4;
          
          h *= 60;
      }
      
      return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch (error) {
      console.error('Error converting hex to HSL:', error);
      return '0 0% 0%';
  }
};

export default function ThemeTopPanel({show, onHide}:{show: boolean, onHide: () => void}) {
    const { state, updateBuilderState } = useBuilderContext();
    
    const [selectedVariableSetId, setSelectedVariableSetId] = useState<string | null>('set_colors');
    const [variableSetName, setVariableSetName] = useState('');
    const [colorPickerVisible, setColorPickerVisible] = useState<{[key: string]: boolean}>({});
    
    const variablesBySet = useMemo(() => {
        const groups: Record<string, Variable[]> = {};
        
        state.variables.forEach(variable => {
            const setId = typeof variable.variableSet === 'string' 
                ? variable.variableSet 
                : variable.variableSet.set_id;
            
            if (!groups[setId]) {
                groups[setId] = [];
            }
            
            groups[setId].push(variable);
        });
        
        return groups;
    }, [state.variables]);
    
    const currentVariableSet = useMemo(() => {
        return state.variableSets.find(set => set.set_id === selectedVariableSetId) || null;
    }, [selectedVariableSetId, state.variableSets]);
    
    const currentVariables = useMemo(() => {
        if (!selectedVariableSetId) return [];
        
        return variablesBySet[selectedVariableSetId] || [];
    }, [selectedVariableSetId, variablesBySet]);

    useEffect(() => {
        if (currentVariableSet) {
            setVariableSetName(currentVariableSet.name);
        }
    }, [currentVariableSet]);

    const handleVariableChange = useCallback((variableId: string, value: string) => {
        const updatedVariables = state.variables.map(variable => {
            if (variable.variable_id === variableId) {
                return {
                    ...variable,
                    primaryValue: value,
                    secondaryValue: value // Keep secondaryValue in sync with primaryValue for compatibility
                };
            }
            return variable;
        });
        
        updateBuilderState({ variables: updatedVariables });
    }, [state.variables, updateBuilderState]);
    
    const handleColorChange = useCallback((color: { hex: string }, variableId: string) => {
        handleVariableChange(variableId, color.hex);
        // Keep color picker open until user explicitly closes it
    }, [handleVariableChange]);
    
    const toggleColorPicker = useCallback((variableId: string) => {
        setColorPickerVisible(prev => {
            const newState = { ...prev };
            // Close all other color pickers
            Object.keys(newState).forEach(key => {
                newState[key] = key === variableId ? !newState[key] : false;
            });
            return newState;
        });
    }, []);
    
    const validation = useMemo(() => {
        if (!variableSetName.trim()) return { invalid: true, message: 'Variable set name is required' };
        
        const duplicateName = state.variableSets.find(set => 
            set.name.toLowerCase() === variableSetName.toLowerCase() && 
            set.set_id !== selectedVariableSetId
        );
        
        return { invalid: !!duplicateName, message: duplicateName ? 'Set name already exists' : '' };
    }, [variableSetName, state.variableSets, selectedVariableSetId]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedVariableSetId && !validation.invalid) {
            const updatedVariableSets = state.variableSets.map(set => 
                set.set_id === selectedVariableSetId 
                    ? { ...set, name: variableSetName } 
                    : set
            );
            
            updateBuilderState({ variableSets: updatedVariableSets });
        }
    };
    
    const handleAddVariableSet = (name?: string) => {
        const setName = name || 'New Theme';
        const newSetId = `set_${Date.now()}`;
        
        const newVariableSet: ExtendedVariableSet = {
            set_id: newSetId,
            name: setName,
            key: setName.toLowerCase().replace(/\s+/g, '-'),
        };
        
        const currentSetType = currentVariableSet?.key === 'radius' ? 'radius' : 'colors';
        const templateSetId = currentSetType === 'radius' ? 'set_radius' : 'set_colors';
        
        const templateVariables = state.variables.filter(v => {
            const setId = typeof v.variableSet === 'string' ? v.variableSet : v.variableSet.set_id;
            return setId === templateSetId;
        });
        
        const newVariables = templateVariables.map(variable => {
            let primaryValue = variable.primaryValue;
            if (variable.type === 'color' && !variable.primaryValue.startsWith('#')) {
                primaryValue = hslToHex(variable.primaryValue);
            }
            
            return {
                ...variable,
                variable_id: `${variable.variable_id}_${Date.now()}`,
                primaryValue,
                secondaryValue: primaryValue, // Keep them in sync
                variableSet: newSetId
            };
        });
        
        updateBuilderState({ 
            variableSets: [...state.variableSets, newVariableSet],
            variables: [...state.variables, ...newVariables]
        });
        
        return newSetId;
    };
    
    const handleRemoveVariableSet = (id: string) => {
        if (id === 'set_colors' || id === 'set_radius') return;
        
        const updatedVariableSets = state.variableSets.filter(set => set.set_id !== id);
        const updatedVariables = state.variables.filter(variable => {
            const variableSetId = typeof variable.variableSet === 'string' 
                ? variable.variableSet 
                : variable.variableSet.set_id;
            return variableSetId !== id;
        });
        
        updateBuilderState({ 
            variableSets: updatedVariableSets,
            variables: updatedVariables 
        });
        
        if (selectedVariableSetId === id) {
            setSelectedVariableSetId('set_colors');
        }
    };
    
    const handleSetChange = (data: any) => {
        console.log('Set change:', data);
    };
    
    const mappedVariableSets = useMemo(() => {
        const objectSets = state.variableSets.map(set => ({
            id: set.set_id, // Map set_id to id for the TopPanelContainer
            name: set.name,
            icon: set.key === 'radius' ? <CircleIcon /> : <PaletteIcon />,
            isLocked: set.set_id === 'set_colors' || set.set_id === 'set_radius'
        }));
        
        return objectSets;
    }, [state.variableSets]);
    
    const hasColorVariables = useMemo(() => {
        return currentVariables.some(v => v.type === 'color');
    }, [currentVariables]);
    
    const hasSizeVariables = useMemo(() => {
        return currentVariables.some(v => v.type === 'size');
    }, [currentVariables]);
    
    const colorVariables = useMemo(() => {
        return currentVariables
            .filter(v => v.type === 'color')
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [currentVariables]);
    
    // Convert all existing color variables to hex on component mount
    useEffect(() => {
        if (hasColorVariables) {
            const needsUpdate = state.variables.some(
                variable => variable.type === 'color' && !variable.primaryValue.startsWith('#')
            );
            
            if (needsUpdate) {
                const updatedVariables = state.variables.map(variable => {
                    if (variable.type === 'color' && !variable.primaryValue.startsWith('#')) {
                        const hexValue = hslToHex(variable.primaryValue);
                        return {
                            ...variable,
                            primaryValue: hexValue,
                            secondaryValue: hexValue // Keep them in sync
                        };
                    }
                    return variable;
                });
                
                updateBuilderState({ variables: updatedVariables });
            }
        }
    }, [selectedVariableSetId, hasColorVariables, state.variables]); // Remove updateBuilderState and hslToHex from dependencies
    
    // Generate breadcrumbs based on the selected set
    const breadcrumbs = useMemo(() => {
        const items: {label: string, href?: string}[] = [
            { label: "Theme", href: "#" }
        ];
        
        if (selectedVariableSetId) {
            const variableSet = state.variableSets.find(set => set.set_id === selectedVariableSetId);
            if (variableSet) {
                items.push({ label: variableSet.name });
            }
        }
        
        return items;
    }, [selectedVariableSetId, state.variableSets]);

    // Render color pickers for the selected variable set
    const renderColorVariablesInterface = () => {
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
        );
    };

    return (
        <TopPanelContainer
            heading="Theme"
            onClose={onHide}
            show={show}
            setList={mappedVariableSets}
            activeSetId={selectedVariableSetId}
            onAddSet={handleAddVariableSet}
            onRemoveSet={handleRemoveVariableSet}
            onSetActiveSet={setSelectedVariableSetId}
            onSetChange={handleSetChange}
            subPageHeading={selectedVariableSetId ? 
                state.variableSets.find(set => set.set_id === selectedVariableSetId)?.name :
                "Select a theme set"}
            breadcrumbs={breadcrumbs}
        >
            <div className='flex-1 overflow-x-hidden overflow-y-auto'>
                {selectedVariableSetId ? (
                    <div className="p-4">
                        {renderColorVariablesInterface()}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                        <BrushIcon className="h-12 w-12 mb-4 opacity-50" />
                        <p className="mb-2">No theme set selected</p>
                        <p className="text-sm">Select a theme set from the sidebar to edit colors.</p>
                    </div>
                )}
            </div>
        </TopPanelContainer>
    )
}