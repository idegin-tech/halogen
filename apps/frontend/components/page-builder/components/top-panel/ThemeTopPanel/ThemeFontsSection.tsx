import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Command, CheckIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useBuilderContext } from '@/context/builder.context'
import { useMutation } from '@/hooks/useApi'
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@/components/ui/popover'
import {
  Command as CommandPrimitive,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { debounce } from '@/lib/debounce'

interface GoogleFontItem {
  family: string;
  variants: string[];
  category: string;
}

interface PaginatedFontsResponse {
  items: GoogleFontItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
}

interface FontOption {
  name: string;
  value: string;
  category: 'heading' | 'body';
}

export default function ThemeFontsSection() {
  const [fonts, setFonts] = useState<FontOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedFont, setSelectedFont] = useState<string>('Inter');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [fontPreviewsLoaded, setFontPreviewsLoaded] = useState<Set<string>>(new Set());
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const commandListRef = useRef<HTMLDivElement>(null);

  const [selectedHeadingFont, setSelectedHeadingFont] = useState<string>('Inter');
  const [selectedBodyFont, setSelectedBodyFont] = useState<string>('Inter');

  const { state, updateBuilderState } = useBuilderContext();

  const updateProjectFonts = useMutation<any, { headingFont: string; bodyFont: string }>(
    `/project-settings/${state.project?._id}/fonts`
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

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      if (value !== debouncedSearchTerm) {
        setDebouncedSearchTerm(value);
        setCurrentPage(1);
      }
    }, 300),
    [debouncedSearchTerm]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    if (isPopoverOpen && fonts.length === 0 && !initialLoading && !loadingMore) {
      setCurrentPage(1);
    }
  }, [isPopoverOpen, fonts.length, initialLoading, loadingMore]);

  useEffect(() => {
    const fetchFonts = async () => {
      try {
        if (currentPage === 1) {
          setInitialLoading(true);
          setFonts([]);
        } else {
          setLoadingMore(true);
        }

        setError(null);

        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20',
        });

        if (debouncedSearchTerm) {
          queryParams.append('search', debouncedSearchTerm);
        }

        const response = await fetch(`/api/fonts?${queryParams.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch fonts');
        }

        const data: PaginatedFontsResponse = await response.json();

        const fontOptions: FontOption[] = data.items.map(font => ({
          name: font.family,
          value: `${font.family}, ${font.category}`,
          category: categorizeFonts(font.category)
        }));

        setHasMore(data.hasMore);

        if (currentPage === 1) {
          setFonts(fontOptions);
        } else {
          setFonts(prev => [...prev, ...fontOptions]);
        }

        loadFontPreviews(fontOptions);
      } catch (err: any) {
        setError(err.message || 'Failed to load fonts');
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
      }
    };

    fetchFonts();
  }, [currentPage, debouncedSearchTerm]);

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
        if (entry.isIntersecting && hasMore && !loadingMore && !initialLoading) {
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
  }, [hasMore, loadingMore, initialLoading, isPopoverOpen]);

  const loadFontPreviews = useCallback((fontOptions: FontOption[]) => {
    const fontsToLoad = fontOptions.filter(font => !fontPreviewsLoaded.has(font.name));

    if (fontsToLoad.length === 0) return;

    const updatedLoadedFonts = new Set(fontPreviewsLoaded);
    fontsToLoad.forEach(font => updatedLoadedFonts.add(font.name));
    setFontPreviewsLoaded(updatedLoadedFonts);

    const fontFamilies = fontsToLoad.map(font => font.name.replace(/\s/g, '+')).join('|');
    if (fontFamilies) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css?family=${fontFamilies}&display=swap`;
      document.head.appendChild(link);
    }
  }, [fontPreviewsLoaded]);

  const handleFontSelect = (fontName: string) => {
    setSelectedFont(fontName);
    setSelectedHeadingFont(fontName);
    setSelectedBodyFont(fontName);

    const selectedFontOption = fonts.find(f => f.name === fontName);
    if (!selectedFontOption) return;

    if (state.variables) {
      const updatedVariables = state.variables.map(variable => {
        if (variable.key === '--heading-font') {
          return { ...variable, value: `${fontName}, sans-serif` };
        } else if (variable.key === '--body-font') {
          return { ...variable, value: `${fontName}, sans-serif` };
        }
        return variable;
      });

      updateBuilderState({ variables: updatedVariables });

      if (state.project?._id) {
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
    const font = fonts.find(f => f.name === fontName);
    return font ? font.value : `"${fontName}", sans-serif`;
  };

  useEffect(() => {
    if (state.project?.settings?.headingFont) {
      setSelectedHeadingFont(state.project.settings.headingFont);
      setSelectedFont(state.project.settings.headingFont);
    }

    if (state.project?.settings?.bodyFont) {
      setSelectedBodyFont(state.project.settings.bodyFont);

      if (!state.project?.settings?.headingFont) {
        setSelectedFont(state.project.settings.bodyFont);
      }
    }
  }, [state.project?.settings]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium mb-2">Typography Settings</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Customize the fonts used throughout your website. The same font will be used for both headings and body text.
        </p>
      </div>

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
          <PopoverContent className="w-[300px] p-0">
            <CommandPrimitive>
              <CommandInput
                placeholder="Search fonts..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="h-9"
              />
              <CommandList className="max-h-[300px] overflow-auto" ref={commandListRef}>
                <CommandEmpty>No fonts found.</CommandEmpty>
                <CommandGroup>
                  {fonts.map((font) => (
                    <CommandItem
                      key={font.name}
                      value={font.name}
                      onSelect={() => {
                        handleFontSelect(font.name);
                        setIsPopoverOpen(false);
                      }}
                      style={{ fontFamily: font.value }}
                      className="text-base"
                    >
                      {font.name}
                      <CheckIcon
                        className={`ml-auto h-4 w-4 ${selectedFont === font.name ? 'opacity-100' : 'opacity-0'
                          }`}
                      />
                    </CommandItem>
                  ))}

                  {(initialLoading || loadingMore) && (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm">Loading fonts...</span>
                    </div>
                  )}

                  {!initialLoading && !loadingMore && hasMore && (
                    <div ref={loaderRef} className="py-2" />
                  )}
                </CommandGroup>
              </CommandList>
            </CommandPrimitive>
          </PopoverContent>
        </Popover>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Heading Preview</h4>
          <div
            className="p-4 bg-muted rounded-md"
            style={{ fontFamily: getSelectedFontValue(selectedHeadingFont) }}
          >
            <h1 className="text-2xl font-bold">The quick brown fox jumps over the lazy dog</h1>
            <h2 className="text-xl">The five boxing wizards jump quickly</h2>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Body Text Preview</h4>
          <div
            className="p-4 bg-muted rounded-md"
            style={{ fontFamily: getSelectedFontValue(selectedBodyFont) }}
          >
            <p className="mb-2">
              Typography is the art and technique of arranging type to make written language legible,
              readable and appealing when displayed.
            </p>
            <p>
              The arrangement of type involves selecting typefaces, point sizes, line lengths,
              line-spacing, and letter-spacing.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
