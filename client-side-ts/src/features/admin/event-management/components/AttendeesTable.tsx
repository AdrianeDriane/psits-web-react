import React, { useState, useEffect } from "react";
import { Search, Download, Plus, Filter } from "lucide-react";
import { getAttendees } from "@/features/events/api/eventService";
import { showToast } from "@/utils/alertHelper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AttendanceStatusModal,
} from "./modals";
import type { FilterOptions, AttendeeFormData } from "./modals";
import type {
  AttendeesPagination,
  GetAttendeesParams,
  EventMerchMeta,
} from "@/features/events/types/event.types";
import { CampusView } from "@/components/common/CampusView";

interface Attendee {
  id: string;
  name: string;
  email: string;
  studentId: string;
  attendance?: {
    morning?: {
      attended?: boolean;
      timestamp?: string | Date | null;
    };
    afternoon?: {
      attended?: boolean;
      timestamp?: string | Date | null;
    };
    evening?: {
      attended?: boolean;
      timestamp?: string | Date | null;
    };
  };
  courseYear: string;
  registeredOn: string;
  registeredBy: string;
  campus?: string;
  shirtSize?: string;
  shirtPrice?: string;
}

interface AttendeesTableProps {
  venue: string;
  eventId: string;
  campusCode: string | "all";
  adminCampus?: string;
  merch?: EventMerchMeta | null;
  eventStatus?: "ongoing" | "ended" | "upcoming";
}

export const AttendeesTable: React.FC<AttendeesTableProps> = ({
  venue,
  eventId,
  campusCode,
  adminCampus,
  merch,
  eventStatus,
}) => {
  const toLocalYyyyMmDd = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddAttendeeOpen, setIsAddAttendeeOpen] = useState(false);
  const [isStudentDetailsOpen, setIsStudentDetailsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Attendee | null>(null);
  const [isAttendanceStatusOpen, setIsAttendanceStatusOpen] = useState(false);
  const [selectedAttendanceAttendee, setSelectedAttendanceAttendee] =
    useState<Attendee | null>(null);
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
    attendanceStatus: [],
    course: [],
    yearLevel: [],
    registeredOn: undefined,
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
        campus: campusCode === "all" ? undefined : campusCode,
        search: debouncedSearchQuery || undefined,
        attendanceStatus:
          activeFilters.attendanceStatus.length > 0
            ? activeFilters.attendanceStatus
            : undefined,
        course:
          activeFilters.course.length > 0 ? activeFilters.course : undefined,
        yearLevel:
          activeFilters.yearLevel.length > 0
            ? activeFilters.yearLevel
            : undefined,
        registeredOn: activeFilters.registeredOn
          ? toLocalYyyyMmDd(activeFilters.registeredOn)
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
          attendance: attendee.attendance,
          courseYear: `${attendee.course} - ${attendee.year}`,
          registeredOn: attendee.transactDate
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
          registeredBy: attendee.transactBy || "--",
          campus: attendee.campus,
          shirtSize: attendee.shirtSize,
          shirtPrice: attendee.shirtPrice?.toString(),
        }));
        setAttendees(mappedAttendees);

        const nextPage = result.pagination.page;
        setPagination(result.pagination);

        if (nextPage !== currentPage) {
          setCurrentPage(nextPage);
        }
      } else {
        setAttendees([]);
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



  const handleFilter = () => {
    setIsFilterOpen(true);
  };

  const handleApplyFilter = (filters: FilterOptions) => {
    setActiveFilters(filters);
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (attendees.length === 0) {
      showToast("warning", "No attendees to export");
      return;
    }

    const headers = [
      "Student ID",
      "Name",
      "Email",
      "Campus",
      "Course",
      "Year",
      "Status",
      "Registered On",
      "Registered By",
      "Shirt Size",
      "Shirt Price",
    ];

    const rows = attendees.map((attendee) => [
      attendee.studentId,
      attendee.name,
      attendee.email,
      attendee.campus || "",
      attendee.courseYear.split(" - ")[0] || "",
      attendee.courseYear.split(" - ")[1] || "",
      getAttendanceSummary(attendee.attendance),
      attendee.registeredOn.replace("\n", " "),
      attendee.registeredBy,
      attendee.shirtSize || "",
      attendee.shirtPrice || "",
    ]);

    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `attendees-${venue.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("success", "Attendees exported successfully");
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
      attendance: {
        morning: { attended: false, timestamp: null },
        afternoon: { attended: false, timestamp: null },
        evening: { attended: false, timestamp: null },
      },
      courseYear: `${attendee.course} - ${attendee.yearLevel.charAt(0)}`,
      registeredOn:
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
      registeredBy: "Admin",
      campus: attendee.campus,
      shirtSize: attendee.shirtSize,
      shirtPrice: attendee.shirtPrice,
    };
    setAttendees((prev) => [newAttendee, ...prev]);
    setCurrentPage(1);
    setRefreshTick((prev) => prev + 1);
  };

  const isAttendanceAvailable = eventStatus !== "upcoming";

  const getAttendanceSummary = (attendance: Attendee["attendance"]) => {
    if (!isAttendanceAvailable) {
      return "Not Available Yet";
    }

    const sessions = [
      attendance?.morning?.attended,
      attendance?.afternoon?.attended,
      attendance?.evening?.attended,
    ];
    const attendedCount = sessions.filter(Boolean).length;

    return `${attendedCount}/3 Sessions`;
  };

  const openAttendanceStatus = (attendee: Attendee) => {
    setSelectedAttendanceAttendee(attendee);
    setIsAttendanceStatusOpen(true);
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
          <CampusView
            allowedCampuses={["UC-LM", "UC-PT", "UC-Banilad"]}
            role="Admin"
          >
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
          </CampusView>
          <div className="flex-1 sm:flex-none">
            <MarkAttendanceButton
              className="w-full"
              onScanQR={() => undefined}
              onEnterStudentId={() => undefined}
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
                <TableHead className="min-w-[200px]">Name</TableHead>
                <TableHead className="min-w-[120px]">Student ID</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[120px]">Course & Year</TableHead>
                <TableHead className="min-w-[150px]">Registered On</TableHead>
                <TableHead className="min-w-[150px]">Registered By</TableHead>
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
                    colSpan={7}
                    className="text-muted-foreground py-12 text-center"
                  >
                    No attendees found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAttendees.map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{attendee.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>{attendee.studentId}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAttendanceStatus(attendee)}
                        className="rounded-full"
                      >
                        {getAttendanceSummary(attendee.attendance)}
                      </Button>
                    </TableCell>
                    <TableCell>{attendee.courseYear}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {attendee.registeredOn.split("\n").map((line, i) => (
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
                      {attendee.registeredBy}
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
        adminCampus={adminCampus}
        merch={merch}
      />
      <StudentDetailsModal
        open={isStudentDetailsOpen}
        onOpenChange={setIsStudentDetailsOpen}
        student={selectedStudent}
      />
      <AttendanceStatusModal
        open={isAttendanceStatusOpen}
        onOpenChange={setIsAttendanceStatusOpen}
        attendeeName={selectedAttendanceAttendee?.name ?? ""}
        attendance={selectedAttendanceAttendee?.attendance}
        isAttendanceAvailable={isAttendanceAvailable}
      />
    </div>
  );
};
