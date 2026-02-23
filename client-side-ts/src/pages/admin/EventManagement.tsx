import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { ArrowLeft, MapPin, Calendar, Settings } from "lucide-react";
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

const EventManagement: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const eventFromState = location.state?.event;

  // Use event data from navigation state or fall back to mock data
  const [eventDetails, setEventDetails] = useState<EventDetails>({
    id: eventId || "1",
    title: eventFromState?.title || "60th UC Intramurals",
    status: "ended",
    startDate: eventFromState?.startDate || "Wed, 20 November 2024",
    startTime: eventFromState?.startTime || "5:00 PM",
    endDate: eventFromState?.endDate || "Sat, 23 November 2024",
    endTime: eventFromState?.endTime || "12:00 PM",
    location: eventFromState?.location || "University of Cebu Main Campus",
    locationAddress: eventFromState?.locationAddress || "Sanciangko St.",
    description:
      eventFromState?.description ||
      "One of the most awaited events of every UCian is the annual celebration of Intramurals, and this year is no other. An event where all college departments battle each other to stand above the rest; an event that allows UCians to showcase their talents and skills; an event that unites all UCians from every campus; an event that exudes the spirit and enthusiasm of every UCians; an event like no other, that is the true essence of UC Intramurals.",
    image:
      eventFromState?.image ||
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=600&fit=crop",
    venues: eventFromState?.venues || [
      "University of Cebu Main Campus",
      "University of Cebu Banilad Campus",
      "University of Cebu Lapu-Lapu & Mandaue",
      "University of Cebu Pardo & Talisay",
    ],
  });

  const CAMPUSES = [
    "University of Cebu Main Campus",
    "University of Cebu Banilad Campus",
    "University of Cebu Lapu-Lapu & Mandaue",
    "University of Cebu Pardo & Talisay",
  ];

  const [activeCampus, setActiveCampus] = useState(CAMPUSES[0]);
  const [isAttendeeSettingsOpen, setIsAttendeeSettingsOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);

  const handleBack = () => {
    navigate("/admin");
  };

  const handleEditEvent = () => {
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
    console.log("Save attendee limits:", limits);
    // Implement save logic here
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
                    <h2 className="text-3xl font-bold">{eventDetails.title}</h2>
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
                        Brief Details
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
                        <p className="text-sm font-medium">
                          {eventDetails.location}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {eventDetails.locationAddress}
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
            <Tabs value={activeCampus} onValueChange={setActiveCampus}>
              <TabsList className="flex w-full gap-2 overflow-x-auto rounded-none bg-transparent px-0">
                {CAMPUSES.map((campus) => (
                  <TabsTrigger
                    key={campus}
                    value={campus}
                    className="mx-1 cursor-pointer rounded-none !bg-transparent bg-transparent px-4 py-3 whitespace-nowrap hover:bg-transparent focus:bg-transparent data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[#1C9DDE] data-[state=active]:underline data-[state=active]:decoration-[#1C9DDE] data-[state=active]:decoration-2 data-[state=active]:underline-offset-11"
                  >
                    {campus}
                  </TabsTrigger>
                ))}
              </TabsList>

              {CAMPUSES.map((campus) => (
                <TabsContent key={campus} value={campus} className="mt-6">
                  <AttendeesTable venue={campus} eventId={eventDetails.id} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AttendeeSettingsModal
        open={isAttendeeSettingsOpen}
        onOpenChange={setIsAttendeeSettingsOpen}
        venues={eventDetails.venues}
        onSave={handleSaveAttendeeLimits}
      />
      <EditEventModal
        open={isEditEventOpen}
        onOpenChange={setIsEditEventOpen}
        eventData={{
          id: eventDetails.id,
          title: eventDetails.title,
          description: eventDetails.description,
          location: eventDetails.location,
          startDate: eventDetails.startDate,
          image: eventDetails.image,
        }}
      />
    </div>
  );
};

export default EventManagement;
