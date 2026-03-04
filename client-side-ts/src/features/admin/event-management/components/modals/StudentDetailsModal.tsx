import React from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StudentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    name: string;
    email: string;
    studentId: string;
    status: "present" | "absent";
    courseYear: string;
    campus?: string;
    shirtSize?: string;
    shirtPrice?: string;
  } | null;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  open,
  onOpenChange,
  student,
}) => {
  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-md gap-0 rounded-lg p-0 sm:max-w-xs sm:rounded-xl"
        showCloseButton={false}
      >
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Student Details
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Status</span>
            <Badge
              variant={student.status === "present" ? "default" : "destructive"}
              className={
                student.status === "present"
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : "bg-red-100 text-red-800 hover:bg-red-100"
              }
            >
              {student.status === "present" ? "Present" : "Absent"}
            </Badge>
          </div>

          {/* Student ID */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Student ID</span>
            <span className="text-sm font-medium">{student.studentId}</span>
          </div>

          {/* Name */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Name</span>
            <span className="text-sm font-medium">{student.name}</span>
          </div>

          {/* Course & Year */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Course & Year</span>
            <span className="text-sm font-medium">{student.courseYear}</span>
          </div>

          {/* Campus */}
          {student.campus && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Campus</span>
              <span className="text-sm font-medium">{student.campus}</span>
            </div>
          )}

          {/* Shirt Size */}
          {student.shirtSize && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Shirt Size</span>
              <span className="text-sm font-medium">{student.shirtSize}</span>
            </div>
          )}

          {/* Shirt Price */}
          {student.shirtPrice && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Shirt Price</span>
              <span className="text-sm font-medium text-[#1C9DDE]">
                ₱{student.shirtPrice}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
