import React, { useState, useMemo } from 'react';
import { useBuilderContext } from '@/context/builder.context';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverTrigger,
    PopoverContent
} from '@/components/ui/popover';
import ColorPicker from 'react-pick-color';

export default function ColorRightPanel() {
    const { state, updateBuilderState } = useBuilderContext();
    const [colorPickerVisible, setColorPickerVisible] = useState<{ [key: string]: boolean }>({});

    const colorVariables = useMemo(() => {
        const defaultColorSetId = 'set_colors';
        return state.variables
            .filter(v => {
                const setId = typeof v.variableSet === 'string'
                    ? v.variableSet
                    : v.variableSet.set_id;
                return setId === defaultColorSetId && v.type === 'color';
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [state.variables]);

    const toggleColorPicker = (variableId: string) => {
        setColorPickerVisible(prev => {
            const newState = { ...prev };
            Object.keys(newState).forEach(key => {
                newState[key] = key === variableId ? !newState[key] : false;
            });
            return newState;
        });
    };

    const handleVariableChange = (variableId: string, value: string) => {
        const updatedVariables = state.variables.map(variable => {
            if (variable.variable_id === variableId) {
                return {
                    ...variable,
                    primaryValue: value,
                    secondaryValue: value
                };
            }
            return variable;
        });

        updateBuilderState({ variables: updatedVariables });
    };

    const handleColorChange = (color: { hex: string }, variableId: string) => {
        handleVariableChange(variableId, color.hex);
        // Keep color picker open until user explicitly closes it
    };

    if (!colorVariables.length) {
        return (
            <div className="text-center p-4 text-muted-foreground">
                <p>No color variables found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
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
}
