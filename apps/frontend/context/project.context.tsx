"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

type ProjectState = {
    showPricing: boolean;
};

interface ProjectContextInterface {
    state: ProjectState;
    updateProjectState: (updates: Partial<ProjectState>) => void;
}

const ProjectContext = createContext<ProjectContextInterface | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ProjectState>({
        showPricing: true,
    });

    const updateProjectState = useCallback((updates: Partial<ProjectState>) => {
        setState((prevState) => ({ ...prevState, ...updates }));
    }, []);

    const contextValue: ProjectContextInterface = {
        state,
        updateProjectState,
    };

    return (
        <ProjectContext.Provider value={contextValue}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProjectContext() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error("useProjectContext must be used within a ProjectProvider");
    }
    return context;
}
