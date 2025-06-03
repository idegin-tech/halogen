
import React from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { backgroundThemeOptions } from "@repo/ui/config"

interface ThemeDropdownProps {
    label: string;
    value?: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    description?: string;
    fieldName: string;
}

export function ThemeDropdown({ 
    label, 
    value, 
    onChange, 
    onBlur, 
    description, 
    fieldName 
}: ThemeDropdownProps) {
    console.log(`🎨 ThemeDropdown - fieldName: ${fieldName}, value: ${value}`);
    
    return (
        <div >
            <label className="text-sm font-medium text-muted-foreground">
                {label}
            </label>
            <Select 
                value={value || ""} 
                onValueChange={(newValue) => {
                    console.log(`🎨 ThemeDropdown onChange - fieldName: ${fieldName}, newValue: ${newValue}`);
                    onChange(newValue);
                    // Immediately trigger onBlur to commit the change
                    if (onBlur) {
                        setTimeout(() => onBlur(), 0);
                    }
                }}
                onOpenChange={(open) => {
                    if (!open && onBlur) {
                        onBlur();
                    }
                }}
            >
                <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                    {backgroundThemeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
        </div>
    )
}

export default ThemeDropdown;

