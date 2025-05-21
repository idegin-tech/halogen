"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { ProjectData, ProjectSettings } from "@halogen/common";

type ProjectState = {
  project: ProjectData | null;
  users: any[];
  settings: ProjectSettings | null;
  wallet: any | null;
};

interface ProjectContextInterface {
  state: ProjectState;
  updateProjectState: (updates: Partial<ProjectState>) => void;
}

interface ProjectProviderProps {
  children: ReactNode;
  initialData?: {
    project: ProjectData;
    users: any[];
    settings: ProjectSettings | null;
    wallet: any | null;
  };
}

const ProjectContext = createContext<ProjectContextInterface | undefined>(undefined);

export function ProjectProvider({ children, initialData }: ProjectProviderProps) {
  const [state, setState] = useState<ProjectState>({
    project: initialData?.project || null,
    users: initialData?.users || [],
    settings: initialData?.settings || null,
    wallet: initialData?.wallet || null
  });

  const updateProjectState = (updates: Partial<ProjectState>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  };

  return (
    <ProjectContext.Provider value={{ state, updateProjectState }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
