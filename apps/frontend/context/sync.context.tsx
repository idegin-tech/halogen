"use client";

import React, {createContext, useContext, useEffect, useCallback} from "react";
import {useBuilderContext} from "./builder.context";
import {BlockInstance, generateId, PageData} from "@halogen/common";
import {colorVariables, radiusVariables, variableSets} from "@/config/variables";
import {toast} from "sonner";
import { useProjectContext } from "./project.context";

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
    const {state, updateBuilderState} = useBuilderContext();
    const { state: {project}} = useProjectContext();
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
                console.log('API response data:', {
                    hasData: !!projectData.data,
                    variables: projectData.data?.variables || [],
                    variablesCount: projectData.data?.variables?.length || 0,
                    pages: projectData.data?.pages?.length || 0,
                    project: projectData.data?.project || null
                });

                if (projectData.data) {
                    const hasApiVariables = projectData.data.variables && projectData.data.variables.length > 0;

                    if (!hasApiVariables) {
                        projectData.data.variables = [...colorVariables, ...radiusVariables];

                        if (!projectData.data.variableSets || projectData.data.variableSets.length === 0) {
                            projectData.data.variableSets = [...variableSets];
                        }
                    }

                    const transformedData = transformAPIDataToFrontend(projectData.data);
                    updateBuilderState(transformedData);

                    setApiVariablesLoaded(true);
                }
            } catch (error) {
                console.error("Error loading project:", error);
                toast.error("Failed to load project data");

                if (state.variables.length === 0) {
                    updateBuilderState({
                        variableSets: [...variableSets],
                        variables: [...colorVariables, ...radiusVariables],
                    });
                    setApiVariablesLoaded(true);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadProject();
    }, [projectId]);

    useEffect(() => {
        if (!isLoading && !apiVariablesLoaded && state.variables.length === 0) {
            console.log('No variables found after API load, using fallback default variables');
            updateBuilderState({
                variableSets: [...variableSets],
                variables: [...colorVariables, ...radiusVariables],
            });
            setApiVariablesLoaded(true);
        }
    }, [isLoading, apiVariablesLoaded, state.variables.length]);

    const transformAPIDataToFrontend = (apiData: any) => {
        const {pages = [], blockInstances = [], variables = []} = apiData;

        console.log('Transforming API data:', {
            pagesCount: pages.length,
            blocksCount: blockInstances.length,
            variablesCount: variables.length,
            variablesData: variables
        });

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
                instance: block.instance,
                ref: block.ref
            };
        });

        transformedBlocks.forEach((block: BlockInstance) => {
            if (block.instance) {
                const instanceBlock = blockLookup.get(block.instance);
                if (instanceBlock) {
                    block.instance = instanceBlock.instance_id;
                    if (!block.ref) {
                        block.ref = instanceBlock.instance_id;
                    }
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

        const selectedPageExists = frontendPages.some((page: PageData) => page.page_id === currentSelectedPageId);
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

        console.log('Transformed variables:', {
            count: transformedVariables.length,
            items: transformedVariables
        });

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
        if (!isLoading && state.pages.length > 0 && !state.selectedPageId) {
            updateBuilderState({
                selectedPageId: state.pages[0].page_id
            });
        }
    }, [isLoading, state.pages, state.selectedPageId, updateBuilderState]);


    const syncToCloud = useCallback(async (): Promise<boolean> => {
        if (!projectId || !project) {
            toast.error("Project data is not available");
            return false;
        }
        setIsSyncing(true);
        const toastId = toast.loading("Preparing data for synchronization...");
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
            });      // 1. Sync project data
            toast.loading("Synchronizing project data...", {id: toastId});
            const projectData = {
                project: {
                    name: project.name,
                    description: project.description || "",
                    thumbnail: project.thumbnail
                }
            };

            const projectResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(projectData)
            });

            if (!projectResponse.ok) {
                const errorData = await projectResponse.json();
                throw new Error(errorData.message || 'Failed to sync project data');
            }

            toast.loading("Synchronizing page data...", {id: toastId});
            const pagesData = {
                pages: state.pages.map(page => ({
                    page_id: page.page_id,
                    name: page.name,
                    path: page.path || '/',
                    slug: page.slug,
                    route: page.route,
                    isStatic: page.isStatic
                }))
            };

            const pagesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pages/projects/${projectId}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(pagesData)
            });

            if (!pagesResponse.ok) {
                const errorData = await pagesResponse.json();
                throw new Error(errorData.message || 'Failed to sync pages');
            }

            toast.loading("Synchronizing variable data...", {id: toastId});
            const variablesData = {
                variables: state.variables.map(variable => ({
                    variable_id: variable.variable_id,
                    name: variable.name,
                    key: variable.key,
                    type: variable.type,
                    primaryValue: variable.primaryValue,
                    secondaryValue: variable.secondaryValue || variable.primaryValue,
                    variableSet: typeof variable.variableSet === 'string' ? variable.variableSet : variable.variableSet.set_id
                }))
            };

            const variablesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/variables/projects/${projectId}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(variablesData)
            });

            if (!variablesResponse.ok) {
                const errorData = await variablesResponse.json();
                throw new Error(errorData.message || 'Failed to sync variables');
            }

            toast.loading("Synchronizing block instances...", {id: toastId});
            const blocksData = {
                blocks: blocksWithIds.map(block => ({
                    instance_id: block.id,
                    page_id: block.page_id,
                    index: block.index,
                    page: block.page_id,
                    folderName: block.folderName,
                    subFolder: block.subFolder,
                    value: block.value,
                    instance: block.instance,
                    ref: block.ref || (block.instance ? block.instance : null)
                }))
            };

            const blocksResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/block-instances/projects/${projectId}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(blocksData)
            });

            if (!blocksResponse.ok) {
                const errorData = await blocksResponse.json();
                throw new Error(errorData.message || 'Failed to sync block instances');
            }
            toast.success("All project data synchronized successfully", {id: toastId});
            setLastSynced(new Date());
            return true;
        } catch (error) {
            console.error("Error syncing to cloud:", error);
            toast.error(error instanceof Error ? error.message : "Failed to sync project", {id: toastId});
            return false;
        } finally {
            setIsSyncing(false);
        }
    }, [projectId, project, state.pages, state.variables, state.blocks]);

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