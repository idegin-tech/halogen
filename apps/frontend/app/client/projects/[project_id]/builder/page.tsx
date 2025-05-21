import { fetchFromApi } from "@/lib/server-api";
import PageBuilder from "@/components/page-builder/PageBuilder";
import { BuilderProvider } from "@/context/builder.context";
import { SyncProvider } from "@/context/sync.context";
import { notFound } from "next/navigation";
import { PreviewProvider } from "@/context/preview.context";
import { useProjectContext } from "@/context/project.context";
import { PageData, BlockInstance, VariableSet, Variable } from "@halogen/common";

interface WebsiteData {
  pages: PageData[];
  blocks: BlockInstance[];
  metadata: any;
  variableSets: VariableSet[];
  variables: Variable[];
}

export default async function BuilderPage({
  params
}: {
  params: Promise<{ project_id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const projectId = (await params)?.project_id;

  let websiteData: WebsiteData | null = null;

  try {
    websiteData = await fetchFromApi<WebsiteData>(`/projects/${projectId}/website`);

    if (!websiteData) {
      notFound();
    }
  } catch (error) {
    console.error('Failed to fetch website data:', error);
    notFound();
  }

  return (
    <BuilderProvider initialData={websiteData}>
      <SyncProvider projectId={projectId}>
        <PreviewProvider>
          <PageBuilder />
        </PreviewProvider>
      </SyncProvider>
    </BuilderProvider>
  );
}
