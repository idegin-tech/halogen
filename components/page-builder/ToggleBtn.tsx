import { Tooltip } from "@heroui/tooltip";
import { LucideIcon } from "lucide-react";

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