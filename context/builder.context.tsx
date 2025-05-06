"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { PageData, ProjectData, Variable, VariableSet } from "@/types/builder.types";
import { BlockInstance } from "@/types/block.types";

type BuilderState = {
  project: ProjectData | null;
  pages: PageData[];
  blocks: BlockInstance[];
  selectedPageId: string | null;
  selectedBlockId: string | null;

  variableSets: VariableSet[];
  variables: Variable[]
};

interface BuilderContextInterface {
  state: BuilderState;
  updateBuilderState: (updates: Partial<BuilderState>) => void;
}

const BuilderContext = createContext<BuilderContextInterface | undefined>(undefined);

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BuilderState>({
    project: null,
    pages: [],
    blocks: [],
    selectedPageId: null,
    selectedBlockId: null,

    variables: [],
    variableSets: []
  });

  const updateBuilderState = useCallback((updates: Partial<BuilderState>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  }, []);

  const contextValue: BuilderContextInterface = {
    state,
    updateBuilderState,
  };

  console.log("BuilderContext state:", state);
  return (
    <BuilderContext.Provider value={contextValue}>
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilderContext() {
  const context = useContext(BuilderContext);
  if (context === undefined) {
    throw new Error("useBuilder must be used within a BuilderProvider");
  }
  return context;
}
