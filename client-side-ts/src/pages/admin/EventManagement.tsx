import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Calendar, MapPin, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AttendeesTable } from "@/features/admin/event-management";
import {
  AttendeeSettingsModal,
  EditEventModal,
} from "@/features/admin/event-management/components/modals";
import { getEventById } from "@/features/events/api/eventService";
import type { Event as ApiEvent } from "@/features/events/types/event.types";

interface EventDetails {
  id: string;
  title: string;
  status: "ongoing" | "ended" | "upcoming";
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  locationAddress: string;
  description: string;
  image: string;
  venues: string[];
}

const DEFAULT_CAMPUSES = [
  "University of Cebu Main Campus",
  "University of Cebu Banilad Campus",
  "University of Cebu Lapu-Lapu & Mandaue",
  "University of Cebu Pardo & Talisay",
];

const CAMPUS_CODE_TO_NAME: Record<string, string> = {
  "UC-Main": "University of Cebu Main Campus",
  "UC-Banilad": "University of Cebu Banilad Campus",
  "UC-LM": "University of Cebu Lapu-Lapu & Mandaue",
  "UC-PT": "University of Cebu Pardo & Talisay",
  "UC-CS": "University of Cebu College of Systems and Technology",
};

interface SessionConfigType {
  enabled?: boolean;
  timeRange?: string;
}

interface EventSessionConfig {
  morning?: SessionConfigType;
  afternoon?: SessionConfigType;
  evening?: SessionConfigType;
}

type EventStatus = EventDetails["status"];

const formatEventDateLabel = (value: unknown): string => {
  if (!value) return "TBA";

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const normalizeStatus = (value: unknown): EventStatus => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "ongoing") return "ongoing";
  if (normalized === "upcoming") return "upcoming";
  return "ended";
};

const getSessionBounds = (
  sessionConfig: EventSessionConfig | undefined
): { startTime: string; endTime: string } => {
  const order: Array<keyof EventSessionConfig> = [
    "morning",
    "afternoon",
    "evening",
  ];

  const enabledRanges = order
    .map((key) => sessionConfig?.[key])
    .filter((session): session is SessionConfigType =>
      Boolean(session?.enabled && session?.timeRange)
    )
    .map((session) => String(session.timeRange));

  if (enabledRanges.length === 0) {
    return { startTime: "TBA", endTime: "TBA" };
  }

  const [firstStart = "TBA"] = enabledRanges[0].split(" - ");
  const lastRange = enabledRanges[enabledRanges.length - 1];
  const [, lastEnd = "TBA"] = lastRange.split(" - ");

  return { startTime: firstStart, endTime: lastEnd };
};

const mapApiEventToEventDetails = (
  routeEventId: string,
  event: ApiEvent
): EventDetails => {
  const sessionConfig = event.sessionConfig as EventSessionConfig | undefined;
  const { startTime, endTime } = getSessionBounds(sessionConfig);
  const mappedVenues = Array.isArray(event.limit)
    ? event.limit
        .map((item) => {
          const campusCode =
            item && typeof item === "object" && "campus" in item
              ? String((item as { campus?: unknown }).campus ?? "")
              : "";
          return CAMPUS_CODE_TO_NAME[campusCode] ?? null;
        })
        .filter((campus): campus is string => Boolean(campus))
    : [];

  const image =
    Array.isArray(event.eventImage) && event.eventImage.length > 0
      ? String(event.eventImage[0])
      : "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=600&fit=crop";

  return {
    id: String(event.eventId ?? routeEventId),
    title: String(event.eventName ?? "Untitled Event"),
    status: normalizeStatus(event.status),
    startDate: formatEventDateLabel(event.eventDate),
    startTime,
    endDate: formatEventDateLabel(event.eventDate),
    endTime,
    location:
      (typeof event.location === "string" && event.location) ||
      "Location not specified",
    locationAddress:
      (typeof event.locationAddress === "string" && event.locationAddress) ||
      "Address not specified",
    description:
      (typeof event.eventDescription === "string" && event.eventDescription) ||
      "No description available.",
    image,
    venues: mappedVenues.length > 0 ? mappedVenues : DEFAULT_CAMPUSES,
  };
};

