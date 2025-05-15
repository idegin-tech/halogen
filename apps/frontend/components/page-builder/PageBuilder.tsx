"use client";
import RightPanel from "@/components/page-builder/right-panel/right-panel";
import BuilderHeader from "@/components/page-builder/header/builder-header";
import PageBuilderPreview from "./preview/page-builder-preview";
import { LayoutProvider } from "@/context/layout.context";
import { TopPanelProvider } from "@/context/top-panel.context";
import { useBuilderContext } from "@/context/builder.context";
import { useEffect, useState, useMemo } from "react";

interface PageBuilderProps {
  projectData: any;
}

export default function PageBuilder({ projectData }: PageBuilderProps) {
  const [start, setStart] = useState(false);
  const { updateBuilderState } = useBuilderContext();

  const projectName = useMemo(
    () => projectData?.name || "Untitled Project",
    [projectData?.name]
  );

  useEffect(() => {
    if (projectData) {
      updateBuilderState({
        project: projectData,
        pages: projectData.pages || [],
        blocks: projectData.blockInstances || [],
        variables: projectData.variables || [],
        projectSettings: projectData.settings || null,
      });

      const timeout = setTimeout(() => {
        setStart(true);
      }, 800);

      return () => clearTimeout(timeout);
    }
  }, [projectData, updateBuilderState]);

  if (!start) return null;

  return (
    <LayoutProvider>
      <TopPanelProvider>
        <div
          className={
            "h-screen max-h-[100vh] w-screen max-w-[100vw] flex flex-col"
          }
        >
          <BuilderHeader />
          <div className={"flex h-body max-h-body relative"}>
            <PageBuilderPreview />
            <RightPanel />
          </div>
        </div>
      </TopPanelProvider>
    </LayoutProvider>
  );
}
