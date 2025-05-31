import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBuilderContext } from '@/context/builder.context';

interface ThemeDropdownProps {
    label: string;
    value?: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    description?: string;
    fieldName?: string;
}

interface ThemeOption {
    label: string;
    value: string;
    description: string;
    type: 'solid' | 'gradient';
    gradientType?: 'linear' | 'radial';
    gradientDirection?: string;
    colorFrom?: string;
    colorTo?: string;
}

const baseThemeOptions: ThemeOption[] = [
    {
        label: "Primary",
        value: "primary",
        description: "Use primary theme colors",
        type: "solid"
    },
    {
        label: "Secondary", 
        value: "secondary",
        description: "Use secondary theme colors",
        type: "solid"
    },
    {
        label: "Accent",
        value: "accent", 
        description: "Use accent theme colors",
        type: "solid"
    },
    {
        label: "Muted",
        value: "muted",
        description: "Use muted theme colors", 
        type: "solid"
    },
    {
        label: "None (Transparent)",
        value: "none",
        description: "Transparent background",
        type: "solid"
    },
    // Gradient combinations
    {
        label: "Primary to Secondary",
        value: "gradient-primary-secondary",
        description: "Linear gradient from primary to secondary",
        type: "gradient",
        gradientType: "linear",
        gradientDirection: "to-r",
        colorFrom: "primary",
        colorTo: "secondary"
    },
    {
        label: "Background to Card",
        value: "gradient-background-card", 
        description: "Linear gradient from background to card",
        type: "gradient",
        gradientType: "linear",
        gradientDirection: "to-r",
        colorFrom: "background",
        colorTo: "card"
    },
    {
        label: "Primary to Accent",
        value: "gradient-primary-accent",
        description: "Linear gradient from primary to accent", 
        type: "gradient",
        gradientType: "linear",
        gradientDirection: "to-r",
        colorFrom: "primary",
        colorTo: "accent"
    },
    {
        label: "Secondary to Muted",
        value: "gradient-secondary-muted",
        description: "Linear gradient from secondary to muted",
        type: "gradient", 
        gradientType: "linear",
        gradientDirection: "to-r",
        colorFrom: "secondary",
        colorTo: "muted"
    },
    // Radial gradients
    {
        label: "Primary to Secondary (Radial)",
        value: "gradient-radial-primary-secondary",
        description: "Radial gradient from primary to secondary",
        type: "gradient",
        gradientType: "radial",
        colorFrom: "primary",
        colorTo: "secondary"
    },
    {
        label: "Background to Card (Radial)",
        value: "gradient-radial-background-card",
        description: "Radial gradient from background to card",
        type: "gradient",
        gradientType: "radial", 
        colorFrom: "background",
        colorTo: "card"
    }
];

export function ThemeDropdown({
    label,
    value = "",
    onChange,
    onBlur,
    description,
    fieldName
}: ThemeDropdownProps) {
    const { state } = useBuilderContext();
    
    const colorVariables = useMemo(() => {
        const defaultColorSetId = 'set_colors';
        return state.variables.filter(v => {
            const setId = typeof v.variableSet === 'string' 
                ? v.variableSet 
                : v.variableSet?.set_id;
            return setId === defaultColorSetId && v.type === 'color';
        }).reduce((acc, variable) => {
            const key = variable.variable_id.replace('--', '');
            acc[key] = variable.primaryValue;
            return acc;
        }, {} as Record<string, string>);
    }, [state.variables]);

    const themeOptions = useMemo(() => {
        return baseThemeOptions.map(option => {
            let previewStyle: React.CSSProperties = {};
            
            if (option.type === 'solid') {
                switch (option.value) {
                    case 'primary':
                        previewStyle = {
                            backgroundColor: colorVariables['primary'] || '#6D3DF2',
                            color: colorVariables['primary-foreground'] || '#FAFAFA'
                        };
                        break;
                    case 'secondary':
                        previewStyle = {
                            backgroundColor: colorVariables['secondary'] || '#F55B00',
                            color: colorVariables['secondary-foreground'] || '#0F0F10'
                        };
                        break;
                    case 'accent':
                        previewStyle = {
                            backgroundColor: colorVariables['accent'] || '#F5F5F6',
                            color: colorVariables['accent-foreground'] || '#0F0F10'
                        };
                        break;
                    case 'muted':
                        previewStyle = {
                            backgroundColor: colorVariables['muted'] || '#F5F5F6',
                            color: colorVariables['muted-foreground'] || '#757578'
                        };
                        break;
                    case 'none':
                        previewStyle = {
                            backgroundColor: 'transparent',
                            border: `1px solid ${colorVariables['border'] || '#E4E4E7'}`,
                            color: colorVariables['foreground'] || '#0A0A0A'
                        };
                        break;
                }
            } else if (option.type === 'gradient') {
                const fromColor = colorVariables[option.colorFrom!] || '#6D3DF2';
                const toColor = colorVariables[option.colorTo!] || '#F55B00';
                
                if (option.gradientType === 'radial') {
                    previewStyle = {
                        background: `radial-gradient(circle, ${fromColor}40, ${toColor}40)`,
                        color: colorVariables['foreground'] || '#0A0A0A'
                    };
                } else {
                    previewStyle = {
                        background: `linear-gradient(to right, ${fromColor}40, ${toColor}40)`,
                        color: colorVariables['foreground'] || '#0A0A0A'
                    };
                }
            }

            return {
                ...option,
                previewStyle
            };
        });
    }, [colorVariables]);

    const selectedOption = themeOptions.find(option => option.value === value);

    return (
        <div className="grid gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">{label}</label>
            <Select
                value={value}
                onValueChange={onChange}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select theme">
                        {selectedOption && (
                            <div className="flex items-center gap-2">
                                <div 
                                    className="w-4 h-4 rounded-sm flex-shrink-0"
                                    style={selectedOption.previewStyle}
                                />
                                <span>{selectedOption.label}</span>
                            </div>
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {themeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2 w-full">
                                <div 
                                    className="w-4 h-4 rounded-sm flex-shrink-0"
                                    style={option.previewStyle}
                                />
                                <div className="flex flex-col">
                                    <span className="font-medium">{option.label}</span>
                                    <span className="text-xs text-muted-foreground">{option.description}</span>
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
        </div>
    );
}
