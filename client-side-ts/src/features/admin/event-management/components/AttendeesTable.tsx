import React, { useState, useEffect } from "react";
import { Search, Download, Plus, Filter } from "lucide-react";
import {
  getAttendees,
  markAsPresent,
} from "@/features/events/api/eventService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  FilterSheet,
  AddAttendeeModal,
  MarkAttendanceButton,
  StudentDetailsModal,
  MarkAttendanceModal,
  ScanQRModal,
} from "./modals";
import type { FilterOptions, AttendeeFormData } from "./modals";
import type {
  AttendeesPagination,
  GetAttendeesParams,
} from "@/features/events/types/event.types";

interface Attendee {
  id: string;
  name: string;
  email: string;
  studentId: string;
  status: "present" | "absent";
  courseYear: string;
  confirmedOn: string;
  confirmedBy: string;
  campus?: string;
  shirtSize?: string;
  shirtPrice?: string;
}

interface AttendeesTableProps {
  venue: string;
  eventId: string;
  campusCode: string;
}

export const AttendeesTable: React.FC<AttendeesTableProps> = ({
  venue,
  eventId,
  campusCode,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddAttendeeOpen, setIsAddAttendeeOpen] = useState(false);
  const [isStudentDetailsOpen, setIsStudentDetailsOpen] = useState(false);
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [isScanQROpen, setIsScanQROpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Attendee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<AttendeesPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    status: [],
    course: [],
    yearLevel: [],
    confirmedOn: undefined,
  });

  const [attendees, setAttendees] = useState<Attendee[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
      setCurrentPage(1);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Fetch attendees from API
  useEffect(() => {
    let isMounted = true;

    const fetchAttendees = async () => {
      if (!eventId) return;

      setIsLoading(true);
      setLoadError(null);

      const params: GetAttendeesParams = {
        page: currentPage,
        limit: pagination.limit,
        campus: campusCode,
        search: debouncedSearchQuery || undefined,
        status:
          activeFilters.status.length > 0 ? activeFilters.status : undefined,
        course:
          activeFilters.course.length > 0 ? activeFilters.course : undefined,
        yearLevel:
          activeFilters.yearLevel.length > 0
            ? activeFilters.yearLevel
            : undefined,
        confirmedOn: activeFilters.confirmedOn
          ? activeFilters.confirmedOn.toISOString().slice(0, 10)
          : undefined,
      };

      const result = await getAttendees(eventId, params);
      if (!isMounted) return;

      if (result) {
        const mappedAttendees: Attendee[] = result.data.map((attendee) => ({
          id: attendee.id_number,
          name: attendee.name,
          email:
            typeof attendee.email === "string" &&
            attendee.email.trim().length > 0
              ? attendee.email
              : `${attendee.id_number}@uc.edu.ph`,
          studentId: attendee.id_number,
          status: attendee.isPresent ? "present" : "absent",
          courseYear: `${attendee.course} - ${attendee.year}`,
          confirmedOn: attendee.transactDate
            ? new Date(attendee.transactDate).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              }) +
              "\n" +
              new Date(attendee.transactDate).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "--",
          confirmedBy: attendee.transactBy || "--",
          campus: attendee.campus,
          shirtSize: attendee.shirtSize,
          shirtPrice: attendee.shirtPrice?.toString(),
        }));
        setAttendees(mappedAttendees);
        setSelectedAttendees([]);

        const nextPage = result.pagination.page;
        setPagination(result.pagination);

        if (nextPage !== currentPage) {
          setCurrentPage(nextPage);
        }
      } else {
        setAttendees([]);
        setSelectedAttendees([]);
        setLoadError("Unable to load attendees.");
      }

      setIsLoading(false);
    };

    fetchAttendees();
    return () => {
      isMounted = false;
    };
  }, [
    eventId,
    campusCode,
    currentPage,
    pagination.limit,
    debouncedSearchQuery,
    activeFilters,
    refreshTick,
  ]);

  const paginatedAttendees = attendees;
  const totalPages = pagination.totalPages;
  const totalAttendees = pagination.total;
  const startIndex = (pagination.page - 1) * pagination.limit;
  const endIndex = startIndex + paginatedAttendees.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAttendees(paginatedAttendees.map((a) => a.id));
    } else {
      setSelectedAttendees([]);
    }
  };

  const handleSelectAttendee = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAttendees((prev) => [...prev, id]);
    } else {
      setSelectedAttendees((prev) => prev.filter((aid) => aid !== id));
    }
  };

  const handleFilter = () => {
    setIsFilterOpen(true);
  };

  const handleApplyFilter = (filters: FilterOptions) => {
    setActiveFilters(filters);
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    console.warn("Export to CSV");
  };

  const handleAddAttendee = () => {
    setIsAddAttendeeOpen(true);
  };

  const handleAddAttendeeSubmit = (attendee: AttendeeFormData) => {
    // Modal now handles API call, this just updates local state
    const newAttendee: Attendee = {
      id: attendee.studentId,
      name: `${attendee.firstName} ${attendee.middleName} ${attendee.lastName}`.trim(),
      email: attendee.email,
      studentId: attendee.studentId,
      status: "present",
      courseYear: `${attendee.course} - ${attendee.yearLevel.charAt(0)}`,
      confirmedOn:
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }) +
        "\n" +
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      confirmedBy: "Admin",
      campus: attendee.campus,
      shirtSize: attendee.shirtSize,
      shirtPrice: attendee.shirtPrice,
    };
    setAttendees((prev) => [newAttendee, ...prev]);
    setCurrentPage(1);
    setRefreshTick((prev) => prev + 1);
  };

  const handleScanQR = () => {
    setIsScanQROpen(true);
  };

  const handleScanSuccess = async (studentId: string) => {
    if (!eventId) return;

    const student = attendees.find((a) => a.studentId === studentId);
    if (student) {
      const [course, year] = student.courseYear.split(" - ");
      const result = await markAsPresent(
        eventId,
        studentId,
        student.campus || "Main Campus",
        course,
        year,
        student.name
      );

      if (result) {
        setRefreshTick((prev) => prev + 1);
      }
    }
  };

  const handleEnterStudentId = () => {
    setIsMarkAttendanceOpen(true);
  };

  const handleSearchStudent = (studentId: string) => {
    const student = attendees.find((a) => a.studentId === studentId);
    if (student) {
      return {
        id: student.id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        courseYear: student.courseYear,
      };
    }
    return null;
  };

  const handleMarkPresent = async (attendeeId: string) => {
    if (!eventId) return;

    const student = attendees.find((a) => a.id === attendeeId);
    if (student) {
      const [course, year] = student.courseYear.split(" - ");
      const result = await markAsPresent(
        eventId,
        attendeeId,
        student.campus || "Main Campus",
        course,
        year,
        student.name
      );

      if (result) {
        setRefreshTick((prev) => prev + 1);
      }
    }
  };

  const handleViewDetails = (attendeeId: string) => {
    const student = attendees.find((a) => a.id === attendeeId);
    if (student) {
      setSelectedStudent(student);
      setIsStudentDetailsOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Venue Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">{venue}</h3>
        <div className="mt-2 flex w-full flex-row items-center gap-2 sm:mt-0 sm:w-auto">
          <div className="flex-1 sm:flex-none">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddAttendee}
              className="w-full cursor-pointer rounded-xl"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Attendee
            </Button>
          </div>
          <div className="flex-1 sm:flex-none">
            <MarkAttendanceButton
              className="w-full"
              onScanQR={handleScanQR}
              onEnterStudentId={handleEnterStudentId}
            />
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFilter}
            className="cursor-pointer rounded-xl"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="cursor-pointer rounded-xl"
          >
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      paginatedAttendees.length > 0 &&
                      selectedAttendees.length === paginatedAttendees.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="min-w-[200px]">Name</TableHead>
                <TableHead className="min-w-[120px]">Student ID</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[120px]">Course & Year</TableHead>
                <TableHead className="min-w-[150px]">Confirmed on</TableHead>
                <TableHead className="min-w-[150px]">Confirmed by</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-muted-foreground py-12 text-center"
                  >
                    Loading attendees...
                  </TableCell>
                </TableRow>
              ) : loadError ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-muted-foreground py-12 text-center"
                  >
                    {loadError}
                  </TableCell>
                </TableRow>
              ) : paginatedAttendees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-muted-foreground py-12 text-center"
                  >
                    No attendees found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAttendees.map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAttendees.includes(attendee.id)}
                        onCheckedChange={(checked) =>
                          handleSelectAttendee(attendee.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{attendee.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>{attendee.studentId}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          attendee.status === "present"
                            ? "default"
                            : "destructive"
                        }
                        className={
                          attendee.status === "present"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {attendee.status === "present" ? "Present" : "Absent"}
                      </Badge>
                    </TableCell>
                    <TableCell>{attendee.courseYear}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {attendee.confirmedOn.split("\n").map((line, i) => (
                          <div
                            key={i}
                            className={
                              i === 0 ? "font-medium" : "text-muted-foreground"
                            }
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {attendee.confirmedBy}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(attendee.id)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer with pagination and count */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Showing {totalAttendees > 0 ? startIndex + 1 : 0} to{" "}
          {Math.min(endIndex, totalAttendees)} of {totalAttendees}
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
                className={
                  !pagination.hasPreviousPage
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
            {/* Dynamic page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(pageNum);
                    }}
                    isActive={currentPage === pageNum}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(totalPages);
                  }}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
                className={
                  !pagination.hasNextPage
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Modals */}
      <FilterSheet
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        onApplyFilter={handleApplyFilter}
      />
      <AddAttendeeModal
        open={isAddAttendeeOpen}
        onOpenChange={setIsAddAttendeeOpen}
        eventId={eventId}
        onAddAttendee={handleAddAttendeeSubmit}
      />
      <StudentDetailsModal
        open={isStudentDetailsOpen}
        onOpenChange={setIsStudentDetailsOpen}
        student={selectedStudent}
      />
      <MarkAttendanceModal
        open={isMarkAttendanceOpen}
        onOpenChange={setIsMarkAttendanceOpen}
        onMarkPresent={handleMarkPresent}
        onSearchStudent={handleSearchStudent}
      />
      <ScanQRModal
        open={isScanQROpen}
        onOpenChange={setIsScanQROpen}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};
