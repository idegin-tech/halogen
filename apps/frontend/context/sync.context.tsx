"use client";

import React, { createContext, useContext, useEffect, useCallback } from "react";
import { useBuilderContext } from "./builder.context";
import { BlockInstance, generateId, PageData } from "@halogen/common";
import { colorVariables, radiusVariables, variableSets } from "@/config/variables";
import { toast } from "sonner";

interface SyncContextInterface {
  isLoading: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
  syncToCloud: () => Promise<boolean>;
}

const SyncContext = createContext<SyncContextInterface | undefined>(undefined);

export function SyncProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const { state, updateBuilderState } = useBuilderContext();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSynced, setLastSynced] = React.useState<Date | null>(null);
  const [apiVariablesLoaded, setApiVariablesLoaded] = React.useState(false);

  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to load project data');
        }

        const projectData = await response.json();
        
        if (projectData.data) {
          const transformedData = transformAPIDataToFrontend(projectData.data);
          updateBuilderState(transformedData);
          
          // Set apiVariablesLoaded to true if we have variables from the API
          if (projectData.data.variables && projectData.data.variables.length > 0) {
            setApiVariablesLoaded(true);
          }
        }
      } catch (error) {
        console.error("Error loading project:", error);
        toast.error("Failed to load project data");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProject();
  }, [projectId]);

  const transformAPIDataToFrontend = (apiData: any) => {
    const { pages = [], blockInstances = [], variables = [] } = apiData;
    
    const pageLookup = new Map();
    pages.forEach((page: any) => {
      pageLookup.set(page._id, page.page_id);
    });
    
    const blockLookup = new Map();
    blockInstances.forEach((block: any) => {
      blockLookup.set(block._id, block);
    });
    
    const transformedBlocks = blockInstances.map((block: any) => {
      return {
        id: block.instance_id,
        instance_id: block.instance_id,
        page_id: block.page_id,
        index: block.index,
        page: block.page_id,
        folderName: block.folderName,
        subFolder: block.subFolder,
        value: block.value,
        instance: block.instance
      };
    });
    
    transformedBlocks.forEach((block:BlockInstance) => {
      if (block.instance) {
        const instanceBlock = blockLookup.get(block.instance);
        if (instanceBlock) {
          block.instance = instanceBlock.instance_id;
        }
      }
    });

    const frontendPages = pages.map((page: any) => ({
      page_id: page.page_id,
      name: page.name,
      path: page.path || '/',
      isStatic: page.isStatic,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt
    }));

    const currentSelectedPageId = state.selectedPageId;
    
    const selectedPageExists = frontendPages.some((page:PageData) => page.page_id === currentSelectedPageId);
    const newSelectedPageId = selectedPageExists ? currentSelectedPageId : (frontendPages.length > 0 ? frontendPages[0].page_id : null);
    
    // Transform the variables from the API
    const transformedVariables = variables.map((variable: any) => ({
      variable_id: variable.variable_id,
      name: variable.name,
      key: variable.key,
      type: variable.type,
      primaryValue: variable.primaryValue,
      secondaryValue: variable.secondaryValue || variable.primaryValue,
      variableSet: variable.variableSet
    }));

    // Always include the API variable sets
    const apiVariableSets = Array.isArray(apiData.variableSets) ? apiData.variableSets : [];
    
    return {
      project: apiData,
      pages: frontendPages,
      variables: transformedVariables, // API variables have priority
      variableSets: apiVariableSets.length > 0 ? apiVariableSets : [...variableSets],
      blocks: transformedBlocks,
      selectedPageId: newSelectedPageId
    };
  };

  useEffect(() => {
    // Only use default variables if API call is complete AND no variables were loaded
    if (!isLoading && !apiVariablesLoaded) {
      // Check if there are no variables or variable sets from the API
      if (state.variableSets.length === 0 || state.variables.length === 0) {
        console.log("Loading default variables and variable sets");
        updateBuilderState({
          variableSets: [...variableSets],
          variables: [...colorVariables, ...radiusVariables],
        });
      }
    }
  }, [isLoading, apiVariablesLoaded, state.variableSets.length, state.variables.length, updateBuilderState]);

  useEffect(() => {
    if (!isLoading && state.pages.length > 0 && !state.selectedPageId) {
      updateBuilderState({
        selectedPageId: state.pages[0].page_id
      });
    }
  }, [isLoading, state.pages, state.selectedPageId, updateBuilderState]);

  const syncToCloud = useCallback(async (): Promise<boolean> => {
    if (!projectId || !state.project) {
      toast.error("Project data is not available");
      return false;
    }

    setIsSyncing(true);
    try {
      const pageMap = new Map();
      state.pages.forEach(page => {
        pageMap.set(page.page_id, page);
      });
      
      const blocksWithIds = state.blocks.map(block => {
        const id = block.instance_id || generateId();
        
        const pageId = block.page_id || 
                      (typeof block.page === 'string' ? block.page : block.page?.page_id) || 
                      state.selectedPageId;
                      
        if (pageId && !pageMap.has(pageId)) {
          console.warn(`Block references page_id ${pageId} which doesn't exist`);
        }
        
        return {
          ...block,
          id,
          instance_id: id,
          page_id: pageId,
        };
      });

      const syncData = {
        project: {
          name: state.project.name,
          description: state.project.description || "",
          thumbnail: state.project.thumbnail
        },
        pages: state.pages.map(page => ({
          page_id: page.page_id,
          name: page.name,
          path: page.path || '/',
          slug: page.slug,
          route: page.route,
          isStatic: page.isStatic
        })),
        variables: state.variables.map(variable => ({
          variable_id: variable.variable_id,
          name: variable.name,
          key: variable.key,
          type: variable.type,
          primaryValue: variable.primaryValue,
          secondaryValue: variable.secondaryValue || variable.primaryValue,
          variableSet: typeof variable.variableSet === 'string' ? variable.variableSet : variable.variableSet.set_id
        })),
        blocks: blocksWithIds.map(block => ({
          instance_id: block.id,
          page_id: block.page_id,
          index: block.index,
          page: block.page_id,
          folderName: block.folderName,
          subFolder: block.subFolder,
          value: block.value,
          instance: block.instance
        }))
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(syncData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sync project');
      }

      const result = await response.json();
      toast.success("Project synced successfully");
      setLastSynced(new Date());
      return true;
    } catch (error) {
      console.error("Error syncing to cloud:", error);
      toast.error(error instanceof Error ? error.message : "Failed to sync project");
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [projectId, state.project, state.pages, state.variables, state.blocks]);

  const contextValue: SyncContextInterface = {
    isLoading,
    isSyncing,
    lastSynced,
    syncToCloud
  };

  return (
    <SyncContext.Provider value={contextValue}>{children}</SyncContext.Provider>
  );
}

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSyncContext must be used within a SyncProvider");
  }
  return context;
}