'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImageIcon, LinkIcon, LoaderCircleIcon, X, Trash2, UploadIcon } from 'lucide-react';
import Image from 'next/image';
import { getProjectFiles } from '@/lib/files-api';
import { FileData, FileListResponse } from '@halogen/common';

interface ImageInputProps {
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    placeholder?: string;
    label?: string;
    description?: string;
}

export function ImageInput({
  value,
  onChange,
  onBlur,
  placeholder = 'Enter image URL or select from project',
  label,
  description,
}: ImageInputProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("url");
  const [urlInput, setUrlInput] = useState<string>(value || "");
  const [selectedImage, setSelectedImage] = useState<string>(value || "");
  const [previewHover, setPreviewHover] = useState<boolean>(false);

  useEffect(() => {
    setUrlInput(value || "");
    setSelectedImage(value || "");
  }, [value]);
  
  // State for handling project images with pagination
  const [projectImages, setProjectImages] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const projectId = "default"; // Replace with actual project ID from context
  
  // Reset pagination when tab changes or popover opens
  useEffect(() => {
    if (open && activeTab === 'project') {
      setPage(1);
      setProjectImages([]);
      setHasMore(true);
      fetchProjectImages(1, true);
    }
  }, [open, activeTab]);

  // Function to fetch images from the API
  const fetchProjectImages = async (pageNum: number, reset: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the API with image type filter
      const response = await getProjectFiles(projectId, {
        page: pageNum,
        limit: 12,
        type: 'image',
        sort: '-createdAt'
      });
      
      if (reset) {
        setProjectImages(response.docs);
      } else {
        setProjectImages(prev => [...prev, ...response.docs]);
      }
      
      setHasMore(response.hasNextPage);
      setPage(response.page);
    } catch (err) {
      console.error('Error fetching project images:', err);
      setError('Failed to load images. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Setup intersection observer for infinite scroll
  const lastImageElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchProjectImages(page + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, page]);

    const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrlInput(e.target.value);
    };

    const handleUrlInputBlur = () => {
        onChange(urlInput);
        onBlur();
    };

    const handleImageSelect = (imageUrl: string) => {
        setSelectedImage(imageUrl);
        onChange(imageUrl);
        onBlur();
        setOpen(false);
    };
    // Preview component for the selected image
    const ImagePreview = () => {
        if (!value) return null;

        return (
            <div
                className="mt-2 relative rounded-md overflow-hidden border border-border group transition-all"
                onMouseEnter={() => setPreviewHover(true)}
                onMouseLeave={() => setPreviewHover(false)}
            >
                <div className="aspect-video w-full relative">
                    <img
                        src={value}
                        alt="Selected image"
                        className="w-full h-full object-cover transition-transform duration-700 ease-in-out"
                    />

                    <div
                        className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity duration-200 ${previewHover ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 rounded-full bg-background/80 p-0 text-foreground backdrop-blur-sm hover:bg-background/90"
                            onClick={() => setOpen(true)}
                        >
                            <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 rounded-full bg-background/80 p-0 text-foreground backdrop-blur-sm hover:bg-background/90"
                            onClick={() => {
                                onChange("");
                                onBlur();
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </Button>
                    </div>
                </div>
            </div>
        );
    };
    return (
        <div className="grid gap-2">
            {label && <label className="text-sm font-medium text-foreground">{label}</label>}

            <div className="flex gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="shrink-0 border border-border/60 hover:border-primary/60 hover:bg-primary/10 hover:text-primary transition-all"
                            title="Browse images"
                        >
                            <ImageIcon className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-0 shadow-lg border border-border/60" align="end">
                        <div className="flex items-center justify-between border-b border-border/60 p-3">
                            <h4 className="font-medium">Select an image</h4>
                            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-7 w-7">
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <Tabs
                            defaultValue="url"
                            value={activeTab}
                            onValueChange={setActiveTab}
                            className="w-full"
                        >
                            <TabsList className="grid grid-cols-2 w-full rounded-none border-b border-border/60">
                                <TabsTrigger value="url" className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">URL</TabsTrigger>
                                <TabsTrigger value="project" className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">Project Images</TabsTrigger>
                            </TabsList>

                            <TabsContent value="url" className="p-4 border-none">
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Image URL</label>
                                        <Input
                                            placeholder="Enter image URL"
                                            value={urlInput}
                                            onChange={handleUrlInputChange}
                                            className="focus-visible:ring-primary/20"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleUrlInputBlur();
                                                    setOpen(false);
                                                }
                                            }}
                                        />
                                    </div>
                                    <Button
                                        className="w-full bg-primary hover:bg-primary/90"
                                        onClick={() => {
                                            handleUrlInputBlur();
                                            setOpen(false);
                                        }}
                                    >
                                        Use URL
                                    </Button>
                                </div>
                            </TabsContent>
                            <TabsContent value="project" className="p-0 border-none">
                                {isLoading ? (
                                    <div className="h-64 flex items-center justify-center">
                                        <LoaderCircleIcon className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : !projectImages || projectImages.length === 0 ? (
                                    <div className="h-64 flex flex-col items-center justify-center p-4">
                                        <div className="rounded-full bg-primary/10 p-3 mb-3">
                                            <ImageIcon className="h-8 w-8 text-primary" />
                                        </div>
                                        <p className="text-sm font-medium text-center">
                                            No images found
                                        </p>
                                        <p className="text-xs text-center text-muted-foreground mt-1 max-w-[250px]">
                                            Upload images in the Media section to use them here
                                        </p>                                        <Button variant="outline" size="sm" className="mt-4 border-primary/30 text-primary hover:bg-primary/10">
                                            <UploadIcon className="mr-1 h-3.5 w-3.5" />
                                            Upload Images
                                        </Button></div>
                                ) : (
                                    <div className="h-[320px] overflow-y-auto relative">
                                        <div className="grid grid-cols-3 gap-2 p-4">
                                            {projectImages.map((image, index) => {
                                                const isLastElement = index === projectImages.length - 1;
                                                return (
                                                    <div 
                                                        key={image._id} 
                                                        ref={isLastElement ? lastImageElementRef : undefined}
                                                        className="group relative"
                                                    >
                                                        <div
                                                            className={`
                                                              aspect-square relative border rounded-md overflow-hidden cursor-pointer 
                                                              transition-all hover:border-primary hover:shadow-sm
                                                              ${selectedImage === image.downloadUrl ? 'ring-2 ring-primary border-primary' : 'border-border/60'}
                                                            `}
                                                            onClick={() => handleImageSelect(image.downloadUrl)}
                                                        >
                                                            <img
                                                                src={image.thumbnailUrl || image.downloadUrl}
                                                                alt={image.name || 'Project image'}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            
                                                            {selectedImage === image.downloadUrl && (
                                                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-center mt-1 truncate text-muted-foreground">
                                                            {image.name}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        {/* Loading indicator at bottom during pagination */}
                                        {isLoading && projectImages.length > 0 && (
                                            <div className="p-4 flex justify-center">
                                                <LoaderCircleIcon className="h-6 w-6 animate-spin text-primary" />
                                            </div>
                                        )}
                                        
                                        {/* Error message */}
                                        {error && (
                                            <div className="p-4 text-center">
                                                <p className="text-xs text-red-500">{error}</p>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="mt-2" 
                                                    onClick={() => fetchProjectImages(page, false)}
                                                >
                                                    Try Again
                                                </Button>
                                            </div>
                                        )}
                                        
                                        {/* End of results message */}
                                        {!hasMore && !isLoading && projectImages.length > 0 && (
                                            <div className="p-4 text-center">
                                                <p className="text-xs text-muted-foreground">No more images</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </PopoverContent>
                </Popover>

                <div className="relative flex-1">
                    <Input
                        value={urlInput}
                        placeholder={placeholder}
                        onChange={handleUrlInputChange}
                        onBlur={handleUrlInputBlur}
                        className="pr-10 w-full border-border/60 hover:border-primary/60 focus-visible:ring-primary/20 transition-colors"
                    />
                    <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors rounded-full p-1"
                        onClick={() => onChange("")}
                        type="button"
                        title="Clear"
                    >
                        {value && <X className="h-3 w-3" />}
                    </button>
                </div>

            </div>

            <ImagePreview />

            {description && (
                <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
            )}

            {!value && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="mt-2 p-3 border border-dashed border-border/60 rounded-md flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer group"
                >
                    <div className="rounded-full bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                        <ImageIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-medium">Click to select an image</p>
                        <p className="text-xs opacity-70 mt-0.5">Upload or choose from your files</p>
                    </div>
                </button>
            )}
        </div>
    );
}
