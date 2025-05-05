import { Avatar, Button } from "@heroui/react";
import { ArrowLeft, BlocksIcon, BrushIcon, DownloadIcon, FileIcon, MenuIcon, MoonIcon, SaveIcon, SettingsIcon } from "lucide-react";
import { InfoIcon } from "@heroui/shared-icons";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { ToggleButton } from "../ToggleBtn";


export default function BuilderHeader() {
  return (
    <>
      <header
        className={
          "bg-content1 h-14 bg-card flex justify-between border-b border-divider items-center"
        }
      >
        <ToggleButton Icon={ArrowLeft} label={"Go back"} />
        <div className={"w-full flex items-center justify-between"}>
          <div
            className={
              "flex items-center text-content4 gap-sm cursor-pointer hover:text-foreground hover:bg-content2 p-sm rounded-xl"
            }
          >
            <InfoIcon />
            <small>The name of the project</small>
          </div>
          <div
            className={
              "flex"
            }
          >
            <ToggleButton isActive Icon={FileIcon} label={"Pages"} placement="bottom" />
            <ToggleButton Icon={BlocksIcon} label={"Blocks"} placement="bottom" />
            <ToggleButton Icon={BrushIcon} label={"Theme"} placement="bottom" />
            <ToggleButton Icon={SettingsIcon} label={"Site settings"} placement="bottom" />
          </div>
        </div>
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
