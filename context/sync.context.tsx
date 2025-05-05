"use client";

import React, { createContext, useContext, useEffect, useMemo, useCallback } from "react";
import { useBuilderContext } from "./builder.context";
import { debounce } from "lodash";
import { PageData } from "@/types/builder.types";

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
        // Create a default home page if none exists
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
    
    if (!hasPages) {
      const homePage: PageData = {
        id: "home",
        name: "Home",
        path: "/",
        isStatic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      updateBuilderState({
        pages: [homePage],
        selectedPageId: homePage.id
      });
    }
  }, [state.pages, updateBuilderState]);

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