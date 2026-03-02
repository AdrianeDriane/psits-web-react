import axios, { AxiosError } from "axios";
import { showToast } from "../../../utils/alertHelper";
import backendConnection from "../../../api/backendApi";
import type {
  ApiErrorResponse,
  Event,
  AttendeesResponse,
  EventCheckData,
  RaffleResponse,
  StatisticsData,
  CreateEventData,
  CreateEventResponse,
  AddAttendeeFormData,
  RemoveAttendeeFormData,
  UpdateSettingsFormData,
  RaffleWinnerResponse,
  RemoveRaffleResponse,
} from "../types/event.types";
import api from "@/api/axios";

const getAuthToken = (): string | null => {
  return sessionStorage.getItem("Token");
};

// Helper function to handle API errors
const handleApiError = (
  error: unknown,
  shouldReload: boolean = false
): false => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    if (axiosError.response?.data) {
      if (shouldReload) {
        //uncomment the line if its not error
        // window.location.reload();
      }
      console.error(
        "Error:",
        axiosError.response.data.message || "An error occurred"
      );
    } else {
      console.error("Error:", "An error occurred");
    }
  } else {
    console.error("Error:", error);
  }
  return false;
};

// Optional: You can define an interface for the expected API response shape
interface EventApiResponse {
  data: Event[];
}

interface EventByIdApiResponse {
  data: Event;
}

export const getEvents = async (): Promise<Event[] | false> => {
  try {
    const response = await api.get<EventApiResponse>(
      "/api/v2/events/get-all-event"
    );

    const eventsArray = response.data.data;

    return Array.isArray(eventsArray) ? eventsArray : [];
  } catch (error) {
    return handleApiError(error, true);
  }
};

export const getEventById = async (eventId: string): Promise<Event | false> => {
  try {
    if (!eventId?.trim()) {
      return false;
    }

    const response = await api.get<EventByIdApiResponse>(
      `/api/v2/events/${eventId}`
    );

    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const createEvent = async (
  data: CreateEventData
): Promise<CreateEventResponse | false> => {
  try {
    const token = getAuthToken();
    const response = await axios.post<CreateEventResponse>(
      `${backendConnection()}/api/events/create-event`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error, true);
  }
};

export const updateEvent = async (
  eventId: string,
  data: Partial<Event>
): Promise<boolean> => {
  try {
    const token = getAuthToken();
    const response = await axios.put(
      `${backendConnection()}/api/events/update-event/${eventId}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      showToast("success", "Event updated successfully!");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating event:", error);
    const errorMessage = axios.isAxiosError(error)
      ? error.response?.data?.message || "Failed to update event"
      : "Failed to update event";
    showToast("error", errorMessage);
    return false;
  }
};

export const getAttendees = async (
  id: string
): Promise<AttendeesResponse | false> => {
  try {
    const token = getAuthToken();
    const response = await axios.get(
      `${backendConnection()}/api/events/attendees/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      data: response.data.data[0],
      attendees: response.data.data[0].attendees,
      merch: response.data.merch_data,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const markAsPresent = async (
  eventId: string,
  attendeeId: string,
  campus: string,
  course: string,
  year: string,
  attendeeName: string
): Promise<boolean | undefined> => {
  try {
    const token = getAuthToken();
    const url = `${backendConnection()}/api/events/attendance/${eventId}/${attendeeId}`;

    const response = await axios.put(
      url,
      {
        campus,
        attendeeName,
        course,
        year,
        currentDate: new Date(),
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      showToast("success", "Attendance successfully recorded!");
      return true;
    }
  } catch (error) {
    console.error("Error marking attendance:", error);

    if (axios.isAxiosError(error) && error.response) {
      showToast("error", error.response.data.message || "An error occurred");
    } else {
      showToast("error", "An error occurred while recording attendance.");
    }
  }
};

export const getEventCheck = async (
  eventId: string
): Promise<EventCheckData | false> => {
  try {
    const token = getAuthToken();
    const response = await axios.get<{ data: EventCheckData }>(
      `${backendConnection()}/api/events/check-limit/${eventId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateEventSettings = async (
  formData: UpdateSettingsFormData,
  eventId: string
): Promise<boolean> => {
  try {
    const token = getAuthToken();
    const response = await axios.post(
      `${backendConnection()}/api/events/update-settings/${eventId}`,
      formData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.status === 200;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getEligibleRaffleAttendees = async (
  eventId: string
): Promise<RaffleResponse | AxiosError> => {
  try {
    const token = getAuthToken();
    const response = await axios.get<RaffleResponse>(
      `${backendConnection()}/api/events/raffle/${eventId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching eligible attendees:", error);
    return error as AxiosError;
  }
};

export const raffleWinner = async (
  eventId: string,
  attendeeId: string,
  attendeeName: string
): Promise<RaffleWinnerResponse | AxiosError> => {
  try {
    const token = getAuthToken();
    const response = await axios.post<RaffleWinnerResponse>(
      `${backendConnection()}/api/events/raffle/winner/${eventId}/${attendeeId}`,
      { attendeeName },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error marking attendee as raffle winner:", error);
    return error as AxiosError;
  }
};

export const removeRaffleAttendee = async (
  eventId: string,
  attendeeId: string,
  attendeeName: string
): Promise<RemoveRaffleResponse | false> => {
  try {
    const token = getAuthToken();
    const response = await axios.put<RemoveRaffleResponse>(
      `${backendConnection()}/api/events/raffle/remove/${eventId}/${attendeeId}`,
      { attendeeName },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error removing attendee from raffle:", error);
    return false;
  }
};

export const addAttendee = async (
  formData: AddAttendeeFormData
): Promise<boolean> => {
  try {
    const token = getAuthToken();
    const response = await axios.post(
      `${backendConnection()}/api/events/add-attendee`,
      formData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    showToast(
      response.status === 200 ? "success" : "error",
      response.data.message
    );
    return response.status === 200;
  } catch (error) {
    console.error("Error adding attendee:", error);
    const errorMessage = axios.isAxiosError(error)
      ? error.response?.data?.message || "Something went wrong"
      : "Something went wrong";
    showToast("error", errorMessage);
    return false;
  }
};

export const getStatistic = async (
  eventId: string
): Promise<StatisticsData | [] | false> => {
  try {
    const token = getAuthToken();
    const response = await axios.get<StatisticsData>(
      `${backendConnection()}/api/events/get-statistics/${eventId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.status === 200 ? response.data : [];
  } catch (error) {
    return handleApiError(error);
  }
};

export const removeAttendee = async (
  formData: RemoveAttendeeFormData
): Promise<boolean | AxiosError> => {
  try {
    const token = getAuthToken();
    const response = await axios.post(
      `${backendConnection()}/api/events/remove-attendance`,
      formData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    showToast(
      response.status === 200 ? "success" : "error",
      response.data.message
    );
    return response.status === 200;
  } catch (error) {
    return error as AxiosError;
  }
};

export const removeEvent = async (
  eventId: string
): Promise<boolean | AxiosError> => {
  try {
    const token = getAuthToken();
    const response = await axios.post(
      `${backendConnection()}/api/events/remove-event`,
      { eventId },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    showToast(
      response.status === 200 ? "success" : "error",
      response.data.message
    );
    return response.status === 200;
  } catch (error) {
    return error as AxiosError;
  }
};
