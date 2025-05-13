import { fetchFromApi } from "@/lib/server-api";
import PageBuilder from "@/components/page-builder/PageBuilder";
import { BuilderProvider } from "@/context/builder.context";
import { SyncProvider } from "@/context/sync.context";
import { notFound } from "next/navigation";

export default async function BuilderPage({
  params
}: {
  params: Promise<{ project_id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const projectId = (await params)?.project_id;

  let projectData = null;

  try {
    projectData = await fetchFromApi(`/projects/${projectId}`);

    if (!projectData) {
      notFound();
    }
  } catch (error) {
    console.error('Failed to fetch project:', error);
    notFound();
  }

  return (
    <BuilderProvider>
      <SyncProvider projectId={projectId}>
        <PageBuilder projectData={projectData} />
      </SyncProvider>
    </BuilderProvider>
  );
}
