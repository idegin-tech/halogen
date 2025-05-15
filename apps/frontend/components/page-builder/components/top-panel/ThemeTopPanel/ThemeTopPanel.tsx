import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { BrushIcon, PaletteIcon, CircleIcon, TypeIcon } from 'lucide-react'
import { useBuilderContext } from '@/context/builder.context'
import { Variable, VariableSet } from '@halogen/common/types'
import TopPanelContainer from '../TopPanelContainer'
import ThemeColorSection from './ThemeColorSection'
import ThemeRoundnessSection from './ThemeRoundnessSection'
import { extractNumericValue, hslToHex, hexToHsl } from './utils'
import ThemeFontsSection from './ThemeFontsSection'

interface ExtendedVariableSet extends VariableSet {
  isLocked?: boolean;
}

export default function ThemeTopPanel({show, onHide}:{show: boolean, onHide: () => void}) {
    const { state, updateBuilderState } = useBuilderContext();
    
    const [selectedVariableSetId, setSelectedVariableSetId] = useState<string | null>('section_colors');
    const [variableSetName, setVariableSetName] = useState('');
    
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
        // Prevent removing sections or built-in theme sets
        if (id === 'set_colors' || id === 'set_radius' || id === 'set_fonts' ||
            id === 'section_colors' || id === 'section_roundness' || id === 'section_fonts') return;
        
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
            setSelectedVariableSetId('section_colors');
        }
    };
      const handleSetChange = (data: any) => {
        console.log('Set change:', data);
    };
    
    const mappedVariableSets = useMemo(() => {
        // Create fixed sections for Colors, Roundness and Fonts
        const fixedSets = [
            {
                id: 'section_colors',
                name: 'Colors', 
                icon: <PaletteIcon />,
                isLocked: true,
                isSection: true
            },
            {
                id: 'section_roundness',
                name: 'Roundness',
                icon: <CircleIcon />,
                isLocked: true,
                isSection: true
            },
            {
                id: 'section_fonts',
                name: 'Fonts',
                icon: <TypeIcon />,
                isLocked: true,
                isSection: true
            }
        ];
        
        // Add variable sets from state (under a heading)
        const objectSets = state.variableSets.map(set => ({
            id: set.set_id,
            name: set.name,
            icon: set.key === 'radius' ? <CircleIcon /> : <PaletteIcon />,
            isLocked: set.set_id === 'set_colors' || set.set_id === 'set_radius'
        }));
        
        // First add the sections, then add themes with a header for separation
        return [
            ...fixedSets,
            // Add a string divider for themes to avoid TypeScript issue with isHeader
            "THEME SETS",
            ...objectSets
        ];
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
            if (selectedVariableSetId === 'section_colors') {
                items.push({ label: 'Colors' });
            } else if (selectedVariableSetId === 'section_roundness') {
                items.push({ label: 'Roundness' });
            } else if (selectedVariableSetId === 'section_fonts') {
                items.push({ label: 'Fonts' });
            } else {
                const variableSet = state.variableSets.find(set => set.set_id === selectedVariableSetId);
                if (variableSet) {
                    items.push({ label: variableSet.name });
                }
            }
        }
        
        return items;
    }, [selectedVariableSetId, state.variableSets]);

    // Get radius variables from current variables
    const radiusVariables = useMemo(() => {
        return currentVariables
            .filter(v => v.type === 'size')
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [currentVariables]);

    const sectionColorVariables = useMemo(() => {
        // For section_colors, we want to use the variables from 'set_colors'
        const defaultColorSetId = 'set_colors';
        if (selectedVariableSetId === 'section_colors') {
            return state.variables
                .filter(v => {
                    const setId = typeof v.variableSet === 'string' 
                        ? v.variableSet 
                        : v.variableSet.set_id;
                    return setId === defaultColorSetId && v.type === 'color';
                })
                .sort((a, b) => a.name.localeCompare(b.name));
        }
        return colorVariables;
    }, [selectedVariableSetId, state.variables, colorVariables]);

    const sectionRadiusVariables = useMemo(() => {
        // For section_roundness, we want to use the variables from 'set_radius'
        const defaultRadiusSetId = 'set_radius';
        if (selectedVariableSetId === 'section_roundness') {
            return state.variables
                .filter(v => {
                    const setId = typeof v.variableSet === 'string' 
                        ? v.variableSet 
                        : v.variableSet.set_id;
                    return setId === defaultRadiusSetId && v.type === 'size';
                })
                .sort((a, b) => a.name.localeCompare(b.name));
        }
        return radiusVariables;
    }, [selectedVariableSetId, state.variables, radiusVariables]);

    return (
        <TopPanelContainer
            heading="Theme"
            onClose={onHide}
            show={show}
            setList={mappedVariableSets}
            activeSetId={selectedVariableSetId}
            onAddSet={handleAddVariableSet}            onRemoveSet={handleRemoveVariableSet}
            onSetActiveSet={setSelectedVariableSetId}
            onSetChange={handleSetChange}
            subPageHeading={
                selectedVariableSetId === 'section_colors' ? 
                    "Colors" :
                selectedVariableSetId === 'section_roundness' ? 
                    "Roundness" :
                selectedVariableSetId === 'section_fonts' ? 
                    "Fonts" :
                selectedVariableSetId ? 
                    state.variableSets.find(set => set.set_id === selectedVariableSetId)?.name :
                    "Theme"
            }            breadcrumbs={breadcrumbs}
        >
            <div className='flex-1 overflow-x-hidden overflow-y-auto'>
                {selectedVariableSetId ? (
                    <div className="p-4">
                        {/* Show section content based on selectedVariableSetId */}
                        {selectedVariableSetId === 'section_colors' && (
                            <ThemeColorSection
                                colorVariables={sectionColorVariables}
                                variableSetName={"Colors"}
                                setVariableSetName={() => {}} // Not editable for section
                                handleVariableChange={handleVariableChange}
                                validation={{ invalid: false, message: '' }}
                                handleSubmit={(e) => e.preventDefault()}
                            />
                        )}
                        
                        {selectedVariableSetId === 'section_roundness' && (
                            <ThemeRoundnessSection 
                                radiusVariables={sectionRadiusVariables}
                                handleVariableChange={handleVariableChange}
                                extractNumericValue={extractNumericValue}
                            />
                        )}
                        
                        {selectedVariableSetId === 'section_fonts' && (
                            <ThemeFontsSection />
                        )}
                        
                        {/* Handle regular theme sets */}
                        {!['section_colors', 'section_roundness', 'section_fonts'].includes(selectedVariableSetId) && (
                            <ThemeColorSection
                                colorVariables={colorVariables}
                                variableSetName={variableSetName}
                                setVariableSetName={setVariableSetName}
                                handleVariableChange={handleVariableChange}
                                validation={validation}
                                handleSubmit={handleSubmit}
                            />
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                        <BrushIcon className="h-12 w-12 mb-4 opacity-50" />
                        <p className="mb-2">No theme section selected</p>
                        <p className="text-sm">Select a theme section from the sidebar to customize your theme.</p>
                    </div>
                )}
            </div>
        </TopPanelContainer>
    )
}