import { Request, Response } from "express";
import mongoose from "mongoose";
import { Event } from "../models/event.model";
import { IEvent } from "../models/event.interface";
import { IAttendee } from "../models/attendee.interface";

/**
 * Returns a Date object representing the start of the day (00:00:00)
 * 6 days prior to the current date.
 */
const getSevenDayWindowCutoffDate = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  date.setHours(0, 0, 0, 0);
  return date;
};

const buildEventLookupQuery = (eventId: string) => {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return null;
  }

  const objectId = new mongoose.Types.ObjectId(eventId);

  return {
    $or: [{ _id: objectId }, { eventId: objectId }],
  };
};

type AttendeeStatusFilter = "present" | "absent";

interface AttendeeQueryParams {
  page: number;
  limit: number;
  search?: string;
  campus?: string;
  status?: AttendeeStatusFilter[];
  course?: string[];
  yearLevel?: number[];
  confirmedOn?: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const parseNumberOrDefault = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
};

const normalizePagination = (pageRaw: unknown, limitRaw: unknown) => {
  const pageParsed = parseNumberOrDefault(pageRaw, DEFAULT_PAGE);
  const limitParsed = parseNumberOrDefault(limitRaw, DEFAULT_LIMIT);

  const page = pageParsed < 1 ? DEFAULT_PAGE : Math.floor(pageParsed);
  const limit =
    limitParsed < 1
      ? DEFAULT_LIMIT
      : Math.min(Math.floor(limitParsed), MAX_LIMIT);

  return { page, limit };
};

const parseCsvString = (value: unknown): string[] | undefined => {
  if (typeof value !== "string") return undefined;

  const values = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values : undefined;
};

const parseStatusFilter = (
  value: unknown
): AttendeeStatusFilter[] | undefined => {
  const values = parseCsvString(value);
  if (!values) return undefined;

  const allowed: AttendeeStatusFilter[] = ["present", "absent"];
  const filtered = values.filter((item): item is AttendeeStatusFilter =>
    allowed.includes(item as AttendeeStatusFilter)
  );

  return filtered.length > 0 ? filtered : undefined;
};

const parseYearLevelFilter = (value: unknown): number[] | undefined => {
  const values = parseCsvString(value);
  if (!values) return undefined;

  const years = values
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);

  return years.length > 0 ? years : undefined;
};

const parseConfirmedOn = (value: unknown): string | undefined => {
  if (typeof value !== "string" || !value.trim()) return undefined;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed.toISOString().slice(0, 10);
};

const normalizeAttendeeQueryParams = (req: Request): AttendeeQueryParams => {
  const { page, limit } = normalizePagination(req.query.page, req.query.limit);

  return {
    page,
    limit,
    search:
      typeof req.query.search === "string" && req.query.search.trim().length > 0
        ? req.query.search.trim()
        : undefined,
    campus:
      typeof req.query.campus === "string" && req.query.campus.trim().length > 0
        ? req.query.campus.trim()
        : undefined,
    status: parseStatusFilter(req.query.status),
    course: parseCsvString(req.query.course),
    yearLevel: parseYearLevelFilter(req.query.yearLevel),
    confirmedOn: parseConfirmedOn(req.query.confirmedOn),
  };
};

const isAttendeePresent = (attendee: IAttendee): boolean => {
  const attendance = attendee.attendance;
  if (!attendance) return false;

  return [attendance.morning, attendance.afternoon, attendance.evening].some(
    (session) => Boolean(session?.attended)
  );
};

const isSameDay = (
  dateValue: Date | null | undefined,
  yyyyMmDd: string
): boolean => {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  return date.toISOString().slice(0, 10) === yyyyMmDd;
};

