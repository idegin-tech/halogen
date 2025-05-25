import { Button } from '@/components/ui/button'
import { LockIcon, PlusIcon } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"



type IconElement = React.ReactElement<{ className?: string }>;

type BreadcrumbItem = {
    label: string;
    href?: string;
};

type Props = {
    heading: string;
    setList: (
        | {
            id: string;
            name: string;
            icon: IconElement;
            isLocked?: boolean;
        }
        | string
    )[];
    activeSetId: string | null;
    children: React.ReactNode;
    onSetActiveSet: (id: string) => void;
    onAddSet?: (name?: string) => string;
    onClose: () => void;
    show?: boolean;
    subPageHeading?: string;
    subPageDescription?: string;
    breadcrumbs?: BreadcrumbItem[];
    withoutFirstColumn?: boolean;
    secondColumnHeaderContent?: React.ReactNode;
    size?: 'default' | 'lg' | 'xl';
};
export default function TopPanelContainer(
    {
        activeSetId,
        children,
        heading,
        onAddSet,
        onSetActiveSet,
        setList,
        show = false,
        onClose,
        subPageHeading,
        subPageDescription,
        breadcrumbs = [], 
        withoutFirstColumn = false,
        secondColumnHeaderContent,
        size = 'default'
    }: Props
) {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newSetName, setNewSetName] = useState('');
    const [nameError, setNameError] = useState<string | null>(null);
    const newInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isAddingNew && newInputRef.current) {
            newInputRef.current.focus();
        }
    }, [isAddingNew]);

    const handleAddClick = () => {
        setIsAddingNew(true);
        setNewSetName('');
        setNameError(null);
    };

    const validateName = (name: string) => {
        if (!name.trim()) {
            return "Name cannot be empty";
        }

        const exists = setList.some(set =>
            typeof set === 'object' && set.name.toLowerCase() === name.trim().toLowerCase()
        );

        if (exists) {
            return "This name already exists";
        }

        return null;
    };

    const handleCreateNewSet = () => {
        if (!newSetName.trim() || !onAddSet) {
            setIsAddingNew(false);
            return;
        }

        const error = validateName(newSetName);
        if (error) {
            setNameError(error);
            return;
        }

        const newId = onAddSet(newSetName.trim());
        onSetActiveSet(newId);
        setIsAddingNew(false);
        setNewSetName('');
        setNameError(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCreateNewSet();
        } else if (e.key === 'Escape') {
            setIsAddingNew(false);
            setNameError(null);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewSetName(value);

        if (value.trim()) {
            setNameError(validateName(value));
        } else {
            setNameError(null);
        }
    };

    return (
        <>
            {show && <div className='fixed left-0 right-0 bg-black/10 z-40 cursor-pointer h-[var(--body-height)] bottom-0' onClick={onClose} />}            <div
                className={cn('h-[calc(var(--body-height)-3rem)] bg-background shadow-md top-[calc(var(--header-height)+10px)] z-50 left-1/2 transform -translate-x-2/4 absolute border rounded-xl overflow-hidden flex flex-col transition-all duration-200', {
                    '-top-[95vh]': !show,
                    'max-w-[1200px] min-w-[900px]': size === 'default',
                    'max-w-[1800px] min-w-[1400px]': size === 'xl',
                    'max-w-[1600px] min-w-[1200px]': size === 'lg'
                })}
            >
                {
                    show && <>
                    <div className='flex-1 bg-background flex'>
                    {!withoutFirstColumn && (
                        <div className='min-w-[300px] max-w-[300px] h-full border-r border-border select-none bg-sidebar'>
                            <header className='h-[var(--header-height)] border-b border-border flex justify-between items-center px-2 select-none'>
                                <p className='font-bold text-xl text-muted-foreground'>{heading}</p>
                                <Button variant='ghost' size='sm' className="h-8 w-8 p-0" onClick={handleAddClick}>
                                    <PlusIcon className="h-4 w-4" />
                                </Button>
                            </header>
                            <div className='flex-1 overflow-x-hidden overflow-y-auto p-2 space-y-2'>
                                {
                                    setList.map((set, index) => {
                                        if (typeof set === 'string') {
                                            return (
                                                <div
                                                    key={`divider-${index}`}
                                                    className="px-2 py-1"
                                                >
                                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{set}</div>
                                                    <div className="h-px bg-border mt-1"></div>
                                                </div>
                                            );
                                        }
                                        
                                        // Handle items with isHeader property
                                        if ('isHeader' in set && set.isHeader) {
                                            return (
                                                <div
                                                    key={set.id}
                                                    className="px-2 py-1"
                                                >
                                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{set.name}</div>
                                                    <div className="h-px bg-border mt-1"></div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={set.id}
                                                className={cn(
                                                    'flex items-center gap-2 p-2 hover:bg-accent cursor-pointer rounded-md',
                                                    activeSetId === set.id && 'bg-accent hover:bg-accent',
                                                    activeSetId !== set.id && 'opacity-70 hover:opacity-100',
                                                )}
                                                onClick={() => onSetActiveSet(set.id)}
                                            >
                                                <div className='text-sm'>
                                                    {
                                                        set.isLocked ?
                                                            <LockIcon className="h-5 w-5" /> :
                                                            React.isValidElement(set.icon)
                                                                ? React.cloneElement(set.icon, { className: 'h-5 w-5' })
                                                                : null
                                                    }

                                                </div>
                                                <p className='text-sm flex-1 truncate'>{set.name}</p>
                                            </div>
                                        );
                                    })
                                }

                                {isAddingNew && (
                                    <div className={cn(
                                        'flex flex-col gap-1 p-2',
                                        'bg-muted/70 rounded-md',
                                        nameError && 'border border-destructive'
                                    )}>
                                        <div className="flex items-center gap-2">
                                            <div className='text-sm'>
                                                <PlusIcon className="h-5 w-5" />
                                            </div>
                                            <input
                                                ref={newInputRef}
                                                type="text"
                                                className={cn(
                                                    'text-sm flex-1 bg-transparent border-none outline-none focus:ring-0'
                                                )}
                                                placeholder="Enter name and press Enter"
                                                value={newSetName}
                                                onChange={handleInputChange}
                                                onBlur={handleCreateNewSet}
                                                onKeyDown={handleKeyDown}
                                            />
                                        </div>
                                        {nameError && (
                                            <p className="text-xs text-destructive ml-7">{nameError}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div className={cn('h-full bg-background flex flex-col', {
                        'flex-1': !withoutFirstColumn,
                        'w-full': withoutFirstColumn
                    })}>
                        <header className='h-[var(--header-height)] border-b border-border flex justify-between items-center px-4 select-none'>
                            <div className="flex items-center">
                                <Breadcrumb>
                                    <BreadcrumbList>
                                        {breadcrumbs.length > 0 ? (
                                            breadcrumbs.map((item, index) => (
                                                <React.Fragment key={index}>
                                                    <BreadcrumbItem>
                                                        {index === breadcrumbs.length - 1 ? (
                                                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                                        ) : (
                                                            <BreadcrumbLink href={item.href || "#"}>{item.label}</BreadcrumbLink>
                                                        )}
                                                    </BreadcrumbItem>
                                                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                                                </React.Fragment>
                                            ))
                                        ) : (
                                            <>
                                                <BreadcrumbItem>
                                                    <BreadcrumbLink href="/">{heading}</BreadcrumbLink>
                                                </BreadcrumbItem>
                                                {subPageHeading && (
                                                    <>
                                                        <BreadcrumbSeparator />
                                                        <BreadcrumbItem>
                                                            <BreadcrumbPage>{subPageHeading}</BreadcrumbPage>
                                                        </BreadcrumbItem>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </BreadcrumbList>
                                </Breadcrumb>

                                {!secondColumnHeaderContent && (
                                    <>
                                        {subPageDescription && (
                                            <p className="text-sm text-muted-foreground">{subPageDescription}</p>
                                        )}
                                    </>
                                )}
                            </div>
                            {secondColumnHeaderContent && (
                                <div className="flex items-center gap-2">
                                    {secondColumnHeaderContent}
                                </div>
                            )}
                        </header>
                        <div className='flex-1 overflow-x-hidden overflow-y-auto p-2 max-h-[calc(var(--body-height)-7rem)]'>
                            {children}
                        </div>
                    </div>
                </div>
                    </>
                }
            </div>
        </>
    )
}
