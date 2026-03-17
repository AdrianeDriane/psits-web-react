import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilter: (filters: FilterOptions) => void;
  activeFilters: FilterOptions;
}

export interface FilterOptions {
  attendanceStatus: (
    | "morning_attended"
    | "afternoon_attended"
    | "evening_attended"
    | "no_sessions_attended"
  )[];
  course: string[];
  yearLevel: number[];
  registeredOn: Date | undefined;
}

const STATUS_OPTIONS = [
  { label: "Morning Attended", value: "morning_attended" },
  { label: "Afternoon Attended", value: "afternoon_attended" },
  { label: "Evening Attended", value: "evening_attended" },
  { label: "No Sessions Attended", value: "no_sessions_attended" },
];

const COURSE_OPTIONS = [
  { label: "BSIT", value: "BSIT" },
  { label: "BSCS", value: "BSCS" },
];

const YEAR_LEVEL_OPTIONS = [
  { label: "1st Year", value: 1 },
  { label: "2nd Year", value: 2 },
  { label: "3rd Year", value: 3 },
  { label: "4th Year", value: 4 },
];

export const FilterSheet: React.FC<FilterSheetProps> = ({
  open,
  onOpenChange,
  onApplyFilter,
  activeFilters,
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    attendanceStatus: [],
    course: [],
    yearLevel: [],
    registeredOn: undefined,
  });

  useEffect(() => {
    if (open) {
      // Sync parent's active filters into local state when dialog opens.
      // This is safe and intentional—we only update when the dialog opens,
      // which happens infrequently and doesn't cause cascading renders.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilters({
        attendanceStatus: [...activeFilters.attendanceStatus],
        course: [...activeFilters.course],
        yearLevel: [...activeFilters.yearLevel],
        registeredOn: activeFilters.registeredOn,
      });
    }
  }, [
    open,
    activeFilters.attendanceStatus,
    activeFilters.course,
    activeFilters.yearLevel,
    activeFilters.registeredOn,
  ]);

  const toggleStringFilter = (
    category: "attendanceStatus" | "course",
    value: string
  ) => {
    setFilters((prev) => {
      const currentValues = prev[category] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [category]: newValues };
    });
  };

  const toggleYearLevel = (value: number) => {
    setFilters((prev) => {
      const currentValues = prev.yearLevel;
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, yearLevel: newValues };
    });
  };

  const handleReset = () => {
    setFilters({
      attendanceStatus: [],
      course: [],
      yearLevel: [],
      registeredOn: undefined,
    });
  };

  const handleApply = () => {
    onApplyFilter(filters);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[80vh] w-full max-w-md flex-col gap-0 overflow-hidden rounded-lg p-0 sm:rounded-xl"
        showCloseButton={false}
      >
        <DialogHeader className="flex-none border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Filter</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              Reset Filter
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Status */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">Status</h3>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toggleStringFilter("attendanceStatus", option.value)
                    }
                    className={cn(
                      "rounded-full",
                      filters.attendanceStatus.includes(
                        option.value as FilterOptions["attendanceStatus"][number]
                      ) &&
                        "border-[#1C9DDE] bg-[#1C9DDE]/10 text-[#1C9DDE] hover:bg-[#1C9DDE]/20"
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Course */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">Course</h3>
              <div className="flex flex-wrap gap-2">
                {COURSE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStringFilter("course", option.value)}
                    className={cn(
                      "rounded-full",
                      filters.course.includes(option.value) &&
                        "border-[#1C9DDE] bg-[#1C9DDE]/10 text-[#1C9DDE] hover:bg-[#1C9DDE]/20"
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Year Level */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">Year Level</h3>
              <div className="flex flex-wrap gap-2">
                {YEAR_LEVEL_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    size="sm"
                    onClick={() => toggleYearLevel(option.value)}
                    className={cn(
                      "rounded-full",
                      filters.yearLevel.includes(option.value) &&
                        "border-[#1C9DDE] bg-[#1C9DDE]/10 text-[#1C9DDE] hover:bg-[#1C9DDE]/20"
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Registered on */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">Registered On</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.registeredOn && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.registeredOn
                      ? format(filters.registeredOn, "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.registeredOn}
                    onSelect={(date) =>
                      setFilters((prev) => ({ ...prev, registeredOn: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="bg-background flex flex-none items-center justify-end gap-3 border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="bg-[#1C9DDE] hover:bg-[#1C9DDE]"
          >
            Apply Filter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
