import * as React from "react"
import _ from 'lodash'
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  debounce?: boolean;
  debounceTime?: number;
  onDebounceChange?: (value: string) => void;
  preserveOriginalOnChange?: boolean;
}

function Input({
  className, 
  type, 
  debounce = false,
  debounceTime = 500,
  onDebounceChange,
  preserveOriginalOnChange = true,
  onChange,
  ...props
}: InputProps) {
  // Store the current input value
  const [value, setValue] = React.useState(props.value || props.defaultValue || '');
  
  // Create a debounced function that will call onDebounceChange
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedOnChange = React.useCallback(
    _.debounce((value: string) => {
      onDebounceChange?.(value);
    }, debounceTime),
    [debounceTime, onDebounceChange]
  );
  
  // Clean up the debounce on unmount
  React.useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // If debounce is enabled, call the debounced function
    if (debounce && onDebounceChange) {
      debouncedOnChange(newValue);
    }
    
    // Preserve original onChange behavior if needed
    if (preserveOriginalOnChange && onChange) {
      onChange(e);
    }
  };
  
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/90 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:bg-input focus:bg-input",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      value={debounce ? value : undefined}
      onChange={debounce ? handleChange : onChange}
      {...props}
    />
  )
}

export { Input }
