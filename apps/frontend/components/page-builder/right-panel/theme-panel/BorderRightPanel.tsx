import React from 'react';
import { useBuilderContext } from '@/context/builder.context';
import { Input } from '@/components/ui/input';



export default function BorderRightPanel() {
    const { state, updateBuilderState } = useBuilderContext();

    const radiusVariables = React.useMemo(() => {
        const defaultRadiusSetId = 'set_radius';
        return state.variables
            .filter(v => {
                const setId = typeof v.variableSet === 'string'
                    ? v.variableSet
                    : v.variableSet.set_id;
                return setId === defaultRadiusSetId && v.type === 'size';
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [state.variables]);

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

    const extractNumericValue = (value: string): number => {
        if (!value) return 0;
        const match = value.match(/^([\d.]+)/);
        return match ? parseFloat(match[1]) : 0;
    };

    if (!radiusVariables.length) {
        return (
            <div className="text-center p-4 text-muted-foreground">
                <p>No border radius variables found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                {radiusVariables.map(variable => (
                    <div key={variable.variable_id} className="border rounded-md p-4 bg-background shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <label htmlFor={variable.variable_id} className="text-sm font-medium">
                                {variable.name}
                            </label>
                            <span className="text-xs bg-muted py-1 px-2 rounded-md">
                                {variable.primaryValue}
                            </span>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <Input
                                    id={variable.variable_id}
                                    type="range"
                                    min="0"
                                    max="40"
                                    step="1"
                                    className="flex-1"
                                    value={extractNumericValue(variable.primaryValue)}
                                    onChange={(e) => handleVariableChange(variable.variable_id, `${e.target.value}px`)}
                                />
                                <Input
                                    className="w-20"
                                    value={variable.primaryValue}
                                    onChange={(e) => handleVariableChange(variable.variable_id, e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4 items-center justify-around">
                                <div
                                    className="border h-16 w-16 flex items-center justify-center bg-primary/10"
                                    style={{ borderRadius: variable.primaryValue }}
                                >
                                </div>
                                <div
                                    className="border h-8 w-24 flex items-center justify-center bg-secondary/10"
                                    style={{ borderRadius: variable.primaryValue }}
                                >
                                    <span className="text-xs">Button</span>
                                </div>
                                <div
                                    className="border h-12 w-12 flex items-center justify-center rounded-full overflow-hidden"
                                    style={{ borderRadius: variable.primaryValue }}
                                >
                                    <div className="bg-muted h-full w-full flex items-center justify-center">
                                        <span className="text-xs">Icon</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
