import React from "react";
import { ChevronDown, QrCode, KeyboardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showToast } from "@/utils/alertHelper";

interface MarkAttendanceButtonProps {
  onScanQR: () => void;
  onEnterStudentId: () => void;
  isSessionActive?: boolean;
  className?: string;
}

export const MarkAttendanceButton: React.FC<MarkAttendanceButtonProps> = ({
  onScanQR,
  onEnterStudentId,
  isSessionActive = false,
  className,
}) => {
  if (!isSessionActive) {
    return (
      <Button
        size="sm"
        onClick={() =>
          showToast(
            "error",
            "Attendance marking will only be available during the event."
          )
        }
        aria-disabled="true"
        className={`${className ? className + " " : ""}bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed rounded-xl opacity-70`}
      >
        Mark Attendance
        <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          className={`${className ? className + " " : ""}bg-[#1C9DDE] cursor-pointer rounded-xl hover:bg-[#1789c4]`}
        >
          Mark Attendance
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onScanQR} className="cursor-pointer gap-2">
          <QrCode className="h-4 w-4" />
          Scan QR Code
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onEnterStudentId}
          className="cursor-pointer gap-2"
        >
          <KeyboardIcon className="h-4 w-4" />
          Enter Student ID
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