const filterAttendees = (
  attendees: IAttendee[],
  params: AttendeeQueryParams
): IAttendee[] => {
  return attendees.filter((attendee) => {
    if (params.campus && attendee.campus !== params.campus) {
      return false;
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      const matchesSearch =
        attendee.name.toLowerCase().includes(q) ||
        attendee.id_number.toLowerCase().includes(q) ||
        attendee.course.toLowerCase().includes(q);

      if (!matchesSearch) return false;
    }

    if (params.status && params.status.length > 0) {
      const statusValue: AttendeeStatusFilter = isAttendeePresent(attendee)
        ? "present"
        : "absent";
      if (!params.status.includes(statusValue)) {
        return false;
      }
    }

    if (params.course && params.course.length > 0) {
      if (!params.course.includes(attendee.course)) {
        return false;
      }
    }

    if (params.yearLevel && params.yearLevel.length > 0) {
      if (!params.yearLevel.includes(attendee.year)) {
        return false;
      }
    }

    if (params.confirmedOn) {
      if (!isSameDay(attendee.transactDate, params.confirmedOn)) {
        return false;
      }
    }

    return true;
  });
};

interface AttendeeResponseDto {
  id_number: string;
  name: string;
  course: string;
  year: number;
  campus: string;
  attendance: IAttendee["attendance"];
  confirmedBy: string;
  shirtSize: string;
  shirtPrice: number;
  raffleIsRemoved: boolean;
  raffleIsWinner: boolean;
  transactBy: string;
  transactDate: Date | null;
  isPresent: boolean;
}

const mapPaginatedAttendees = (attendees: IAttendee[]) => {
  return attendees.map<AttendeeResponseDto>((attendee) => ({
    id_number: attendee.id_number,
    name: attendee.name,
    course: attendee.course,
    year: attendee.year,
    campus: attendee.campus,
    attendance: attendee.attendance,
    confirmedBy: attendee.confirmedBy,
    shirtSize: attendee.shirtSize,
    shirtPrice: attendee.shirtPrice,
    raffleIsRemoved: attendee.raffleIsRemoved,
    raffleIsWinner: attendee.raffleIsWinner,
    transactBy: attendee.transactBy,
    transactDate: attendee.transactDate,
    isPresent: isAttendeePresent(attendee),
  }));
};

export const getAllEventsV2Controller = async (req: Request, res: Response) => {
  try {
    const cutoffDate = getSevenDayWindowCutoffDate();

    const events: IEvent[] = await Event.find({
      eventDate: { $gte: cutoffDate },
    }).select("-attendees");

    if (!events || events.length === 0) {
      return res.status(404).json({ message: "No events found" });
    }

    return res.status(200).json({ data: events });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getEventByIdV2Controller = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    if (!eventId || typeof eventId !== "string") {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const query = buildEventLookupQuery(eventId);

    if (!query) {
      return res.status(400).json({ message: "Invalid event ID format" });
    }

    const event = await Event.findOne(query).select("-attendees");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.status(200).json({ data: event });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getEventAttendeesV2Controller = async (
  req: Request,
  res: Response
) => {
  try {
    const { eventId } = req.params;

    if (!eventId || typeof eventId !== "string") {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const query = buildEventLookupQuery(eventId);

    if (!query) {
      return res.status(400).json({ message: "Invalid event ID format" });
    }

    const claims = req.userV2;

    if (!claims || claims.role !== "Admin") {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    const params = normalizeAttendeeQueryParams(req);
    const requesterCampus = claims.campus;
    const isUcMainAdmin = requesterCampus === "UC-Main";

    const effectiveCampus = isUcMainAdmin ? params.campus : requesterCampus;

    const event = await Event.findOne(query).select("attendees eventId");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const attendeeList = Array.isArray(event.attendees)
      ? (event.attendees as unknown as IAttendee[])
      : [];

    const filteredAttendees = filterAttendees(attendeeList, {
      ...params,
      campus: effectiveCampus,
    });

    const total = filteredAttendees.length;
    const totalPages = total === 0 ? 1 : Math.ceil(total / params.limit);
    const page = Math.min(params.page, totalPages);
    const startIndex = (page - 1) * params.limit;
    const paginated = filteredAttendees.slice(
      startIndex,
      startIndex + params.limit
    );

    return res.status(200).json({
      data: mapPaginatedAttendees(paginated),
      pagination: {
        page,
        limit: params.limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      access: {
        isUcMainAdmin,
        campusScope: effectiveCampus ?? "all",
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
