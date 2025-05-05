import { Avatar, Button } from "@heroui/react";
import { ArrowLeft, BlocksIcon, BrushIcon, DownloadIcon, FileIcon, MenuIcon, MoonIcon, SaveIcon, SettingsIcon } from "lucide-react";
import { InfoIcon } from "@heroui/shared-icons";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { ToggleButton } from "../components/ToggleBtn";
import TopPanelToggler from "../components/top-panel/TopPanelToggler";


export default function BuilderHeader() {
  return (
    <>
      <header
        className={
          "bg-content1 h-14 bg-card flex justify-between border-b border-divider items-center relative z-[100]"
        }
      >
        <ToggleButton Icon={ArrowLeft} label={"Go back"} />
        <TopPanelToggler/>
        <div className={"flex items-center gap-default"}>
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
            color="primary"
            startContent={<SaveIcon className={"h-4 w-4"} />}
          >
            Save
          </Button>
          <ToggleButton
            Icon={MenuIcon}
            label={"Toggle config"}
            placement={"bottom"}
          />
        </div>
      </header>
    </>
  );
}
