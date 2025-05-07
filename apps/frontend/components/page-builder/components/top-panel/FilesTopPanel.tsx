import React, { useState, useMemo, useCallback, useRef } from 'react';
import TopPanelContainer from './TopPanelContainer';
import { FolderIcon, FileIcon, ImageIcon, FileTextIcon, FilmIcon, Upload, MoreHorizontal, 
  Search, Grid3X3, List, Download, Trash2, Edit, Share2, Star, Copy, 
  ArrowUpDown, SlidersHorizontal, CheckCircle2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatFileSize } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

// File type for our mock data
type FileItem = {
  id: string;
  name: string;
  type: string;
  size: number;
  thumbnail?: string;
  lastModified: string;
  favorite?: boolean;
};

type SortOption = 'name' | 'size' | 'date' | 'type';

export default function FilesTopPanel({ show, onHide }: { show: boolean; onHide: () => void }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data for files
  const mockFiles: FileItem[] = useMemo(() => [
    {
      id: '1',
      name: 'hero-image.jpg',
      type: 'image/jpeg',
      size: 1200000,
      thumbnail: '/placeholder.jpg',
      lastModified: '2025-05-01',
      favorite: true
    },
    {
      id: '2',
      name: 'project-documentation.pdf',
      type: 'application/pdf',
      size: 2500000,
      lastModified: '2025-05-02'
    },
    {
      id: '3',
      name: 'product-photo.png',
      type: 'image/png',
      size: 3400000,
      thumbnail: '/placeholder.jpg',
      lastModified: '2025-05-03'
    },
    {
      id: '4',
      name: 'intro-video.mp4',
      type: 'video/mp4',
      size: 15000000,
      lastModified: '2025-05-03'
    },
    {
      id: '5',
      name: 'presentation.pptx',
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      size: 5600000,
      lastModified: '2025-05-04'
    },
    {
      id: '6',
      name: 'company-logo.svg',
      type: 'image/svg+xml',
      size: 245000,
      thumbnail: '/placeholder.jpg',
      lastModified: '2025-05-05'
    },
    {
      id: '7',
      name: 'annual-report.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 1800000,
      lastModified: '2025-05-05'
    },
    {
      id: '8',
      name: 'data-analysis.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 980000,
      lastModified: '2025-05-06'
    },
  ], []);

  // Filter and sort files
  const sortedAndFilteredFiles = useMemo(() => {
    const filtered = mockFiles.filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
          comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [mockFiles, searchTerm, sortBy, sortOrder]);

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Function to get the appropriate icon for a file type
  const getFileIcon = useCallback((fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6" />;
    } else if (fileType.startsWith('video/')) {
      return <FilmIcon className="h-6 w-6" />;
    } else if (fileType.includes('document') || fileType.includes('pdf')) {
      return <FileTextIcon className="h-6 w-6" />;
    } else {
      return <FileIcon className="h-6 w-6" />;
    }
  }, []);

  // Get file type label
  const getFileTypeLabel = useCallback((fileType: string) => {
    if (fileType.startsWith('image/')) {
      return 'Image';
    } else if (fileType.startsWith('video/')) {
      return 'Video';
    } else if (fileType.includes('pdf')) {
      return 'PDF';
    } else if (fileType.includes('document')) {
      return 'Document';
    } else if (fileType.includes('sheet')) {
      return 'Spreadsheet';
    } else if (fileType.includes('presentation')) {
      return 'Presentation';
    } else {
      return fileType.split('/')[1]?.toUpperCase() || 'File';
    }
  }, []);

  // File selection handlers
  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  }, []);

  const isFileSelected = useCallback((fileId: string) => {
    return selectedFiles.includes(fileId);
  }, [selectedFiles]);

  const clearSelections = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  // Handle file upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      
      // Simulate upload process
      setTimeout(() => {
        setIsUploading(false);
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    }
  };

  // Drag and drop handling
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Handle file drop
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setIsUploading(true);
      
      // Simulate upload process
      setTimeout(() => {
        setIsUploading(false);
      }, 2000);
    }
  }, []);

  // File action handling
  const handleFileAction = useCallback((action: string, fileId: string) => {
    console.log(`${action} file with ID: ${fileId}`);
    
    // Example implementation for favorite
    if (action === 'favorite') {
      // In a real app, you'd update the state or call an API
      console.log(`Toggled favorite for file ${fileId}`);
    }
  }, []);

  // Bulk actions for multiple selected files
  const handleBulkAction = useCallback((action: string) => {
    console.log(`${action} for files:`, selectedFiles);
    
    if (action === 'clear') {
      clearSelections();
    }
  }, [selectedFiles, clearSelections]);

  // Header content for the second column with search and upload button
  const headerContent = (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1 max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Sort Files</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <DropdownMenuRadioItem value="name">By Name</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="date">By Date</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="size">By Size</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="type">By Type</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={toggleSortOrder}>
            <ArrowUpDown className="mr-2 h-4 w-4" />
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className="flex items-center border rounded-md overflow-hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Grid view</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>List view</TooltipContent>
        </Tooltip>
      </div>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="default" 
            className="flex items-center gap-2"
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Skeleton className="h-4 w-4 rounded-full animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Upload
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Upload files</TooltipContent>
      </Tooltip>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload} 
        multiple 
      />
    </div>
  );

  // Breadcrumb items
  const breadcrumbs = useMemo(() => {
    return [
      { label: "Files", href: "#" },
      { label: "Media" }
    ];
  }, []);

  // Selection controls
  const SelectionControls = () => {
    if (selectedFiles.length === 0) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background border shadow-lg rounded-lg px-4 py-2 z-10 flex items-center gap-3"
      >
        <div className="font-medium text-sm">
          {selectedFiles.length} selected
        </div>
        <div className="h-4 w-px bg-border"></div>
        <Button variant="ghost" size="sm" onClick={() => handleBulkAction('download')}>
          <Download className="h-4 w-4 mr-1" /> Download
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleBulkAction('share')}>
          <Share2 className="h-4 w-4 mr-1" /> Share
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleBulkAction('delete')}>
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
        <Button variant="ghost" size="sm" className="ml-2" onClick={() => handleBulkAction('clear')}>
          Clear
        </Button>
      </motion.div>
    );
  };

  return (
    <TopPanelContainer
      heading="Files"
      onClose={onHide}
      show={show}
      withoutFirstColumn={true}
      secondColumnHeaderContent={headerContent}
      setList={[]}
      activeSetId={null}
      onSetActiveSet={() => {}}
      onRemoveSet={() => {}}
      onSetChange={() => {}}
      breadcrumbs={breadcrumbs}
    >
      <div 
        className={cn(
          "relative p-4 h-full",
          isDragging && "bg-primary/5 border-2 border-dashed border-primary/30"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="text-center p-6 rounded-lg">
              <Upload className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-medium">Drop files to upload</h3>
              <p className="text-muted-foreground mt-1">Files will be uploaded to the current folder</p>
            </div>
          </div>
        )}
        
        {sortedAndFilteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-center gap-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-muted/30 w-24 h-24 rounded-full flex items-center justify-center"
            >
              <FileIcon className="h-10 w-10 text-muted-foreground" />
            </motion.div>
            <div>
              <h3 className="text-xl font-medium">No files found</h3>
              <p className="text-muted-foreground mt-2">Try a different search term or upload new files</p>
            </div>
            <Button 
              variant="outline" 
              className="mt-2 group"
              onClick={handleUploadClick}
            >
              <Upload className="mr-2 h-4 w-4 group-hover:translate-y-[-2px] transition-transform" /> 
              Upload files
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {sortedAndFilteredFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  <ContextMenu>
                    <ContextMenuTrigger>
                      <Card 
                        className={cn(
                          "group overflow-hidden border cursor-pointer transition-all duration-200",
                          isFileSelected(file.id) 
                            ? "border-primary ring-2 ring-primary/20" 
                            : "hover:border-primary/30 hover:shadow-md"
                        )}
                      >
                        <div 
                          className="h-36 bg-muted/30 flex items-center justify-center overflow-hidden relative"
                          onClick={(e) => {
                            if (e.ctrlKey || e.metaKey) {
                              toggleFileSelection(file.id);
                            }
                          }}
                        >
                          {file.thumbnail ? (
                            <div className="w-full h-full">
                              <img
                                src={file.thumbnail}
                                alt={file.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-6 group-hover:scale-110 transition-transform duration-300">
                              {getFileIcon(file.type)}
                              <div className="mt-3 text-xs font-medium uppercase text-muted-foreground">
                                {getFileTypeLabel(file.type)}
                              </div>
                            </div>
                          )}
                          
                          {/* Selection indicator */}
                          {isFileSelected(file.id) && (
                            <div className="absolute top-2 left-2">
                              <div className="bg-primary text-primary-foreground rounded-full p-1">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                          
                          {/* Quick actions */}
                          <div className="absolute top-2 right-2 flex gap-1">
                            {file.favorite && (
                              <div className="bg-background/80 backdrop-blur-sm rounded-full p-1">
                                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                              </div>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleFileAction('download', file.id)}>
                                  <Download className="mr-2 h-4 w-4" /> Download
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFileAction('rename', file.id)}>
                                  <Edit className="mr-2 h-4 w-4" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFileAction('favorite', file.id)}>
                                  <Star className={cn("mr-2 h-4 w-4", file.favorite && "fill-yellow-500 text-yellow-500")} /> 
                                  {file.favorite ? 'Remove favorite' : 'Add to favorites'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFileAction('share', file.id)}>
                                  <Share2 className="mr-2 h-4 w-4" /> Share
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleFileAction('delete', file.id)} 
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {/* Selection overlay for click */}
                          <div 
                            className="absolute inset-0 z-10"
                            onClick={() => toggleFileSelection(file.id)}
                            onDoubleClick={() => handleFileAction('open', file.id)}
                          ></div>
                        </div>
                        
                        <div className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="truncate max-w-[80%]">
                              <p className="font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <span>{formatFileSize(file.size)}</span>
                                <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50"></span>
                                <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                              </p>
                            </div>
                            <Badge 
                              variant="secondary" 
                              className="text-xs font-normal"
                            >
                              {getFileTypeLabel(file.type)}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    </ContextMenuTrigger>
                    
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem onClick={() => toggleFileSelection(file.id)}>
                        <CheckCircle2 className={cn(
                          "mr-2 h-4 w-4", 
                          isFileSelected(file.id) && "text-primary"
                        )} /> 
                        {isFileSelected(file.id) ? 'Deselect' : 'Select'}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => handleFileAction('download', file.id)}>
                        <Download className="mr-2 h-4 w-4" /> Download
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleFileAction('rename', file.id)}>
                        <Edit className="mr-2 h-4 w-4" /> Rename
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleFileAction('favorite', file.id)}>
                        <Star className={cn("mr-2 h-4 w-4", file.favorite && "fill-yellow-500 text-yellow-500")} /> 
                        {file.favorite ? 'Remove favorite' : 'Add to favorites'}
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleFileAction('copy', file.id)}>
                        <Copy className="mr-2 h-4 w-4" /> Copy
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleFileAction('share', file.id)}>
                        <Share2 className="mr-2 h-4 w-4" /> Share
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem 
                        onClick={() => handleFileAction('delete', file.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-hidden border rounded-lg shadow-sm"
          >
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="w-6 pl-4 pr-0 py-3">
                    <div className="flex items-center h-4"></div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      Name
                      {sortBy === 'name' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5" 
                          onClick={toggleSortOrder}
                        >
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      Type
                      {sortBy === 'type' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5" 
                          onClick={toggleSortOrder}
                        >
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      Size
                      {sortBy === 'size' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5" 
                          onClick={toggleSortOrder}
                        >
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      Modified
                      {sortBy === 'date' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5" 
                          onClick={toggleSortOrder}
                        >
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {sortedAndFilteredFiles.map((file) => (
                    <ContextMenu key={file.id}>
                      <ContextMenuTrigger>
                        <motion.tr
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            "border-b transition-colors cursor-pointer",
                            isFileSelected(file.id) 
                              ? "bg-primary/5 hover:bg-primary/10" 
                              : "hover:bg-muted/30"
                          )}
                          onClick={() => toggleFileSelection(file.id)}
                          onDoubleClick={() => handleFileAction('open', file.id)}
                        >
                          <td className="pl-4 pr-0 py-2">
                            <div className="flex items-center h-6">
                              <div className={cn(
                                "w-4 h-4 rounded-sm border flex items-center justify-center transition-colors",
                                isFileSelected(file.id) 
                                  ? "border-primary bg-primary text-primary-foreground" 
                                  : "border-muted-foreground/30"
                              )}>
                                {isFileSelected(file.id) && <CheckCircle2 className="h-3 w-3" />}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-3">
                              {getFileIcon(file.type)}
                              <div className="flex flex-col">
                                <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                                {file.favorite && (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Star className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" /> Favorite
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            <Badge variant="outline" className="font-normal">
                              {getFileTypeLabel(file.type)}
                            </Badge>
                          </td>
                          <td className="py-2 px-4 text-sm">
                            {formatFileSize(file.size)}
                          </td>
                          <td className="py-2 px-4 text-sm">
                            {new Date(file.lastModified).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFileAction('download', file.id);
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download</TooltipContent>
                              </Tooltip>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleFileAction('rename', file.id)}>
                                    <Edit className="mr-2 h-4 w-4" /> Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleFileAction('favorite', file.id)}>
                                    <Star className={cn("mr-2 h-4 w-4", file.favorite && "fill-yellow-500 text-yellow-500")} />
                                    {file.favorite ? 'Remove favorite' : 'Add to favorites'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleFileAction('share', file.id)}>
                                    <Share2 className="mr-2 h-4 w-4" /> Share
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleFileAction('delete', file.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </motion.tr>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => toggleFileSelection(file.id)}>
                          <CheckCircle2 className={cn(
                            "mr-2 h-4 w-4", 
                            isFileSelected(file.id) && "text-primary"
                          )} /> 
                          {isFileSelected(file.id) ? 'Deselect' : 'Select'}
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => handleFileAction('download', file.id)}>
                          <Download className="mr-2 h-4 w-4" /> Download
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleFileAction('rename', file.id)}>
                          <Edit className="mr-2 h-4 w-4" /> Rename
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleFileAction('favorite', file.id)}>
                          <Star className={cn("mr-2 h-4 w-4", file.favorite && "fill-yellow-500 text-yellow-500")} />
                          {file.favorite ? 'Remove favorite' : 'Add to favorites'}
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleFileAction('copy', file.id)}>
                          <Copy className="mr-2 h-4 w-4" /> Copy
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleFileAction('share', file.id)}>
                          <Share2 className="mr-2 h-4 w-4" /> Share
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem 
                          onClick={() => handleFileAction('delete', file.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>
        )}
        
        {/* Selection controls floating bar */}
        <AnimatePresence>
          {selectedFiles.length > 0 && <SelectionControls />}
        </AnimatePresence>
      </div>
    </TopPanelContainer>
  );
}