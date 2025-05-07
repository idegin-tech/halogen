import { Avatar, Button } from "@heroui/react";
import { ArrowLeft, CloudIcon, DownloadIcon, MenuIcon, } from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
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
          "bg-content1 h-14 bg-card flex justify-between border-b border-divider items-center relative z-[100]"
        }
      >
        <div className="w-[450px]">
          <ToggleButton Icon={ArrowLeft} label={"Go back"} />
        </div>
        <TopPanelToggler />
        <div className={"flex items-center gap-default w-[450px]"}>
          <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026024d" />
          <Dropdown>
            <DropdownTrigger>
              <Button
                color="default"
                startContent={<DownloadIcon className={"h-4 w-4"} />}
              >
                Import/Export
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Static Actions">
              <DropdownItem key="copy">Import</DropdownItem>
              <DropdownItem key="new">Export</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Button
            onPress={refresh}
            color="primary"
            startContent={<CloudIcon className={"h-4 w-4"} />}
          >
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
