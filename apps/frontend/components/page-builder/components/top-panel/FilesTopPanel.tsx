import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import TopPanelContainer from './TopPanelContainer';
import { FolderIcon, FileIcon, ImageIcon, FileTextIcon, FilmIcon, Upload, MoreHorizontal, 
  Search, Grid3X3, List, Download, Trash2, Edit, Share2, Star, Copy, 
  ArrowUpDown, SlidersHorizontal, CheckCircle2, Filter, Loader2 } from 'lucide-react';
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
import { useBuilderContext } from '@/context/builder.context';
import { getProjectFiles, uploadProjectFiles, deleteProjectFiles } from '@/lib/files-api';
import { FileData, FileListResponse } from '@halogen/common';
import { useInView } from 'react-intersection-observer';
import { toast } from 'sonner';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SortOption = 'name' | 'size' | 'date' | 'type';

export default function FilesTopPanel({ show, onHide }: { show: boolean; onHide: () => void }) {
  const { state: { project } } = useBuilderContext();
  const projectId = project?._id;

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  const loadFiles = useCallback(async (page = 1, replace = true, search?: string) => {
    if (!projectId) return;
    
    try {
      if (replace) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      const response = await getProjectFiles(projectId, {
        page,
        limit: 20,
        search: search || searchTerm,
        sort: `${sortOrder === 'desc' ? '-' : ''}${sortBy}`
      });
      
      if (replace) {
        setFiles(response.docs);
      } else {
        setFiles(prev => [...prev, ...response.docs]);
      }
      
      setHasNextPage(response.hasNextPage);
      setPage(response.page);
      setError(null);
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Failed to load files');
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [projectId, searchTerm, sortBy, sortOrder]);

  // Initial load
  useEffect(() => {
    if (projectId && show) {
      loadFiles(1, true);
    }
  }, [projectId, show, loadFiles]);

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isLoadingMore && !isLoading) {
      loadFiles(page + 1, false);
    }
  }, [inView, hasNextPage, isLoadingMore, isLoading, page, loadFiles]);
  
  // Handle search and sort changes
  useEffect(() => {
    if (projectId && show) {
      const debounceTimer = setTimeout(() => {
        loadFiles(1, true, searchTerm);
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, sortBy, sortOrder, projectId, show, loadFiles]);

  // Filter and sort files
  const sortedAndFilteredFiles = useMemo(() => {
    return files;
  }, [files]);

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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!projectId) return;
    
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      
      try {
        const filesArray = Array.from(e.target.files);
        const response = await uploadProjectFiles(projectId, filesArray);
        
        if (response.files.length > 0) {
          toast.success(`Successfully uploaded ${response.files.length} files`);
          // Refresh the file list after upload
          loadFiles(1, true);
        }
        
        if (response.errors.length > 0) {
          response.errors.forEach(error => {
            toast.error(`Failed to upload ${error.name}: ${error.error}`);
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload files');
      } finally {
        setIsUploading(false);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!projectId) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setIsUploading(true);
      
      try {
        const filesArray = Array.from(e.dataTransfer.files);
        const response = await uploadProjectFiles(projectId, filesArray);
        
        if (response.files.length > 0) {
          toast.success(`Successfully uploaded ${response.files.length} files`);
          loadFiles(1, true);
        }
        
        if (response.errors.length > 0) {
          response.errors.forEach(error => {
            toast.error(`Failed to upload ${error.name}: ${error.error}`);
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload files');
      } finally {
        setIsUploading(false);
      }
    }
  }, [projectId, loadFiles]);

  const handleFileAction = useCallback((action: string, fileId: string) => {
    console.log(`${action} file with ID: ${fileId}`);
    
    if (action === 'download') {
      const file = files.find(f => f._id === fileId);
      if (file && file.downloadUrl) {
        const anchor = document.createElement('a');
        anchor.href = file.downloadUrl;
        anchor.download = file.name;
        anchor.target = '_blank';
        anchor.click();
      }
    } else if (action === 'delete') {
      setFilesToDelete([fileId]);
      setDeleteDialogOpen(true);
    }
  }, [files]);

  const handleDeleteFiles = async () => {
    if (!projectId || filesToDelete.length === 0) return;
    
    setIsDeleting(true);
    try {
      await deleteProjectFiles(projectId, filesToDelete);
      toast.success(`Successfully deleted ${filesToDelete.length} files`);
      
      setFiles(prev => prev.filter(file => !filesToDelete.includes(file._id)));
      
      setSelectedFiles(prev => prev.filter(id => !filesToDelete.includes(id)));
      
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete files');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setFilesToDelete([]);
    }
  };

  const handleBulkAction = useCallback((action: string) => {
    if (action === 'clear') {
      clearSelections();
    } else if (action === 'download') {
      
      selectedFiles.forEach(fileId => {
        handleFileAction('download', fileId);
      });
    } else if (action === 'delete') {
      setFilesToDelete(selectedFiles);
      setDeleteDialogOpen(true);
    }
  }, [selectedFiles, clearSelections, handleFileAction]);

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
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
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

  // File skeleton loader for grid view
  const FileGridSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array(12).fill(0).map((_, index) => (
        <Card key={index} className="overflow-hidden border">
          <div className="h-36 bg-muted/30 flex items-center justify-center">
            <Skeleton className="h-20 w-20 rounded-md" />
          </div>
          <div className="p-3">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  );

  const FileListSkeleton = () => (
    <div className="overflow-hidden rounded-lg border">
      <Table className="[&_tr:last-child_td]:border-0">
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-muted/40">
            <TableHead className="w-[50px] text-center">
              <div className="flex items-center h-4 justify-center"></div>
            </TableHead>
            <TableHead className="w-[40%]">
              <span className="font-medium text-foreground">Name</span>
            </TableHead>
            <TableHead>
              <span className="font-medium text-foreground">Type</span>
            </TableHead>
            <TableHead>
              <span className="font-medium text-foreground">Size</span>
            </TableHead>
            <TableHead>
              <span className="font-medium text-foreground">Modified</span>
            </TableHead>
            <TableHead className="text-right">
              <span className="font-medium text-foreground">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array(6).fill(0).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="text-center py-3">
                <div className="flex items-center justify-center">
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
              </TableCell>
              <TableCell className="py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-md flex-shrink-0" />
                  <Skeleton className="h-5 w-40" />
                </div>
              </TableCell>
              <TableCell className="py-3">
                <Skeleton className="h-6 w-20" />
              </TableCell>
              <TableCell className="py-3">
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="py-3">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

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
    <>
      <TopPanelContainer
        heading="Files"
        onClose={onHide}
        show={show}
        withoutFirstColumn={true}
        secondColumnHeaderContent={headerContent}
        setList={[]}
        activeSetId={null}
        onSetActiveSet={() => {}}
        breadcrumbs={breadcrumbs}
      >
        <div 
          className={cn(
            "relative p-4 h-full select-none",
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
          
          {/* Error state */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-72 text-center">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-xl font-medium text-red-700 dark:text-red-400">Error loading files</h3>
                <p className="text-red-600 dark:text-red-300 mt-2">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => loadFiles(1, true)}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {/* Loading state */}
          {isLoading && (viewMode === 'grid' ? <FileGridSkeleton /> : <FileListSkeleton />)}
          
          {/* Empty state */}
          {!isLoading && !error && sortedAndFilteredFiles.length === 0 && (
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
          )}
          
          {/* Grid view */}
          {!isLoading && !error && sortedAndFilteredFiles.length > 0 && viewMode === 'grid' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              <AnimatePresence>
                {sortedAndFilteredFiles.map((file) => (
                  <motion.div
                    key={file._id}
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
                            "group overflow-hidden border cursor-pointer p-0 transition-all duration-200",
                            isFileSelected(file._id) 
                              ? "border-primary ring-2 ring-primary/20" 
                              : "hover:border-primary/30 hover:shadow-md"
                          )}
                        >
                          <div 
                            className="h-36 bg-muted/30 flex items-center justify-center overflow-hidden relative"
                            onClick={(e) => {
                              if (e.ctrlKey || e.metaKey) {
                                toggleFileSelection(file._id);
                              }
                            }}
                          >
                            {file.thumbnailUrl ? (
                              <div className="w-full h-full">
                                <img
                                  src={file.thumbnailUrl}
                                  alt={file.name}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-6 group-hover:scale-110 transition-transform duration-300">
                                {getFileIcon(file.mimeType)}
                                <div className="mt-3 text-xs font-medium uppercase text-muted-foreground">
                                  {getFileTypeLabel(file.mimeType)}
                                </div>
                              </div>
                            )}
                            
                            {/* Selection indicator */}
                            {isFileSelected(file._id) && (
                              <div className="absolute top-2 left-2">
                                <div className="bg-primary text-primary-foreground rounded-full p-1">
                                  <CheckCircle2 className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                            
                            <div 
                              className="absolute inset-0 z-10"
                              onClick={() => toggleFileSelection(file._id)}
                              onDoubleClick={() => handleFileAction('download', file._id)}
                            ></div>
                          </div>
                          
                          <div className="p-3">
                            <div className="flex justify-between items-start">
                              <div className="truncate max-w-[80%]">
                                <p className="font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <span>{formatFileSize(file.size)}</span>
                                  <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50"></span>
                                  <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                                </p>
                              </div>
                              <Badge 
                                variant="secondary" 
                                className="text-xs font-normal"
                              >
                                {getFileTypeLabel(file.mimeType)}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      </ContextMenuTrigger>
                      
                      <ContextMenuContent className="w-48">
                        <ContextMenuItem onClick={() => toggleFileSelection(file._id)}>
                          <CheckCircle2 className={cn(
                            "mr-2 h-4 w-4", 
                            isFileSelected(file._id) && "text-primary"
                          )} /> 
                          {isFileSelected(file._id) ? 'Deselect' : 'Select'}
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => handleFileAction('download', file._id)}>
                          <Download className="mr-2 h-4 w-4" /> Download
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem 
                          onClick={() => handleFileAction('delete', file._id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
            {/* List view */}
          {!isLoading && !error && sortedAndFilteredFiles.length > 0 && viewMode === 'list' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden rounded-lg border"
            >
              <Table className="[&_tr:last-child_td]:border-0">
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/40">
                    <TableHead className="w-[50px] text-center">
                      <div className="flex items-center h-4 justify-center"></div>
                    </TableHead>
                    <TableHead className="w-[40%]">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">Name</span>
                        {sortBy === 'name' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 ml-1 rounded-full" 
                            onClick={toggleSortOrder}
                          >
                            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">Type</span>
                        {sortBy === 'type' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 ml-1 rounded-full" 
                            onClick={toggleSortOrder}
                          >
                            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">Size</span>
                        {sortBy === 'size' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 ml-1 rounded-full" 
                            onClick={toggleSortOrder}
                          >
                            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">Modified</span>
                        {sortBy === 'date' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 ml-1 rounded-full" 
                            onClick={toggleSortOrder}
                          >
                            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className="font-medium text-foreground">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFilteredFiles.map((file) => (
                    <TableRow
                      key={file._id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isFileSelected(file._id) 
                          ? "bg-primary/5 hover:bg-primary/10 data-[state=selected]:bg-primary/5" 
                          : "hover:bg-muted/40"
                      )}
                      onClick={() => toggleFileSelection(file._id)}
                      onDoubleClick={() => handleFileAction('download', file._id)}
                    >
                      <TableCell className="text-center py-3">
                        <div className="flex items-center justify-center h-5">
                          <div className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                            isFileSelected(file._id) 
                              ? "border-primary bg-primary text-primary-foreground" 
                              : "border-muted-foreground/30"
                          )}>
                            {isFileSelected(file._id) && <CheckCircle2 className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 bg-muted/30 rounded-md p-1.5 w-9 h-9 flex items-center justify-center">
                            {getFileIcon(file.mimeType)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate max-w-[240px]">{file.name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className="font-normal bg-muted/50">
                          {getFileTypeLabel(file.mimeType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm py-3">
                        {formatFileSize(file.size)}
                      </TableCell>
                      <TableCell className="text-sm py-3">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction('download', file._id);
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
                                className="h-8 w-8 rounded-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleFileAction('download', file._id)}>
                                <Download className="mr-2 h-4 w-4" /> Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleFileAction('delete', file._id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          )}
          
          {/* Load more indicator/spinner */}
          {!isLoading && hasNextPage && (
            <div 
              ref={loadMoreRef} 
              className="flex justify-center py-4 mt-2"
            >
              {isLoadingMore && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading more...</span>
                </div>
              )}
            </div>
          )}
          
          {/* Selection controls floating bar */}
          <AnimatePresence>
            {selectedFiles.length > 0 && <SelectionControls />}
          </AnimatePresence>
        </div>
      </TopPanelContainer>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {filesToDelete.length > 1 ? `${filesToDelete.length} files` : 'file'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. {filesToDelete.length > 1 
                ? `These ${filesToDelete.length} files will be permanently deleted from the server.` 
                : 'This file will be permanently deleted from the server.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteFiles}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}