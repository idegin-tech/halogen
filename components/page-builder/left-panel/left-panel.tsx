import {
  BlocksIcon,
  BrushIcon,
  FileIcon,
  LucideIcon,
  MoonIcon,
  SettingsIcon,
} from "lucide-react";
import { Tooltip } from "@heroui/react";

export default function LeftPanel() {
  return (
    <>
      <div
        className={
          "border-r border-divider w-[3.5rem] h-body bg-content1 flex flex-col items-center justify-between"
        }
      >
        <div className={"w-full"}>
          <ToggleButton isActive Icon={FileIcon} label={"Pages"} />
          <ToggleButton Icon={BlocksIcon} label={"Blocks"} />
          <ToggleButton Icon={BrushIcon} label={"Theme"} />
          <ToggleButton Icon={SettingsIcon} label={"Site settings"} />
        </div>
        <div className={"w-full"}>
          <ToggleButton Icon={MoonIcon} label={"Change theme"} />
        </div>
      </div>
    </>
  );
}

export const ToggleButton = ({
  Icon,
  isActive,
  label,
  placement = "right",
}: {
  Icon: LucideIcon;
  label: string;
  isActive?: boolean;
  placement?:
    | "top"
    | "bottom"
    | "right"
    | "left"
    | "top-start"
    | "top-end"
    | "bottom-start"
    | "bottom-end"
    | "left-start"
    | "left-end"
    | "right-start";
}) => {
  return (
    <>
      <Tooltip content={label} placement={placement}>
        <div
          className={
            "min-w-[3.5rem] w-[3.5rem] cursor-pointer hover:text-foreground hover:bg-content2 border-divider text-content4 h-header flex items-center justify-center"
          }
        >
          <Icon />
        </div>
      </Tooltip>
    </>
  );
};
