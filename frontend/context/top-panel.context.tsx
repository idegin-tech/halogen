"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

type TopPanelState = {
  activeTopPanel: string | null;
};

interface TopPanelContextInterface {
  state: TopPanelState;
  setActiveTopPanel: (panel: string | null) => void;
}

const TopPanelContext = createContext<TopPanelContextInterface | undefined>(undefined);

export function TopPanelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TopPanelState>({
    activeTopPanel: null,
  });
  
  const setActiveTopPanel = useCallback((panel: string | null) => {
    setState((prevState) => ({
      ...prevState,
      activeTopPanel: prevState.activeTopPanel === panel ? null : panel
    }));
  }, []);

  const contextValue: TopPanelContextInterface = {
    state,
    setActiveTopPanel,
  };

  return (
    <TopPanelContext.Provider value={contextValue}>
      {children}
    </TopPanelContext.Provider>
  );
}

export function useTopPanelContext() {
  const context = useContext(TopPanelContext);
  if (context === undefined) {
    throw new Error("useTopPanelContext must be used within a TopPanelProvider");
  }
  return context;
}