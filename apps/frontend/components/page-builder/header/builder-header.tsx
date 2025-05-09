import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CloudIcon, MenuIcon, ChevronRight, EyeIcon } from "lucide-react";
import { ToggleButton } from "../components/ToggleBtn";
import TopPanelToggler from "../components/top-panel/TopPanelToggler";
import { useLayoutContext } from "@/context/layout.context";
import { useBuilderContext } from "@/context/builder.context";
import { useSyncContext } from "@/context/sync.context";
import Link from "next/link";
import React, { useState, useMemo } from "react";
import { toast } from "sonner";



export default function BuilderHeader() {
  const { toggleRightPanel, state } = useLayoutContext();
  const { state: builderState } = useBuilderContext();
  const { syncToCloud, isSyncing, lastSynced } = useSyncContext();
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (isPublishing) return;

    setIsPublishing(true);
    try {
      const success = await syncToCloud();
      if (!success) {
        toast.error("Failed to publish project");
      }
    } catch (error) {
      console.error("Error during publishing:", error);
      toast.error("An unexpected error occurred during publishing");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <header
        className={
          "bg-background px-2 h-14 flex justify-between border-b border-border items-center relative z-50"
        }
      >
        <div className="min-w-[450px] flex items-center gap-2">
          <Link href="/client/projects">
            <ToggleButton Icon={ArrowLeft} label={"Go back"} />
          </Link>
          <div className="flex items-center gap-1">
            <h1 className="text-lg font-semibold truncate max-w-[160px]">
              {builderState.project?.name || "Untitled Project"}
            </h1>
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
              <span className="text-muted-foreground font-medium">{builderState.pages.find(x => x.page_id === builderState.selectedPageId)?.name || ''}</span>
            </>
          </div>
        </div>
        <TopPanelToggler />
        <div className={"flex items-center justify-end gap-4 min-w-[450px]"}>
          <Avatar>
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="User avatar" />
          </Avatar>
          <div className='h-9 min-w-9 bg-lime-400 rounded-full'>

          </div>

          <Button
            onClick={handlePublish}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={isPublishing || isSyncing}
          >
            <CloudIcon className={`h-4 w-4 ${isPublishing || isSyncing ? 'animate-bounce' : ''}`} />
            {isPublishing || isSyncing ? "Publishing..." : "Publish"}
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            <EyeIcon className={"h-4 w-4"} />
            Preview
          </Button>
          <ToggleButton
            Icon={MenuIcon}
            label={"Toggle config"}
            placement={"bottom"}
            isActive={state.showRightPanel}
            onClick={toggleRightPanel}
          />
        </div>
      </header>
    </>
  );
}

