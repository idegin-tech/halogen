import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBuilderContext } from '@/context/builder.context';
import { usePreviewContext } from '@/context/preview.context';
import { useProjectContext } from '@/context/project.context';
import { Command, CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Popover,
    PopoverTrigger,
    PopoverContent
} from '@/components/ui/popover';
import {
    Command as CommandPrimitive,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { useMutation } from '@/hooks/useApi';
import { ProjectSettings } from '@halogen/common/types';

interface FontOption {
    name: string;
    value: string;
    category: 'heading' | 'body';
}

export default function FontRightPanel() {
    const { state, updateBuilderState } = useBuilderContext();
    const { state: previewState } = usePreviewContext();
    const { state: { project, settings }, updateProjectState } = useProjectContext();

    const [fonts, setFonts] = useState<FontOption[]>([]);
    const [displayFonts, setDisplayFonts] = useState<FontOption[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [initialLoading, setInitialLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFont, setSelectedFont] = useState<string>('Inter');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [fontPreviewsLoaded, setFontPreviewsLoaded] = useState<Set<string>>(new Set());
    const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

    const observerRef = useRef<IntersectionObserver | null>(null);
    const loaderRef = useRef<HTMLDivElement>(null);
    const commandListRef = useRef<HTMLDivElement>(null);

    const updateProjectFonts = useMutation<any, { headingFont: string; bodyFont: string }>(
        `/project-settings/${project?._id}/fonts`,
        {
            method: 'PUT'
        }
    );

    const categorizeFonts = (googleCategory: string): 'heading' | 'body' => {
        switch (googleCategory.toLowerCase()) {
            case 'serif':
            case 'display':
                return 'heading';
            default:
                return 'body';
        }
    };

    useEffect(() => {
        if (previewState.googleFonts.length > 0) {
            const fontOptions: FontOption[] = previewState.googleFonts.map(font => ({
                name: font.family,
                value: `${font.family}, ${font.category}`,
                category: categorizeFonts(font.category)
            }));

            setFonts(fontOptions);
            setInitialLoading(false);
        }
    }, [previewState.googleFonts]);

    useEffect(() => {
        if (fonts.length === 0) return;

        if (searchTerm) {
            setCurrentPage(1);
        }

        const filtered = searchTerm
            ? fonts.filter(font =>
                font.name.toLowerCase().includes(searchTerm.toLowerCase()))
            : fonts;

        const pageSize = 20;
        const endIndex = currentPage * pageSize;
        const paginatedFonts = filtered.slice(0, endIndex);

        setDisplayFonts(paginatedFonts);
        setHasMore(endIndex < filtered.length);

        loadFontPreviews(paginatedFonts);
    }, [fonts, searchTerm, currentPage]);

    useEffect(() => {
        if (isPopoverOpen && displayFonts.length === 0 && !initialLoading && fonts.length > 0) {
            setCurrentPage(1);
        }
    }, [isPopoverOpen, displayFonts.length, initialLoading, fonts.length]);

    useEffect(() => {
        if (!isPopoverOpen) return;

        const timeoutId = setTimeout(() => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }

            const scrollContainer = commandListRef.current;

            const options = {
                root: scrollContainer,
                rootMargin: '20px 0px',
                threshold: 0.1
            };

            observerRef.current = new IntersectionObserver((entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && hasMore && !initialLoading) {
                    setCurrentPage(prev => prev + 1);
                }
            }, options);

            if (loaderRef.current) {
                observerRef.current.observe(loaderRef.current);
            }
        }, 200);

        return () => {
            clearTimeout(timeoutId);
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMore, initialLoading, isPopoverOpen]);

    const loadFontPreviews = useCallback((fontOptions: FontOption[]) => {
        if (typeof window === 'undefined') return;

        const fontsToLoad = fontOptions.filter(font => !fontPreviewsLoaded.has(font.name));

        if (fontsToLoad.length === 0) return;

        const updatedLoadedFonts = new Set(fontPreviewsLoaded);
        fontsToLoad.forEach(font => updatedLoadedFonts.add(font.name));
        setFontPreviewsLoaded(updatedLoadedFonts);

        const batchSize = 10;
        for (let i = 0; i < fontsToLoad.length; i += batchSize) {
            const batch = fontsToLoad.slice(i, i + batchSize);
            const fontFamilies = batch.map(font => font.name.replace(/\s/g, '+')).join('|');

            if (fontFamilies) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = `https://fonts.googleapis.com/css?family=${fontFamilies}&display=swap`;
                document.head.appendChild(link);
            }
        }
    }, [fontPreviewsLoaded]);

    const handleFontSelect = (fontName: string) => {
        setSelectedFont(fontName);

        if (state.variables) {
            const updatedVariables = state.variables.map(variable => {
                if (variable.key === '--heading-font') {
                    return { ...variable, value: `${fontName}, sans-serif` };
                } else if (variable.key === '--body-font') {
                    return { ...variable, value: `${fontName}, sans-serif` };
                }
                return variable;
            });

            const projectSettings: ProjectSettings = {
                ...(settings || {}),
                headingFont: fontName,
                bodyFont: fontName,
                project: project?._id || '',
                integrations: settings?.integrations || []
            };

            const projectWithUpdatedSettings = project ? {
                ...project,
                settings: {
                    ...(settings || {}),
                    headingFont: fontName,
                    bodyFont: fontName
                }
            } : project;

            updateBuilderState({
                variables: updatedVariables,
            });
            updateProjectState({
                settings: projectSettings,
                project: projectWithUpdatedSettings
            });

            if (project?._id) {
                updateProjectFonts.mutate(
                    {
                        headingFont: fontName,
                        bodyFont: fontName
                    }
                );
            }
        }
    };

    const getSelectedFontValue = (fontName: string): string => {
        const fontInDisplay = displayFonts.find(f => f.name === fontName);
        if (fontInDisplay) return fontInDisplay.value;

        const fontInAll = fonts.find(f => f.name === fontName);
        return fontInAll ? fontInAll.value : `"${fontName}", sans-serif`;
    };

    useEffect(() => {
        if (project?.settings?.headingFont) {
            setSelectedFont(project.settings.headingFont);
        } else if (project?.settings?.bodyFont) {
            setSelectedFont(project.settings.bodyFont);
        }
    }, [project?.settings]);

    return (
        <div className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <label htmlFor="font-select" className="text-sm font-medium">
                    Font Family
                </label>

                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isPopoverOpen}
                            className="w-full justify-between"
                            id="font-select"
                            style={{ fontFamily: getSelectedFontValue(selectedFont) }}
                        >
                            {selectedFont}
                            <Command className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[300px]">
                        <CommandPrimitive>
                            <CommandInput
                                placeholder="Search fonts..."
                                value={searchTerm}
                                onValueChange={setSearchTerm}
                            />
                            <CommandList className="max-h-[300px] overflow-auto" ref={commandListRef}>
                                <CommandEmpty>No fonts found.</CommandEmpty>
                                <CommandGroup>
                                    {initialLoading ? (
                                        <div className="flex items-center justify-center p-4">
                                            <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent" />
                                        </div>
                                    ) : (
                                        <>
                                            {displayFonts.map(font => (
                                                <CommandItem
                                                    key={font.name}
                                                    value={font.name}
                                                    onSelect={() => {
                                                        handleFontSelect(font.name);
                                                        setIsPopoverOpen(false);
                                                    }}
                                                    className="flex items-center gap-2"
                                                    style={{ fontFamily: font.value }}
                                                >
                                                    <span>{font.name}</span>
                                                    {selectedFont === font.name && (
                                                        <CheckIcon className="h-4 w-4 ml-auto" />
                                                    )}
                                                </CommandItem>
                                            ))}
                                            {hasMore && (
                                                <div
                                                    ref={loaderRef}
                                                    className="flex justify-center p-2"
                                                >
                                                    {loading ? (
                                                        <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent" />
                                                    ) : (
                                                        <div className="h-5" />
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CommandGroup>
                            </CommandList>
                        </CommandPrimitive>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="pt-4 space-y-4">
                <h3 className="text-sm font-medium">Preview</h3>
                <div className="p-4 border rounded-md">
                    <h1
                        className="text-2xl font-semibold mb-2"
                        style={{ fontFamily: getSelectedFontValue(selectedFont) }}
                    >
                        Heading Text Preview
                    </h1>
                    <p
                        className="text-md"
                        style={{ fontFamily: getSelectedFontValue(selectedFont) }}
                    >
                        This is a paragraph with body text. The quick brown fox jumps over the lazy dog.
                    </p>
                </div>
            </div>
        </div>
    );
}
