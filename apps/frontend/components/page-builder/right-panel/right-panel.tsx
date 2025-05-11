import BlockConfigForm from "./block-config-form/BlockConfigForm";
import { useLayoutContext } from "@/context/layout.context";
import { useBuilderContext } from "@/context/builder.context";
import PageOutline from "./page-outline/PageOutline";
import { ScrollArea } from "@/components/ui/scroll-area";
import PropertyFormContainer from "./block-config-form/PropertyFormContainer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Layers, RefreshCw} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function RightPanel() {
  const { state, updateLayoutState } = useLayoutContext();
  const { state: builderState, updateBuilderState } = useBuilderContext();
  const [view, setView] = useState<'properties' | 'outline'>('properties');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedBlockInfo, setSelectedBlockInfo] = useState<{
    name: string;
    type: string;
    hasError?: boolean;
  } | null>(null);
  
  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Escape key to close the panel
      if (e.key === 'Escape' && state.showRightPanel) {
        // Check for unsaved changes
        if (hasUnsavedChanges) {
          const confirmClose = window.confirm("You have unsaved changes. Are you sure you want to close?");
          if (!confirmClose) return;
        }
        
        updateLayoutState({ showRightPanel: false });
      }
      
      // Alt+1 for Properties view, Alt+2 for Outline view
      if (e.altKey && state.showRightPanel) {
        if (e.key === '1') {
          setView('properties');
        } else if (e.key === '2') {
          setView('outline');
        }
      }
      
      // Ctrl+S to save changes (prevent browser save dialog)
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && state.showRightPanel) {
        e.preventDefault();
        if (view === 'properties' && selectedBlockInfo) {
          // Dispatch a custom event to trigger save in BlockConfigForm
          window.dispatchEvent(new CustomEvent('save-block-form'));
          setHasUnsavedChanges(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.showRightPanel, updateLayoutState, hasUnsavedChanges, view, selectedBlockInfo]);
  
  useEffect(() => {
    const loadBlockInfo = async () => {
      if (!builderState.selectedBlockId) {
        setSelectedBlockInfo(null);
        return;
      }
      
      setIsLoading(true);
      
      const selectedBlock = builderState.blocks.find(
        (block) => block.instance_id === builderState.selectedBlockId
      );
      
      if (!selectedBlock) {
        setSelectedBlockInfo(null);
        setIsLoading(false);
        return;
      }

      try {
        // Get block properties from the registry
        const properties = await import('@repo/ui/blocks')
          .then(module => module.getBlockProperties(selectedBlock.folderName, selectedBlock.subFolder));
          
        if (properties) {
          setSelectedBlockInfo({
            name: properties.name || `${selectedBlock.folderName}/${selectedBlock.subFolder}`,
            type: selectedBlock.instance ? 'Linked Component' : 'Component'
          });
        } else {
          setSelectedBlockInfo({
            name: `${selectedBlock.folderName}/${selectedBlock.subFolder}`,
            type: 'Component'
          });
        }
      } catch (err) {
        console.error('Error loading block info:', err);
        setSelectedBlockInfo({
          name: `${selectedBlock.folderName}/${selectedBlock.subFolder}`,
          type: 'Component',
          hasError: true
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBlockInfo();
  }, [builderState.selectedBlockId, builderState.blocks]);

  const handleClosePanel = () => {
    // Check if we have unsaved changes and should prompt the user
    if (hasUnsavedChanges && view === 'properties' && selectedBlockInfo) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to close this panel?');
      if (!confirm) return;
    }
    
    // If user confirms or no unsaved changes, close panel
    updateLayoutState({ showRightPanel: false });
  };
  
  const handleRefreshBlocks = () => {
    const currentId = builderState.selectedBlockId;
    updateBuilderState({ selectedBlockId: null });
    setTimeout(() => {
      updateBuilderState({ selectedBlockId: currentId });
    }, 100);
  };
  
  // Toggle between views
  const handleViewChange = (newView: 'properties' | 'outline') => {
    setView(newView);
  };

  const optimizedRefreshBlocks = () => {
    let requestId: number | null = null;
    
    return () => {
      if (requestId !== null) {
        cancelAnimationFrame(requestId);
      }
      
      requestId = requestAnimationFrame(() => {
        handleRefreshBlocks();
        requestId = null;
      });
    };
  };
  
  const debouncedRefreshBlocks = optimizedRefreshBlocks();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    // Listen for the custom event that the BlockConfigForm will dispatch
    const handleFormChanged = (e: CustomEvent) => {
      setHasUnsavedChanges(e.detail.hasChanges);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('block-form-changed' as any, handleFormChanged);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('block-form-changed' as any, handleFormChanged);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    // Reset unsaved changes when block selection changes
    setHasUnsavedChanges(false);
  }, [builderState.selectedBlockId]);

  return (
    <>
      <aside
        className={
          `w-[400px] border-l border-divider h-[calc(100vh-4rem)] bg-content1 
           transition-all duration-300 ease-in-out resize-x overflow-hidden max-w-[600px] min-w-[300px]
           ${state.showRightPanel ? 'translate-x-0' : 'translate-x-full fixed right-0'}`
        }
      >
        <PropertyFormContainer
          leftComponent={
            <div className='truncate'>
              <h3 className="text-md font-semibold truncate">
                {view === 'properties' ? 'Block Properties' : 'Page Outline'}
              </h3>
              <div className="flex items-center gap-1">
                {view === 'properties' && selectedBlockInfo && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground select-none truncate">
                        {selectedBlockInfo.name} · {selectedBlockInfo.type}
                      </p>
                      {hasUnsavedChanges && (
                        <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" 
                              title="Unsaved changes" />
                      )}
                    </div>
                    {selectedBlockInfo.hasError && (
                      <Badge variant="destructive" className="text-[10px] py-0 px-1">Error</Badge>
                    )}
                  </div>
                )}
                {view === 'outline' && (
                  <p className="text-xs text-muted-foreground select-none truncate">
                    Drag to reorder blocks
                  </p>
                )}
                {view === 'properties' && !selectedBlockInfo && (
                  <p className="text-xs text-muted-foreground select-none truncate">
                    No block selected
                  </p>
                )}
              </div>
            </div>
          }
          rightComponent={
            <div className="flex items-center gap-2">
              <Select value={view} onValueChange={(value: 'properties' | 'outline') => handleViewChange(value)}>
                <SelectTrigger className="w-[130px]" size="sm">
                  <SelectValue placeholder="Select View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="properties">
                    <div className="flex items-center gap-2">
                      Properties
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">Alt+1</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="outline">
                    <div className="flex items-center gap-2">
                      Outline
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">Alt+2</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {view === 'properties' && selectedBlockInfo && hasUnsavedChanges && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('save-block-form'));
                          setHasUnsavedChanges(false);
                        }}
                      >
                        Save
                        <Badge variant="outline" className="ml-1 text-[8px] py-0 px-1">Ctrl+S</Badge>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Save changes (Ctrl+S)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {view === 'outline' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={debouncedRefreshBlocks}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Refresh blocks</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
            </div>
          }
        >
          <ScrollArea className="h-[calc(var(--panel-body-height))]">
            <div className="pt-2 pb-8 mr-4 pl-2 relative">
              <AnimatePresence mode="wait">
                {view === 'properties' ? (
                  <motion.div
                    key="properties"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    {isLoading ? (
                      <div className="p-4 space-y-4">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                        <div className="space-y-3">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-20 w-full" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                    ) : selectedBlockInfo ? (
                      <>
                        {selectedBlockInfo.hasError && (
                          <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-3 mb-4">
                            <p className="text-sm text-red-700 dark:text-red-400">
                              There was an error loading some properties for this block. Some functionality may be limited.
                            </p>
                          </div>
                        )}
                        <BlockConfigForm />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground mt-8">
                        <div className="h-12 w-12 mb-4 opacity-50 flex items-center justify-center border border-dashed rounded-full p-2">
                          <Layers className="h-6 w-6" />
                        </div>
                        <p className="mb-2 text-lg font-medium">No Block Selected</p>
                        <p className="text-sm max-w-xs">
                          Select a block in the page builder to view and edit its properties
                        </p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="outline"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    <PageOutline />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </PropertyFormContainer>
      </aside>
    </>
  );
}
