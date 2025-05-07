"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

type LayoutState = {
  showRightPanel: boolean;
};

interface LayoutContextInterface {
  state: LayoutState;
  updateLayoutState: (updates: Partial<LayoutState>) => void;
  toggleRightPanel: () => void;
}

const LayoutContext = createContext<LayoutContextInterface | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LayoutState>({
    showRightPanel: true,
  });

  const updateLayoutState = useCallback((updates: Partial<LayoutState>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  }, []);

  const toggleRightPanel = useCallback(() => {
    setState((prevState) => ({ 
      ...prevState, 
      showRightPanel: !prevState.showRightPanel 
    }));
  }, []);

  const contextValue: LayoutContextInterface = {
    state,
    updateLayoutState,
    toggleRightPanel,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutContext() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayoutContext must be used within a LayoutProvider");
  }
  return context;
}