import mongoose from "mongoose";
import { Event } from "../models/event.model";
import { ISessionConfig } from "../models/event.interface";
import { IAttendanceSession, IAttendee } from "../models/attendee.interface";

// ─── Constants ───────────────────────────────────────────────────────────────

const TIMEZONE = "Asia/Manila";

const SESSION_NAMES: Array<keyof ISessionConfig> = [
  "morning",
  "afternoon",
  "evening",
];

// ─── Error Class ─────────────────────────────────────────────────────────────

export class AttendanceError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "AttendanceError";
  }
}

export const ATTENDANCE_ERROR_STATUS_MAP: Record<string, number> = {
  INVALID_EVENT_ID: 400,
  EVENT_NOT_FOUND: 404,
  EVENT_NOT_ACTIVE: 400,
  WRONG_DATE: 400,
  NO_ACTIVE_SESSION: 400,
  AMBIGUOUS_SESSION: 400,
  ATTENDEE_NOT_FOUND: 404,
  ALREADY_RECORDED: 409,
};

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface MarkAttendanceInput {
  eventId: string;
  attendeeIdNumber: string;
  attendeeName: string;
  campus: string;
  course: string;
  year: number;
  confirmedByAdminName: string;
}

export interface MarkAttendanceResult {
  session: keyof IAttendanceSession;
  attendee: {
    id_number: string;
    name: string;
    campus: string;
    attendance: IAttendanceSession;
  };
  isNewAttendee: boolean;
}

// ─── Timezone Helpers ────────────────────────────────────────────────────────

/**
 * Get the current date string and time components in Asia/Manila timezone.
 * Uses Intl.DateTimeFormat — no manual UTC offset arithmetic.
 */
function getNowInManila(): {
  dateString: string;
  hour: number;
  minute: number;
} {
  const now = new Date();

  // Get YYYY-MM-DD in Manila timezone (en-CA locale produces ISO format)
  const dateString = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  // Get hour and minute in Manila timezone
  const timeParts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(timeParts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(timeParts.find((p) => p.type === "minute")?.value ?? 0);

  return { dateString, hour, minute };
}

/**
 * Format an event date as YYYY-MM-DD in Manila timezone for comparison.
 */
function getEventDateInManila(eventDate: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(eventDate));
}

// ─── Query Helper ────────────────────────────────────────────────────────────

/**
 * Build a query that matches an event by either _id or eventId.
 * Mirrors the pattern from eventV2.controller.ts buildEventLookupQuery.
 */
function buildEventLookupQuery(eventId: string) {
  const objectId = new mongoose.Types.ObjectId(eventId);
  return { $or: [{ _id: objectId }, { eventId: objectId }] };
}

// ─── Core Service Function ──────────────────────────────────────────────────

export async function markAttendance(
  input: MarkAttendanceInput
): Promise<MarkAttendanceResult> {
  // 1. Validate eventId format
  if (!mongoose.Types.ObjectId.isValid(input.eventId)) {
    throw new AttendanceError("INVALID_EVENT_ID", "Invalid event ID format");
  }

  // 2. Find event
  const query = buildEventLookupQuery(input.eventId);
  const event = await Event.findOne(query);
  if (!event) {
    throw new AttendanceError("EVENT_NOT_FOUND", "Event not found");
  }

  // 3. Check event status
  if (event.status !== "Ongoing") {
    throw new AttendanceError(
      "EVENT_NOT_ACTIVE",
      "This event is not currently active."
    );
  }

  // 4. Get current Manila time and compare dates
  const manila = getNowInManila();
  const eventDateManila = getEventDateInManila(event.eventDate);

  if (manila.dateString !== eventDateManila) {
    throw new AttendanceError(
      "WRONG_DATE",
      "Attendance can only be recorded on the event date."
    );
  }

  // 5. Find which session(s) the current time falls within
  const matchedSessions: Array<keyof ISessionConfig> = [];
  const currentMinutes = manila.hour * 60 + manila.minute;

  for (const sessionName of SESSION_NAMES) {
    const config = event.sessionConfig?.[sessionName];
    if (!config?.enabled || !config.timeRange) continue;

    const [startStr, endStr] = config.timeRange.split(" - ");
    const [sh, sm] = startStr.split(":").map(Number);
    const [eh, em] = endStr.split(":").map(Number);

    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      matchedSessions.push(sessionName);
    }
  }

  // 6. Validate session match count
  if (matchedSessions.length === 0) {
    throw new AttendanceError(
      "NO_ACTIVE_SESSION",
      "Current time does not fall within any active session."
    );
  }

  if (matchedSessions.length > 1) {
    throw new AttendanceError(
      "AMBIGUOUS_SESSION",
      `Ambiguous session time: current time matches multiple sessions (${matchedSessions.join(", ")})`
    );
  }

  const session = matchedSessions[0] as keyof IAttendanceSession;

  // 7. Find or create attendee based on attendanceType
  let attendee: IAttendee | undefined;
  let isNewAttendee = false;

  if (event.attendanceType === "open") {
    attendee = event.attendees.find(
      (a) => a.id_number === input.attendeeIdNumber
    );

    if (!attendee) {
      const newAttendee: IAttendee = {
        id_number: input.attendeeIdNumber,
        name: input.attendeeName,
        course: input.course || "Unknown",
        year: input.year || 1,
        campus: input.campus,
        attendance: {
          morning: { attended: false, timestamp: null },
          afternoon: { attended: false, timestamp: null },
          evening: { attended: false, timestamp: null },
        },
        confirmedBy: "",
        shirtPrice: 0,
        shirtSize: "",
        raffleIsRemoved: false,
        raffleIsWinner: false,
        transactBy: "",
        transactDate: null,
      };
      attendee = newAttendee;
      isNewAttendee = true;
    }
  } else {
    // "ticketed" mode — attendee must already exist
    attendee = event.attendees.find(
      (a) =>
        a.id_number === input.attendeeIdNumber &&
        a.name === input.attendeeName &&
        (a.campus === input.campus || input.campus === "UC-Main")
    );

    if (!attendee) {
      throw new AttendanceError(
        "ATTENDEE_NOT_FOUND",
        "Attendee not found in this event"
      );
    }
  }

  // 8. Check for duplicate attendance
  if (attendee.attendance?.[session]?.attended) {
    throw new AttendanceError(
      "ALREADY_RECORDED",
      `Attendance already recorded for ${session}`
    );
  }

  // 9. Initialize attendance object if missing
  if (!attendee.attendance) {
    attendee.attendance = {
      morning: { attended: false, timestamp: null },
      afternoon: { attended: false, timestamp: null },
      evening: { attended: false, timestamp: null },
    };
  }

  if (!attendee.attendance[session]) {
    attendee.attendance[session] = { attended: false, timestamp: null };
  }

  // 10. Mark attendance
  attendee.attendance[session] = {
    attended: true,
    timestamp: new Date(),
  };
  attendee.confirmedBy = input.confirmedByAdminName;

  // 11. Push new attendee or save existing
  if (isNewAttendee) {
    event.attendees.push(attendee);
  }

  event.markModified("attendees");
  await event.save();

  // 12. Return result
  return {
    session,
    attendee: {
      id_number: attendee.id_number,
      name: attendee.name,
      campus: attendee.campus,
      attendance: attendee.attendance,
    },
    isNewAttendee,
  };
}
