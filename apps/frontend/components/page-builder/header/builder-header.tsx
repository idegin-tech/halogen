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


export default function BuilderHeader() {
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
          "bg-card h-14 flex justify-between border-b border-border items-center relative z-[100]"
        }
      >
        <div className="w-[450px]">
          <ToggleButton Icon={ArrowLeft} label={"Go back"} />
        </div>
        <TopPanelToggler />
        <div className={"flex items-center gap-4 w-[450px]"}>
          <Avatar>
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="User avatar" />
          </Avatar>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <DownloadIcon className={"h-4 w-4"} />
                Import/Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Import</DropdownMenuItem>
              <DropdownMenuItem>Export</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
