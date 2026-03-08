import React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/utils/alertHelper";

interface MarkAttendanceButtonProps {
  onScanQR: () => void;
  onEnterStudentId: () => void;
  className?: string;
}

export const MarkAttendanceButton: React.FC<MarkAttendanceButtonProps> = ({
  onScanQR: _onScanQR,
  onEnterStudentId: _onEnterStudentId,
  className,
}) => {
  const handleDisabledClick = () => {
    showToast(
      "error",
      "Attendance marking will only be available during the event."
    );
  };

  return (
    <Button
      size="sm"
      onClick={handleDisabledClick}
      aria-disabled="true"
      className={`${className ? className + " " : ""}bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed rounded-xl opacity-70`}
    >
      Mark Attendance
      <ChevronDown className="ml-2 h-4 w-4" />
    </Button>
  );
};
