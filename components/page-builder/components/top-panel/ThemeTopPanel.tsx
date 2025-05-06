import React, { useState, useEffect, useMemo } from 'react'
import TopPanelContainer from './TopPanelContainer'
import { BrushIcon, PaletteIcon, CircleIcon } from 'lucide-react'
import { Input, Button, Popover, PopoverTrigger, PopoverContent } from '@heroui/react'
import { useBuilderContext } from '@/context/builder.context'
import { Variable, VariableSet } from '@/types/builder.types'
import ColorPicker from 'react-pick-color'

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
                : variable.variableSet.id;
            
            if (!groups[setId]) {
                groups[setId] = [];
            }
            
            groups[setId].push(variable);
        });
        
        return groups;
    }, [state.variables]);
    
    const currentVariableSet = useMemo(() => {
        return state.variableSets.find(set => set.id === selectedVariableSetId) || null;
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

    const handleVariableChange = (variableId: string, value: string, isDark: boolean = false) => {
        const updatedVariables = state.variables.map(variable => {
            if (variable.id === variableId) {
                return {
                    ...variable,
                    [isDark ? 'secondaryValue' : 'primaryValue']: value
                };
            }
            return variable;
        });
        
        updateBuilderState({ variables: updatedVariables });
    };
    
    const handleColorChange = (color: { hex: string }, variableId: string, isDark: boolean = false) => {
        handleVariableChange(variableId, hexToHsl(color.hex), isDark);
    };
    
    const toggleColorPicker = (variableId: string) => {
        setColorPickerVisible(prev => ({
            ...prev,
            [variableId]: !prev[variableId]
        }));
    };
    
    const hslToHex = (hslString: string): string => {
        if (!hslString || typeof hslString !== 'string') return '#000000';
        
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
    
    const validation = useMemo(() => {
        if (!variableSetName.trim()) return { invalid: true, message: 'Variable set name is required' };
        
        const duplicateName = state.variableSets.find(set => 
            set.name.toLowerCase() === variableSetName.toLowerCase() && 
            set.id !== selectedVariableSetId
        );
        
        return { invalid: !!duplicateName, message: duplicateName ? 'Set name already exists' : '' };
    }, [variableSetName, state.variableSets, selectedVariableSetId]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedVariableSetId && !validation.invalid) {
            const updatedVariableSets = state.variableSets.map(set => 
                set.id === selectedVariableSetId 
                    ? { ...set, name: variableSetName } 
                    : set
            );
            
            updateBuilderState({ variableSets: updatedVariableSets });
        }
    };
    
    const handleAddVariableSet = (name?: string) => {
        const setName = name || 'New Theme';
        const newSetId = `set_${Date.now()}`;
        
        const newVariableSet: VariableSet = {
            id: newSetId,
            name: setName,
            key: setName.toLowerCase().replace(/\s+/g, '-'),
        };
        
        const currentSetType = currentVariableSet?.key === 'radius' ? 'radius' : 'colors';
        const templateSetId = currentSetType === 'radius' ? 'set_radius' : 'set_colors';
        
        const templateVariables = state.variables.filter(v => {
            const setId = typeof v.variableSet === 'string' ? v.variableSet : v.variableSet.id;
            return setId === templateSetId;
        });
        
        const newVariables = templateVariables.map(variable => ({
            ...variable,
            id: `${variable.id}_${Date.now()}`, 
            variableSet: newSetId
        }));
        
        updateBuilderState({ 
            variableSets: [...state.variableSets, newVariableSet],
            variables: [...state.variables, ...newVariables]
        });
        
        return newSetId;
    };
    
    const handleRemoveVariableSet = (id: string) => {
        if (id === 'set_colors' || id === 'set_radius') return;
        
        const updatedVariableSets = state.variableSets.filter(set => set.id !== id);
        const updatedVariables = state.variables.filter(variable => {
            const variableSetId = typeof variable.variableSet === 'string' 
                ? variable.variableSet 
                : variable.variableSet.id;
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
    };
    
    const mappedVariableSets = useMemo(() => {
        return state.variableSets.map(set => ({
            id: set.id,
            name: set.name,
            icon: set.key === 'radius' ? <CircleIcon /> : <PaletteIcon />,
            isLocked: set.id === 'set_colors' || set.id === 'set_radius'
        }));
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
    
    return (
        <>
            <TopPanelContainer
                heading="Themes"
                onClose={onHide}
                show={show}
                setList={mappedVariableSets}
                activeSetId={selectedVariableSetId}
                onAddSet={handleAddVariableSet}
                onRemoveSet={handleRemoveVariableSet}
                onSetActiveSet={setSelectedVariableSetId}
                onSetChange={handleSetChange}
            >
                <div className='flex-1 overflow-x-hidden overflow-y-auto'>
                    {selectedVariableSetId && currentVariableSet ? (
                        <form onSubmit={handleSubmit} className="space-y-4 p-2">
                            <div className="space-y-2">
                                <Input
                                    label="Theme Name"
                                    placeholder="Enter theme name"
                                    value={variableSetName}
                                    onChange={(e) => setVariableSetName(e.target.value)}
                                    fullWidth
                                    variant="bordered"
                                    color={validation.invalid ? "danger" : "default"}
                                    errorMessage={validation.invalid ? validation.message : ""}
                                    isDisabled={currentVariableSet.id === 'set_colors' || currentVariableSet.id === 'set_radius'}
                                />
                            </div>
                            
                            {hasColorVariables && (
                                <div className="space-y-4">
                                    <h3 className="text-md font-medium">Color Variables</h3>
                                    <div className="rounded-lg border border-divider overflow-hidden">
                                        <div className="grid grid-cols-10 bg-default-50 px-3 py-2 border-b border-divider">
                                            <div className="col-span-4 text-sm font-medium text-default-700">Variable Name</div>
                                            <div className="col-span-3 text-sm font-medium text-default-700">Light Mode</div>
                                            <div className="col-span-3 text-sm font-medium text-default-700">Dark Mode</div>
                                        </div>
                                        <div className="divide-y divide-divider">
                                            {colorVariables.map((variable) => (
                                                <div key={variable.id} className="grid grid-cols-10 py-3 px-3 items-center hover:bg-default-50 transition-colors">
                                                    <div className="col-span-4 pr-4">
                                                        <div className="font-medium text-sm">{variable.name}</div>
                                                        <div className="text-xs text-default-500">{`---${variable.key}`}</div>
                                                    </div>
                                                    <div className="col-span-3 flex items-center gap-2">
                                                        <Popover>
                                                            <PopoverTrigger>
                                                                <div 
                                                                    className="w-8 h-8 rounded-md border border-divider cursor-pointer flex-shrink-0"
                                                                    style={{ backgroundColor: hslToHex(variable.primaryValue) }}
                                                                />
                                                            </PopoverTrigger>
                                                            <PopoverContent className="p-0 border-none">
                                                                <div className="p-1">
                                                                    <ColorPicker 
                                                                        color={hslToHex(variable.primaryValue)}
                                                                        onChange={(color) => handleColorChange(color, variable.id)}
                                                                    />
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <div className="flex-1 bg-content1 rounded-md px-2 py-1 text-sm">
                                                            {variable.primaryValue}
                                                        </div>
                                                    </div>
                                                    <div className="col-span-3 flex items-center gap-2">
                                                        <Popover>
                                                            <PopoverTrigger>
                                                                <div 
                                                                    className="w-8 h-8 rounded-md border border-divider cursor-pointer flex-shrink-0"
                                                                    style={{ backgroundColor: hslToHex(variable.secondaryValue) }}
                                                                />
                                                            </PopoverTrigger>
                                                            <PopoverContent className="p-0 border-none">
                                                                <div className="p-1">
                                                                    <ColorPicker 
                                                                        color={hslToHex(variable.secondaryValue)}
                                                                        onChange={(color) => handleColorChange(color, variable.id, true)}
                                                                    />
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <div className="flex-1 bg-content1 rounded-md px-2 py-1 text-sm">
                                                            {variable.secondaryValue}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {hasSizeVariables && (
                                <div className="space-y-4">
                                    <h3 className="text-md font-medium">Border Radius Values</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {currentVariables
                                            .filter(v => v.type === 'size')
                                            .map((variable) => (
                                                <div key={variable.id} className="flex flex-col">
                                                    <label className="block text-sm mb-1">{variable.name}</label>
                                                    <div className="flex items-center gap-4">
                                                        <Input 
                                                            value={variable.primaryValue}
                                                            onChange={(e) => handleVariableChange(variable.id, e.target.value)}
                                                            size="sm"
                                                            className="flex-1"
                                                            endContent={
                                                                <div className="bg-default-100 rounded-br-lg rounded-tr-lg px-2 h-full flex items-center">
                                                                    {variable.primaryValue.includes('rem') ? 'rem' : 
                                                                     variable.primaryValue.includes('px') ? 'px' : ''}
                                                                </div>
                                                            }
                                                        />
                                                        <div 
                                                            className="w-12 h-12 bg-content3 border border-default-100" 
                                                            style={{ borderRadius: variable.primaryValue }}
                                                        />
                                                    </div>
                                                </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4">
                                <Button 
                                    color="primary"
                                    type="submit"
                                    fullWidth
                                    isDisabled={validation.invalid || currentVariableSet.id === 'set_colors' || currentVariableSet.id === 'set_radius'}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                            <BrushIcon className="h-12 w-12 mb-4 opacity-50" />
                            <p className="mb-2">No theme selected</p>
                            <p className="text-sm">Select a theme from the list or create a new one.</p>
                            <Button
                                color="primary"
                                variant="flat"
                                className="mt-4"
                                onClick={() => {
                                    const newId = handleAddVariableSet();
                                    setSelectedVariableSetId(newId);
                                }}
                            >
                                Create New Theme
                            </Button>
                        </div>
                    )}
                </div>
            </TopPanelContainer>
        </>
    )
}