"use client";
import RightPanel from "@/components/page-builder/right-panel/right-panel";
import BuilderHeader from "@/components/page-builder/header/builder-header";
import PageBuilderPreview from "./preview/page-builder-preview";
import { LayoutProvider } from "@/context/layout.context";

export default function PageBuilder() {
  return (
    <LayoutProvider>
      <div
        className={
          "h-screen max-h-[100vh] w-screen max-w-[100vw] flex flex-col"
        }
      >
        <BuilderHeader />
        <div className={"flex h-body max-h-body relative"}>
          <PageBuilderPreview/>
          <RightPanel />
        </div>
      </div>
    </LayoutProvider>
  );
}
