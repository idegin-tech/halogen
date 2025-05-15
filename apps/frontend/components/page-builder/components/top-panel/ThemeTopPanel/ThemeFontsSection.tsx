import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Command, CheckIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useBuilderContext } from '@/context/builder.context'
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

// Define interfaces for Google Fonts API response
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

// Define interface for font options
interface FontOption {
  name: string;
  value: string;
  category: 'heading' | 'body';
}

export default function ThemeFontsSection() {  // State for Google Fonts
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
    // Refs
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const commandListRef = useRef<HTMLDivElement>(null);

  // State for selected fonts - we'll use the same font for both heading and body
  const [selectedHeadingFont, setSelectedHeadingFont] = useState<string>('Inter');
  const [selectedBodyFont, setSelectedBodyFont] = useState<string>('Inter');
  
  // Builder context to update theme variables
  const { state, updateBuilderState } = useBuilderContext();

  // Function to categorize fonts based on their Google category
  const categorizeFonts = (googleCategory: string): 'heading' | 'body' => {
    switch(googleCategory.toLowerCase()) {
      case 'serif':
      case 'display':
        return 'heading';
      default:
        return 'body';
    }
  };
  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      // Only clear fonts when actually performing a search
      if (value !== debouncedSearchTerm) {
        setDebouncedSearchTerm(value);
        setCurrentPage(1); // Reset to first page when search term changes
        // Don't clear fonts immediately to avoid flickering
        // The new fonts will replace the old ones when loaded
      }
    }, 300),
    [debouncedSearchTerm]
  );
  // Watch for search term changes
  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);
  
  // Load initial fonts when popover is opened
  useEffect(() => {
    if (isPopoverOpen && fonts.length === 0 && !initialLoading && !loadingMore) {
      setCurrentPage(1);
    }
  }, [isPopoverOpen, fonts.length, initialLoading, loadingMore]);
  // Load fonts when page or search term changes
  useEffect(() => {
    const fetchFonts = async () => {
      try {
        if (currentPage === 1) {
          setInitialLoading(true);
        } else {
          setLoadingMore(true);
        }
        
        setError(null);
        
        // Build query with pagination and search parameters
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20', // Load 20 fonts at a time
        });
        
        if (debouncedSearchTerm) {
          queryParams.append('query', debouncedSearchTerm);
        }
        
        console.log(`Fetching fonts: page ${currentPage}, search: "${debouncedSearchTerm || ''}"`);        // Use our internal API endpoint with pagination
        const response = await fetch(`/api/fonts?${queryParams.toString()}`);
        
        console.log('API Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch fonts: ${response.statusText} (${response.status})`);
        }
        
        // Try to get the response text first to debug any JSON parsing issues
        const responseText = await response.text();
        let data: PaginatedFontsResponse;
          try {
          data = JSON.parse(responseText) as PaginatedFontsResponse;
          
          // Validate the data structure
          if (!data || !Array.isArray(data.items)) {
            console.error('Invalid API response structure:', data);
            throw new Error('Invalid API response structure');
          }
          
          // If we got no items but expected some, log the issue
          if (data.items.length === 0 && !debouncedSearchTerm) {
            console.warn('API returned zero fonts when not searching');
          }
          
        } catch (jsonError) {
          console.error('Failed to parse API response:', responseText.substring(0, 200) + '...');
          throw new Error('Invalid API response format');
        }
        console.log(`Received ${data.items.length} fonts, total: ${data.totalItems}`);
        
        // Map Google Fonts data to our FontOption interface
        const newFontOptions: FontOption[] = data.items.map(item => ({
          name: item.family,
          value: `"${item.family}", ${item.category}`,
          category: categorizeFonts(item.category)
        }));
        
        // Append new fonts to existing ones (for infinite scroll)
        if (currentPage === 1) {
          setFonts(newFontOptions);
        } else {
          setFonts(prevFonts => [...prevFonts, ...newFontOptions]);
        }
        
        // Update hasMore flag
        setHasMore(data.hasMore);
        
        // Pre-load only the fonts that are visible
        if (newFontOptions.length > 0) {
          loadFontPreviews(newFontOptions.slice(0, 10));
        }
          } catch (err: any) {
        console.error('Error fetching Google Fonts:', err);
        setError(err.message || 'Failed to load Google Fonts');
        
        // Always provide fallback fonts when there's an error
        const fallbackFonts: FontOption[] = [
          { name: 'Inter', value: 'Inter, sans-serif', category: 'body' },
          { name: 'Roboto', value: 'Roboto, sans-serif', category: 'body' },
          { name: 'Open Sans', value: 'Open Sans, sans-serif', category: 'body' },
          { name: 'Montserrat', value: 'Montserrat, sans-serif', category: 'heading' },
          { name: 'Playfair Display', value: 'Playfair Display, serif', category: 'heading' },
          { name: 'Lato', value: 'Lato, sans-serif', category: 'body' },
          { name: 'Poppins', value: 'Poppins, sans-serif', category: 'body' },
          { name: 'Raleway', value: 'Raleway, sans-serif', category: 'body' },
          { name: 'Oswald', value: 'Oswald, sans-serif', category: 'heading' },
          { name: 'Merriweather', value: 'Merriweather, serif', category: 'heading' },
        ];
        
        // Always show fallback fonts if there's an error, regardless of page
        if (currentPage === 1) {
          setFonts(fallbackFonts);
          setHasMore(false);
        }
        
        // Load the fallback fonts for preview
        loadFontPreviews(fallbackFonts);
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
      }
    };
    
    fetchFonts();
  }, [currentPage, debouncedSearchTerm]);
    // Intersection observer for infinite scrolling
  useEffect(() => {
    // Only setup the observer when the popover is open
    if (!isPopoverOpen) return;
    
    // Add a small delay to ensure the DOM is fully rendered
    const timeoutId = setTimeout(() => {
      // Disconnect previous observer if it exists
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      // Find the scrollable container - CommandList has a fixed height with overflow
      const scrollContainer = commandListRef.current;
      
      const options = {
        // Use the CommandList as the root (the scrollable container)
        root: scrollContainer,
        // Use a small positive rootMargin to trigger loading earlier
        rootMargin: '20px 0px',
        // Lower threshold - even slight visibility should trigger loading
        threshold: 0.1
      };
      
      // Create new observer
      observerRef.current = new IntersectionObserver((entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loadingMore && !initialLoading) {
          console.log('Loading more fonts...');
          setCurrentPage(prev => prev + 1);
        }
      }, options);
      
      // Observe the loader element
      if (loaderRef.current) {
        observerRef.current.observe(loaderRef.current);
      }
    }, 200); // Small delay to ensure DOM is ready
    
    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, initialLoading, isPopoverOpen]);
  
  // Function to load font previews in batches
  const loadFontPreviews = useCallback((fontOptions: FontOption[]) => {
    // Filter out fonts that we've already loaded
    const fontsToLoad = fontOptions.filter(font => !fontPreviewsLoaded.has(font.name));
    
    if (fontsToLoad.length === 0) return;
    
    // Create a new Set with previously loaded fonts and new ones
    const updatedLoadedFonts = new Set(fontPreviewsLoaded);
    fontsToLoad.forEach(font => updatedLoadedFonts.add(font.name));
    setFontPreviewsLoaded(updatedLoadedFonts);
    
    // Create stylesheet link
    const fontFamilies = fontsToLoad.map(font => font.name.replace(/\s/g, '+')).join('|');
    if (fontFamilies) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css?family=${fontFamilies}&display=swap`;
      document.head.appendChild(link);
    }
  }, [fontPreviewsLoaded]);
  
  // Function to handle font selection
  const handleFontSelect = (fontName: string) => {
    setSelectedFont(fontName);
    
    // Since we want heading and body to share the same font, update both
    setSelectedHeadingFont(fontName);
    setSelectedBodyFont(fontName);
    
    // Find the selected font
    const selectedFontOption = fonts.find(f => f.name === fontName);
    if (!selectedFontOption) return;
    
    // Update the theme variables in the builder context
    if (state.variables) {
      const updatedVariables = state.variables.map(variable => {
        if (variable.key === 'font-family-base' || variable.key === 'font-family-heading') {
          return {
            ...variable,
            primaryValue: selectedFontOption.value,
            secondaryValue: selectedFontOption.value
          };
        }
        return variable;
      });
      
      // Ensure the font is loaded for preview
      if (!fontPreviewsLoaded.has(fontName)) {
        const fontFamily = selectedFontOption.name.replace(/\s/g, '+');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css?family=${fontFamily}&display=swap`;
        document.head.appendChild(link);
        
        // Add to loaded fonts set
        setFontPreviewsLoaded(prev => new Set(prev).add(fontName));
      }
      
      updateBuilderState({ variables: updatedVariables });
    }
  };
  
  // Get the font value string for display
  const getSelectedFontValue = (fontName: string): string => {
    const font = fonts.find(f => f.name === fontName);
    return font ? font.value : `"${fontName}", sans-serif`;
  };

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
      
      {/* Font search dropdown */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Font</label>
        <Popover onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between"
              disabled={initialLoading}
            >
              {initialLoading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading fonts...
                </span>
              ) : (
                selectedFont || "Select font..."
              )}
              <Command className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <CommandPrimitive>
              <CommandInput
                placeholder="Search fonts..."
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList ref={commandListRef} className="max-h-[300px]">                <CommandEmpty>
                  {initialLoading ? (
                    <div className="py-2 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading fonts...</span>
                    </div>
                  ) : (
                    <span>No fonts found. Try different search terms.</span>
                  )}
                </CommandEmpty>
                {initialLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading Google Fonts...</p>
                  </div>
                ) : fonts.length > 0 ? (
                  <CommandGroup heading="Google Fonts">                    {fonts.map((font) => (
                      <CommandItem
                        key={font.name}
                        value={font.name}
                        onSelect={() => {
                          handleFontSelect(font.name);
                          setSearchTerm("");
                        }}
                        onMouseOver={() => {
                          // Load font preview when user hovers over the item
                          if (!fontPreviewsLoaded.has(font.name)) {
                            loadFontPreviews([font]);
                          }
                        }}
                      >
                        <span style={{ fontFamily: font.value }}>{font.name}</span>
                        {selectedFont === font.name && (
                          <CheckIcon className="ml-auto h-4 w-4" />
                        )}
                      </CommandItem>
                    ))}
                    
                    {/* Loader element at the bottom of the list */}
                    <div 
                      ref={loaderRef} 
                      className="p-2 text-center text-sm text-muted-foreground h-8"
                    >
                      {loadingMore ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading more...
                        </div>
                      ) : hasMore ? (
                        <span>Scroll for more</span>
                      ) : (
                        <span>End of font list</span>
                      )}
                    </div>                  </CommandGroup>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No fonts found. Try different search terms or refresh.
                  </div>
                )}
              </CommandList>
            </CommandPrimitive>
          </PopoverContent>
        </Popover>
      </div>

      <Separator />
      
      {/* Font Preview Section */}
      <div className="space-y-4">
        <h4 className="font-medium">Font Preview</h4>
        <div className="border rounded-md p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">{selectedFont}</p>
              <p className="text-xs text-muted-foreground">Used for headings and body text</p>
            </div>
          </div>
          <div className="space-y-2 p-4 bg-muted/30 rounded-md">
            <div style={{ fontFamily: getSelectedFontValue(selectedFont) }}>
              <p style={{ fontSize: '2rem', lineHeight: '1.2' }} className="font-bold">The quick brown fox jumps</p>
              <p style={{ fontSize: '1.5rem', lineHeight: '1.3' }} className="font-semibold">Over the lazy dog 123</p>
              <p style={{ fontSize: '1.2rem', lineHeight: '1.4' }} className="font-medium">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
              <p className="mt-4 mb-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vitae elit libero, a pharetra augue.</p>
              <p className="text-sm opacity-80">
                The quick brown fox jumps over the lazy dog. 
                This text demonstrates the font in a standard paragraph format with a good amount of content.
              </p>
              <p className="text-xs mt-2">abcdefghijklmnopqrstuvwxyz 1234567890</p>
            </div>
          </div>
          <div className="mt-3 text-xs flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 rounded-full bg-primary flex-shrink-0"></div>
            <span>Using {selectedFont} for all text</span>
          </div>
        </div>
      </div>
    </div>
  )
}