const EventManagement: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const normalizedRouteEventId = eventId?.trim() ?? "";
  const hasValidRouteEventId = normalizedRouteEventId.length > 0;
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] =
    useState<boolean>(hasValidRouteEventId);
  const [loadError, setLoadError] = useState<string | null>(
    hasValidRouteEventId ? null : "Missing event ID from route."
  );
  const [activeCampus, setActiveCampus] = useState(DEFAULT_CAMPUSES[0]);
  const [isAttendeeSettingsOpen, setIsAttendeeSettingsOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);

  const availableCampuses = useMemo(
    () => eventDetails?.venues ?? DEFAULT_CAMPUSES,
    [eventDetails?.venues]
  );

  const activeCampusValue = availableCampuses.includes(activeCampus)
    ? activeCampus
    : availableCampuses[0];

  useEffect(() => {
    if (!hasValidRouteEventId) {
      return;
    }

    let isMounted = true;

    const fetchEvent = async () => {
      setIsLoadingEvent(true);
      setLoadError(null);

      const result = await getEventById(normalizedRouteEventId);

      if (!isMounted) return;

      if (!result) {
        setEventDetails(null);
        setLoadError("Unable to load event details.");
        setIsLoadingEvent(false);
        return;
      }

      setEventDetails(
        mapApiEventToEventDetails(normalizedRouteEventId, result)
      );
      setIsLoadingEvent(false);
    };

    fetchEvent();

    return () => {
      isMounted = false;
    };
  }, [hasValidRouteEventId, normalizedRouteEventId]);

  const handleBack = () => {
    navigate("/admin/events");
  };

  const handleEditEvent = () => {
    if (!eventDetails) return;
    setIsEditEventOpen(true);
  };

  // const handleSaveEvent = async (updatedEvent: any) => {
  //   const eventData = {
  //     eventName: updatedEvent.title,
  //     eventDescription: updatedEvent.description,
  //     eventDate: updatedEvent.startDate,
  //     location: updatedEvent.location,
  //   };

  //   const result = await updateEvent(eventDetails.id, eventData);
  //   if (result) {
  //     setEventDetails(updatedEvent);
  //   }
  // };

  const handleAttendeeSettings = () => {
    setIsAttendeeSettingsOpen(true);
  };

  const handleSaveAttendeeLimits = (limits: Record<string, number>) => {
    console.warn("Save attendee limits:", limits);
    // Implement save logic here
  };

  const retryFetch = () => {
    if (!hasValidRouteEventId) return;
    setLoadError(null);
    setIsLoadingEvent(true);

    getEventById(normalizedRouteEventId).then((result) => {
      if (!result) {
        setEventDetails(null);
        setLoadError("Unable to load event details.");
        setIsLoadingEvent(false);
        return;
      }

      setEventDetails(
        mapApiEventToEventDetails(normalizedRouteEventId, result)
      );
      setIsLoadingEvent(false);
    });
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-background px-6 py-5 sm:py-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold">Event Management</h1>
            <p className="text-muted-foreground text-sm">
              Edit event details and manage attendees
            </p>
          </div>

          <div className="flex w-full justify-end sm:w-auto">
            <Button
              variant="outline"
              onClick={handleAttendeeSettings}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Attendee Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 px-6 py-4">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleBack();
                  }}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Events
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Event Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {isLoadingEvent ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <div className="text-muted-foreground text-sm">
                Loading event...
              </div>
            </div>
          ) : loadError ? (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">{loadError}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={retryFetch}
                  className="cursor-pointer"
                >
                  Retry
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="cursor-pointer"
                >
                  Back to Events
                </Button>
              </div>
            </div>
          ) : !eventDetails ? (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">Event not found.</p>
              <Button
                variant="outline"
                onClick={handleBack}
                className="cursor-pointer"
              >
                Back to Events
              </Button>
            </div>
          ) : (
            <>
              {/* Event Details Section */}
              <div className="mb-20 flex flex-col items-stretch gap-6 lg:flex-row">
                {/* Event Image */}
                <div className="lg:w-1/3">
                  <div className="bg-muted relative h-full overflow-hidden rounded-lg">
                    <img
                      src={eventDetails.image}
                      alt={eventDetails.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                {/* Event Info */}
                <div className="h-full space-y-6 lg:w-2/3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-4 flex items-center gap-3">
                        <h2 className="text-3xl font-bold">
                          {eventDetails.title}
                        </h2>
                        <Badge
                          variant={
                            eventDetails.status === "ongoing"
                              ? "default"
                              : eventDetails.status === "ended"
                                ? "secondary"
                                : "outline"
                          }
                          className="capitalize"
                        >
                          {eventDetails.status}
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="mb-3 text-sm font-semibold">
                            Attendance Date Start and End
                          </h3>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Start Date/Time */}
                            <div className="flex gap-3">
                              <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                                <Calendar className="text-muted-foreground h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">
                                  {eventDetails.startDate}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                  {eventDetails.startTime}
                                </p>
                              </div>
                            </div>

                            {/* End Date/Time */}
                            <div className="flex gap-3">
                              <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                                <Calendar className="text-muted-foreground h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">
                                  {eventDetails.endDate}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                  {eventDetails.endTime}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex gap-3">
                          <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                            <MapPin className="text-muted-foreground h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            {/* TODO: Remove these fields soon */}
                            {/* Hardcoding these two for now for the upcoming event */}
                            {/* The current Figma design has location field displayed */}
                            {/* but this isn't yet available in the database models neither the */}
                            {/* create event (add merch event type) forms, we will soon implement this. */}
                            <p className="text-sm font-medium">
                              {/* {eventDetails.location} */}
                              Cebu Coliseum
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {/* {eventDetails.locationAddress} */}
                              Sanciangko St., Cebu City, Philippines
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {eventDetails.description}
                          </p>
                        </div>

                        {/* Edit Button */}
                        <div>
                          <Button
                            onClick={handleEditEvent}
                            variant="outline"
                            className="w-full cursor-pointer"
                          >
                            Edit Event
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendees Section - campuses tabs */}
              <div className="space-y-4">
                <Tabs value={activeCampusValue} onValueChange={setActiveCampus}>
                  <TabsList className="flex w-full gap-2 overflow-x-auto rounded-none bg-transparent px-0">
                    {availableCampuses.map((campus) => (
                      <TabsTrigger
                        key={campus}
                        value={campus}
                        className="mx-1 cursor-pointer rounded-none !bg-transparent px-4 py-3 whitespace-nowrap hover:bg-transparent focus:bg-transparent data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[#1C9DDE] data-[state=active]:underline data-[state=active]:decoration-[#1C9DDE] data-[state=active]:decoration-2 data-[state=active]:underline-offset-11"
                      >
                        {campus}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {availableCampuses.map((campus) => (
                    <TabsContent key={campus} value={campus} className="mt-6">
                      <AttendeesTable
                        venue={campus}
                        eventId={eventDetails.id}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <AttendeeSettingsModal
        open={isAttendeeSettingsOpen}
        onOpenChange={setIsAttendeeSettingsOpen}
        venues={eventDetails?.venues ?? DEFAULT_CAMPUSES}
        onSave={handleSaveAttendeeLimits}
      />
      <EditEventModal
        open={isEditEventOpen}
        onOpenChange={setIsEditEventOpen}
        eventData={{
          id: eventDetails?.id ?? "",
          title: eventDetails?.title ?? "",
          description: eventDetails?.description ?? "",
          location: eventDetails?.location ?? "",
          startDate: eventDetails?.startDate ?? "",
          image: eventDetails?.image ?? "",
        }}
      />
    </div>
  );
};

export default EventManagement;
