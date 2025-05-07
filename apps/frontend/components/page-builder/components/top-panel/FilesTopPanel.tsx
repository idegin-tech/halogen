import React, { useState, useMemo } from 'react';
import TopPanelContainer from './TopPanelContainer';
import { FolderIcon, FileIcon, ImageIcon, FileTextIcon, FilmIcon, Upload, MoreHorizontal, Search, Grid3X3, List, Download, Trash2, Edit, Share2, Star, Copy } from 'lucide-react';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatFileSize } from '@/lib/utils';

// File type for our mock data
type FileItem = {
  id: string;
  name: string;
  type: string;
  size: number;
  thumbnail?: string;
  lastModified: string;
};

export default function FilesTopPanel({ show, onHide }: { show: boolean; onHide: () => void }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for files
  const mockFiles: FileItem[] = useMemo(() => [
    {
      id: '1',
      name: 'hero-image.jpg',
      type: 'image/jpeg',
      size: 1200000,
      thumbnail: '/placeholder.jpg',
      lastModified: '2025-05-01'
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

  // Filter files based on search term
  const filteredFiles = useMemo(() => {
    return mockFiles.filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [mockFiles, searchTerm]);

  // Function to get the appropriate icon for a file type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6" />;
    } else if (fileType.startsWith('video/')) {
      return <FilmIcon className="h-6 w-6" />;
    } else if (fileType.includes('document') || fileType.includes('pdf')) {
      return <FileTextIcon className="h-6 w-6" />;
    } else {
      return <FileIcon className="h-6 w-6" />;
    }
  };

  // Header content for the second column with search and upload button
  const headerContent = (
    <>
      <div className="relative flex-1 max-w-md mr-4">
        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex items-center border rounded-md overflow-hidden">
        <Button
          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-9 w-9 rounded-none"
          onClick={() => setViewMode('grid')}
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-9 w-9 rounded-none"
          onClick={() => setViewMode('list')}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
      <Button variant="default" className="flex items-center gap-2">
        <Upload className="h-4 w-4" /> Upload
      </Button>
    </>
  );

  // Breadcrumb items
  const breadcrumbs = useMemo(() => {
    return [
      { label: "Files", href: "#" },
      { label: "Media" }
    ];
  }, []);

  // File context menu items and handling
  const handleFileAction = (action: string, fileId: string) => {
    console.log(`${action} file with ID: ${fileId}`);
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
      <div className="p-4">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-center gap-4">
            <div className="bg-muted/30 w-20 h-20 rounded-full flex items-center justify-center">
              <FileIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-medium">No files found</h3>
              <p className="text-muted-foreground">Try a different search term or upload new files</p>
            </div>
            <Button variant="outline" className="mt-2">
              <Upload className="mr-2 h-4 w-4" /> Upload files
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <ContextMenu key={file.id}>
                <ContextMenuTrigger>
                  <Card className="group overflow-hidden border cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all duration-200">
                    <div className="h-32 bg-muted/30 flex items-center justify-center overflow-hidden relative">
                      {file.thumbnail ? (
                        <div className="w-full h-full">
                          <img
                            src={file.thumbnail}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          {getFileIcon(file.type)}
                          <div className="mt-2 text-xs font-medium uppercase text-muted-foreground">
                            {file.type.split('/')[1]}
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleFileAction('download', file.id)}>
                              <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFileAction('rename', file.id)}>
                              <Edit className="mr-2 h-4 w-4" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFileAction('share', file.id)}>
                              <Share2 className="mr-2 h-4 w-4" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFileAction('delete', file.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="truncate max-w-[80%]">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                        {file.type.startsWith('image/') && (
                          <Badge variant="outline" className="text-xs">Image</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleFileAction('download', file.id)}>
                    <Download className="mr-2 h-4 w-4" /> Download
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleFileAction('rename', file.id)}>
                    <Edit className="mr-2 h-4 w-4" /> Rename
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleFileAction('favorite', file.id)}>
                    <Star className="mr-2 h-4 w-4" /> Favorite
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
          </div>
        ) : (
          <div className="overflow-hidden border rounded-md">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Size</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Modified</th>
                  <th className="text-right py-3 px-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <ContextMenu key={file.id}>
                    <ContextMenuTrigger>
                      <tr className="border-b hover:bg-muted/20 transition-colors cursor-pointer">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {getFileIcon(file.type)}
                            <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {file.type.split('/')[1].toUpperCase()}
                        </td>
                        <td className="py-3 px-4">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="py-3 px-4">
                          {file.lastModified}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleFileAction('download', file.id)}>
                                <Download className="mr-2 h-4 w-4" /> Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleFileAction('rename', file.id)}>
                                <Edit className="mr-2 h-4 w-4" /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleFileAction('share', file.id)}>
                                <Share2 className="mr-2 h-4 w-4" /> Share
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleFileAction('delete', file.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handleFileAction('download', file.id)}>
                        <Download className="mr-2 h-4 w-4" /> Download
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleFileAction('rename', file.id)}>
                        <Edit className="mr-2 h-4 w-4" /> Rename
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleFileAction('favorite', file.id)}>
                        <Star className="mr-2 h-4 w-4" /> Favorite
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
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TopPanelContainer>
  );
}