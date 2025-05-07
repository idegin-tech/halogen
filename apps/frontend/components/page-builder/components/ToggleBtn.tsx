import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ToggleButton = ({
  Icon,
  isActive,
  label,
  placement = "right",
  onClick
}: {
  Icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
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
  const getSideAndAlign = () => {
    const parts = placement.split('-');
    const side = parts[0] as "top" | "bottom" | "left" | "right";

    let align: "start" | "center" | "end" = "center";
    if (parts.length > 1) {
      align = parts[1] as "start" | "end";
    }

    return { side, align };
  };

  const { side, align } = getSideAndAlign();

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant={'ghost'}
            size='icon'
            onClick={onClick}
            data-active={isActive}
            className={
              cn(" cursor-pointer hover:text-foreground hover:bg-muted border-border text-muted-foreground h-header flex items-center justify-center", {
                "bg-muted text-foreground": isActive,
              })
            }
          >
            <Icon />
          </Button>
        </TooltipTrigger>
        <TooltipContent side={side} align={align}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};