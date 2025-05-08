"use client";

import React, { createContext, useContext, useEffect, useMemo, useCallback } from "react";
import { useBuilderContext } from "./builder.context";
import { debounce } from "lodash";
import { generateId, PageData } from "@halogen/common";
import { colorVariables, radiusVariables, variableSets } from "@/config/variables";

interface SyncContextInterface {
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
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
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  useEffect(() => {
    if (!projectId) return;

    try {
      const savedState = sessionStorage.getItem(`halogen_project_${projectId}`);

      if (savedState) {
        const parsedState = JSON.parse(savedState);
        updateBuilderState(parsedState);
      } else {
        createDefaultPage();
      }
    } catch (error) {
      console.error("Error loading from session storage:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const createDefaultPage = useCallback(() => {
    const hasPages = state.pages && state.pages.length > 0;
    const hasVariables = state.variableSets.length > 0 && state.variables.length > 0;

    const homePage: PageData = {
      page_id: generateId(9),
      name: "Home",
      path: "/",
      isStatic: true,
      project: projectId as any,
    };

    updateBuilderState({
      pages: hasPages ? state.pages : [homePage],
      variables: hasVariables ? state.variables : [...colorVariables, ...radiusVariables],
      variableSets: hasVariables ? state.variableSets: [...variableSets],
      selectedPageId: hasPages ? state?.pages[0]?.page_id : homePage.page_id
    });
  }, [state.pages, updateBuilderState, projectId, state.variableSets, state.variables]);

  const debouncedSave = useMemo(
    () =>
      debounce((data) => {
        if (!projectId) return;

        setIsSaving(true);
        try {
          sessionStorage.setItem(`halogen_project_${projectId}`, JSON.stringify(data));
          setLastSaved(new Date());
        } catch (error) {
          console.error("Error saving to session storage:", error);
        } finally {
          setIsSaving(false);
        }
      }, 1000),
    [projectId]
  );

  useEffect(() => {
    if (isLoading) return;
    debouncedSave(state);
  }, [state, isLoading, debouncedSave]);

  const contextValue: SyncContextInterface = {
    isLoading,
    isSaving,
    lastSaved,
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