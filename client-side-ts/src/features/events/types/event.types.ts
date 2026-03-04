export interface ApiErrorResponse {
  message?: string;
}

export interface Event {
  eventId?: string;
  eventName: string;
  eventImage?: string[];
  eventDate: string | Date;
  eventDescription?: string;
  attendanceType?: string;
  sessionConfig?: Record<string, unknown>;
  createdBy?: string;
  attendees?: Attendee[];
  status?: string;
  limit?: unknown[];
  sales_data?: unknown[];
  totalUnitsSold?: number;
  totalRevenueAll?: number;
  merch?: EventMerchMeta | null;
  [key: string]: unknown;
}

export interface EventSizeOption {
  custom: boolean;
  price: string;
}

export interface EventMerchMeta {
  category: string | null;
  type: string | null;
  selectedSizes: Record<string, EventSizeOption>;
  selectedVariations: string[];
}

export interface Attendee {
  id_number: string;
  name: string;
  campus: string;
  course: string;
  year: number;
  attendance?: Record<string, unknown>;
  confirmedBy?: string;
  shirtSize?: string;
  shirtPrice?: number;
  raffleIsRemoved?: boolean;
  raffleIsWinner?: boolean;
  transactBy?: string;
  transactDate?: string | Date | null;
  isPresent?: boolean;
  [key: string]: unknown;
}

export interface MerchData {
  _id?: string;
  name?: string;
  price?: number;
  stocks?: number;
  [key: string]: unknown;
}

export interface AttendeesResponse {
  data: Event & { attendees: Attendee[] };
  attendees: Attendee[];
  merch: MerchData;
}

export interface GetAttendeesParams {
  page?: number;
  limit?: number;
  search?: string;
  campus?: string;
  status?: Array<"present" | "absent">;
  course?: string[];
  yearLevel?: string[];
  confirmedOn?: string;
}

export interface AttendeesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedAttendeesResponse {
  data: Attendee[];
  pagination: AttendeesPagination;
  access?: {
    isUcMainAdmin: boolean;
    campusScope: string;
  };
}

export interface EventCheckData {
  limit: number;
  currentCount: number;
  [key: string]: unknown;
}

export interface RaffleResponse {
  data: Attendee[];
  message: string;
}

export interface StatisticsData {
  totalAttendees: number;
  presentCount: number;
  [key: string]: unknown;
}

export interface CreateEventData {
  name: string;
  date: string;
  [key: string]: unknown;
}

export interface CreateEventResponse {
  message: string;
  eventId?: string;
  [key: string]: unknown;
}

export interface AddAttendeeFormData {
  eventId: string;
  attendeeId: string;
  name?: string;
  email?: string;
  campus?: string;
  course?: string;
  year?: number;
  shirtSize?: string;
  shirtPrice?: number;
  password?: string;
  [key: string]: unknown;
}

export interface AddAttendeeV2Payload {
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  course: string;
  yearLevel: string;
  shirtSize?: string;
  password: string;
}

export interface AddAttendeeV2Response {
  message: string;
  data: {
    isNewStudent: boolean;
    emailSent?: boolean;
    attendee: {
      id_number: string;
      name: string;
      campus: string;
      course: string;
      year: number;
      shirtSize: string;
      shirtPrice: number;
    };
  };
}

export interface RemoveAttendeeFormData {
  eventId: string;
  attendeeId: string;
  [key: string]: unknown;
}

export interface UpdateSettingsFormData {
  [key: string]: unknown;
}

export interface RaffleWinnerResponse {
  message: string;
  winner?: Attendee;
  [key: string]: unknown;
}

export interface RemoveRaffleResponse {
  message: string;
  [key: string]: unknown;
}
