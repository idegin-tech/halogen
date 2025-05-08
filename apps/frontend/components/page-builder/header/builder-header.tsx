import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CloudIcon, DownloadIcon, MenuIcon, } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ToggleButton } from "../components/ToggleBtn";
import TopPanelToggler from "../components/top-panel/TopPanelToggler";
import { useLayoutContext } from "@/context/layout.context";
import Link from "next/link";

interface BuilderHeaderProps {
  projectName?: string;
}

export default function BuilderHeader({ projectName = "Untitled Project" }: BuilderHeaderProps) {
  const { toggleRightPanel, state } = useLayoutContext();
  const refresh = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.reload();
  }
  return (
    <>
      <header
        className={
          "bg-background px-2 h-14 flex justify-between border-b border-border items-center relative z-50"
        }
      >
        <div className="w-[450px] flex items-center gap-2">
          <Link href="/client/projects">
            <ToggleButton Icon={ArrowLeft} label={"Go back"} />
          </Link>
          <h1 className="text-lg font-semibold truncate">{projectName}</h1>
        </div>
        <TopPanelToggler />
        <div className={"flex items-center justify-end gap-4 w-[450px]"}>
          <Avatar>
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="User avatar" />
          </Avatar>
          <div className='h-9 min-w-9 bg-lime-400 rounded-full'>

          </div>

          <Button
            onClick={refresh}
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            <CloudIcon className={"h-4 w-4"} />
            Publish
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
