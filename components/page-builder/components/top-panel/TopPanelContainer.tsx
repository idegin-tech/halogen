import { Button } from '@heroui/button'
import { Ellipsis, LockIcon, PlusIcon } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";

type Props = {
    heading: string;
    setList: (
        | {
            id: string;
            name: string;
            icon: React.ReactNode;
            isLocked?: boolean;
        }
        | string
    )[];
    activeSetId: string | null;
    children: React.ReactNode;
    onSetActiveSet: (id: string) => void;
    onAddSet?: (name?: string) => string;
    onSetChange: (data: any) => void;
    onRemoveSet: (id: string) => void;
    onClose: () => void;
    show?: boolean;
    subPageHeading?: string;
    subPageDescription?: string;
};
export default function TopPanelContainer(
    {
        activeSetId,
        children,
        heading,
        onAddSet,
        onRemoveSet,
        onSetActiveSet,
        setList,
        onSetChange,
        show = false,
        onClose,
        subPageHeading,
        subPageDescription
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
            {show && <div className='fixed left-0 right-0 bg-black/30 z-40 cursor-pointer h-body bottom-0' onClick={onClose} />}
            <div
                className={cn('h-[calc(var(--body-height)-3rem)] bg-content1-foreground max-w-[1200px] min-w-[900px] shadow-md top-[calc(var(--header-height)+10px)] z-50 left-1/2 transform -translate-x-2/4 absolute border-divider rounded-xl overflow-hidden flex flex-col transition-all duration-200', {
                    '-top-[95vh]': !show,
                })}
            >
                <div className='flex-1 bg-background flex'>
                    <div className='min-w-[35%] max-w-[35%] h-full bg-content2 border-r border-divider select-none'>
                        <header className='h-header border-b border-divider flex justify-between items-center px-2'>
                            <p className='font-bold text-xl'>{heading}</p>
                            <Button size='sm' isIconOnly aria-label="Add new" color="default" variant="faded" onClick={handleAddClick}>
                                <PlusIcon />
                            </Button>
                        </header>
                        <div className='flex-1 overflow-x-hidden overflow-y-auto p-2 space-y-2'>
                            {
                                setList.map((set, index) => {
                                    // Render a divider if the set item is a string
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
                                    
                                    // Otherwise render the normal set item
                                    return (
                                        <div
                                            key={set.id}
                                            className={cn(
                                                'flex items-center gap-2 p-2 hover:bg-content2 cursor-pointer rounded-xl',
                                                activeSetId === set.id && 'bg-content3 hover:bg-content3',
                                                activeSetId !== set.id && 'opacity-70 hover:opacity-100 hover:bg-content3/60',
                                            )}
                                            onClick={() => onSetActiveSet(set.id)}
                                        >
                                            <div className='text-sm'>
                                                {
                                                    set.isLocked ?
                                                        <LockIcon className="h-5 w-5" /> :
                                                        React.cloneElement(set.icon as React.ReactElement, { className: 'h-5 w-5' })
                                                }

                                            </div>
                                            <p className='text-sm flex-1 truncate'>{set.name}</p>
                                            <Dropdown>
                                                <DropdownTrigger >
                                                    <Button variant="flat" isIconOnly size='sm'>
                                                        <Ellipsis />
                                                    </Button>
                                                </DropdownTrigger>
                                                <DropdownMenu aria-label="Static Actions" disabledKeys={set.isLocked ? ['delete'] : []}>
                                                    <DropdownItem key="edit">Edit</DropdownItem>
                                                    <DropdownItem
                                                        key="delete"
                                                        className="text-danger"
                                                        color="danger"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRemoveSet(set.id);
                                                        }}
                                                    >
                                                        Delete
                                                    </DropdownItem>
                                                </DropdownMenu>
                                            </Dropdown>
                                        </div>
                                    );
                                })
                            }

                            {isAddingNew && (
                                <div className={cn(
                                    'flex flex-col gap-1 p-2',
                                    'bg-content2/60 rounded-xl',
                                    nameError && 'border border-danger'
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
                                        <p className="text-xs text-danger ml-7">{nameError}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className='flex-1 h-full bg-content1 flex flex-col'>
                        <header className='h-header border-b border-divider flex justify-between items-center px-2'>
                            <p className='font-bold text-lg'>{subPageHeading}</p>
                        </header>
                        <div className='flex-1 overflow-x-hidden overflow-y-auto p-2 max-h-[calc(var(--body-height)-7rem)]'>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
