"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { PageData, Variable, VariableSet } from "@halogen/common";
import { BlockInstance } from "@halogen/common";

type BuilderState = {
  pages: PageData[];
  blocks: BlockInstance[];
  selectedPageId: string | null;
  selectedBlockId: string | null;
  metadata: any | null;
  variableSets: VariableSet[];
  variables: Variable[];
};

interface BuilderContextInterface {
  state: BuilderState;
  updateBuilderState: (updates: Partial<BuilderState>) => void;
}

interface BuilderProviderProps {
  children: ReactNode;
  initialData?: {
    pages: PageData[];
    blocks: BlockInstance[];
    metadata: any;
    variableSets: VariableSet[];
    variables: Variable[];
  };
}

const BuilderContext = createContext<BuilderContextInterface | undefined>(undefined);

export function BuilderProvider({ children, initialData }: BuilderProviderProps) {
  const [state, setState] = useState<BuilderState>({
    pages: initialData?.pages || [],
    blocks: initialData?.blocks || [],
    selectedPageId: null,
    selectedBlockId: null,
    metadata: initialData?.metadata || null,
    variableSets: initialData?.variableSets || [],
    variables: initialData?.variables || []
  });

  const updateBuilderState = (updates: Partial<BuilderState>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  };

  return (
    <BuilderContext.Provider value={{ state, updateBuilderState }}>
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
