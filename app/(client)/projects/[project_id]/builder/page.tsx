"use client";

import { useParams } from "next/navigation";
import PageBuilder from "@/components/page-builder/PageBuilder";
import { BuilderProvider } from "@/context/builder.context";
import { SyncProvider } from "@/context/sync.context";

export default function BuilderPage() {
  const params = useParams();
  const projectId = params.project_id as string;

  return (
    <BuilderProvider>
      <SyncProvider projectId={projectId}>
        <PageBuilder />
      </SyncProvider>
    </BuilderProvider>
  );
}
