import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { attendeeRegistrationMail } from "../mail_template/mail.template";
import { IAttendee } from "../models/attendee.interface";
import { IEvent } from "../models/event.interface";
import { Event } from "../models/event.model";
import { Merch } from "../models/merch.model";
import { Student } from "../models/student.model";

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

type AttendeeAttendanceFilter =
  | "morning_attended"
  | "afternoon_attended"
  | "evening_attended"
  | "no_sessions_attended";

interface AttendeeQueryParams {
  page: number;
  limit: number;
  search?: string;
  campus?: string;
  attendanceStatus?: AttendeeAttendanceFilter[];
  course?: string[];
  yearLevel?: number[];
  registeredOn?: string;
  exportAll?: boolean;
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

const parseAttendanceStatusFilter = (
  value: unknown
): AttendeeAttendanceFilter[] | undefined => {
  const values = parseCsvString(value);
  if (!values) return undefined;

  const allowed: AttendeeAttendanceFilter[] = [
    "morning_attended",
    "afternoon_attended",
    "evening_attended",
    "no_sessions_attended",
  ];
  const filtered = values.filter((item): item is AttendeeAttendanceFilter =>
    allowed.includes(item as AttendeeAttendanceFilter)
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

const parseRegisteredOn = (value: unknown): string | undefined => {
  if (typeof value !== "string" || !value.trim()) return undefined;

  const normalized = value.trim();
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateOnlyPattern.test(normalized)) return undefined;

  const [year, month, day] = normalized.split("-").map((part) => Number(part));
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return undefined;
  }

  return normalized;
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
    attendanceStatus: parseAttendanceStatusFilter(
      req.query.attendanceStatus ?? req.query.status
    ),
    course: parseCsvString(req.query.course),
    yearLevel: parseYearLevelFilter(req.query.yearLevel),
    registeredOn: parseRegisteredOn(
      req.query.registeredOn ?? req.query.confirmedOn
    ),
    exportAll: req.query.exportAll === "true",
  };
};

const isAttendeePresent = (attendee: IAttendee): boolean => {
  const attendance = attendee.attendance;
  if (!attendance) return false;

  return [attendance.morning, attendance.afternoon, attendance.evening].some(
    (session) => Boolean(session?.attended)
  );
};

const getAttendeeAttendanceStatuses = (
  attendee: IAttendee
): AttendeeAttendanceFilter[] => {
  const statuses: AttendeeAttendanceFilter[] = [];
  const attendance = attendee.attendance;

  if (attendance?.morning?.attended) {
    statuses.push("morning_attended");
  }
  if (attendance?.afternoon?.attended) {
    statuses.push("afternoon_attended");
  }
  if (attendance?.evening?.attended) {
    statuses.push("evening_attended");
  }

  if (statuses.length === 0) {
    statuses.push("no_sessions_attended");
  }

  return statuses;
};

const formatDateInTimeZone = (
  dateValue: Date,
  timeZone: string
): string | null => {
  if (Number.isNaN(dateValue.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(dateValue);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return null;
  }

  return `${year}-${month}-${day}`;
};

const isSameDay = (
  dateValue: Date | null | undefined,
  yyyyMmDd: string
): boolean => {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const attendeeDateInManila = formatDateInTimeZone(date, "Asia/Manila");
  return attendeeDateInManila === yyyyMmDd;
};

const matchesCampusFilter = (
  attendeeCampus: string,
  campusFilter: string
): boolean => {
  if (campusFilter === "UC-Main") {
    return attendeeCampus === "UC-Main" || attendeeCampus === "UC-CS";
  }

  return attendeeCampus === campusFilter;
};

const filterAttendees = (
  attendees: IAttendee[],
  params: AttendeeQueryParams
): IAttendee[] => {
  return attendees.filter((attendee) => {
    if (params.campus && !matchesCampusFilter(attendee.campus, params.campus)) {
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

    if (params.attendanceStatus && params.attendanceStatus.length > 0) {
      const attendeeStatuses = getAttendeeAttendanceStatuses(attendee);
      const matchesAttendanceStatus = params.attendanceStatus.some((status) =>
        attendeeStatuses.includes(status)
      );

      if (!matchesAttendanceStatus) {
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

    if (params.registeredOn) {
      if (!isSameDay(attendee.transactDate, params.registeredOn)) {
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

interface MerchSizeDto {
  custom: boolean;
  price: string;
}

interface EventMerchDto {
  category: string | null;
  type: string | null;
  selectedSizes: Record<string, MerchSizeDto>;
  selectedVariations: string[];
}

type EventWithoutAttendees = Omit<IEvent, "attendees"> & {
  _id: unknown;
  __v?: unknown;
};

type EventByIdV2ResponseDto = EventWithoutAttendees & {
  merch: EventMerchDto | null;
};

const normalizeMerchSizes = (value: unknown): Record<string, MerchSizeDto> => {
  if (!value || typeof value !== "object") {
    return {};
  }

  if (value instanceof Map) {
    return Array.from(value.entries()).reduce<Record<string, MerchSizeDto>>(
      (acc, [size, config]) => {
        if (typeof size !== "string" || !config || typeof config !== "object") {
          return acc;
        }

        const parsed = config as { custom?: unknown; price?: unknown };
        acc[size] = {
          custom: Boolean(parsed.custom),
          price: String(parsed.price ?? "0"),
        };
        return acc;
      },
      {}
    );
  }

  return Object.entries(value).reduce<Record<string, MerchSizeDto>>(
    (acc, [size, config]) => {
      if (!config || typeof config !== "object") {
        return acc;
      }

      const parsed = config as { custom?: unknown; price?: unknown };
      acc[size] = {
        custom: Boolean(parsed.custom),
        price: String(parsed.price ?? "0"),
      };
      return acc;
    },
    {}
  );
};

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

    const merchDocument = await Merch.findById(event.eventId)
      .select("category type selectedSizes selectedVariations")
      .lean();

    const merch: EventMerchDto | null = merchDocument
      ? {
          category:
            typeof merchDocument.category === "string"
              ? merchDocument.category
              : null,
          type:
            typeof merchDocument.type === "string" ? merchDocument.type : null,
          selectedSizes: normalizeMerchSizes(merchDocument.selectedSizes),
          selectedVariations: Array.isArray(merchDocument.selectedVariations)
            ? merchDocument.selectedVariations.map((item) => String(item))
            : [],
        }
      : null;

    const eventObject = event.toObject() as EventWithoutAttendees;
    const responseDto: EventByIdV2ResponseDto = {
      ...eventObject,
      merch,
    };

    return res.status(200).json({ data: responseDto });
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
    const requesterCampusScope =
      requesterCampus === "UC-CS" ? "UC-Main" : requesterCampus;
    const isUcMainAdmin = requesterCampus === "UC-Main";

    const effectiveCampus = isUcMainAdmin
      ? params.campus
      : requesterCampusScope;

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

// ── Add Attendee V2 ─────────────────────────────────────────────────────

// Validation constants (mirror frontend rules)
const V_NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'.,-]+$/;
const V_NAME_MIN = 2;
const V_NAME_MAX = 50;
const V_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
const V_PWD_MIN = 8;
const V_STUDENT_ID_REGEX = /^\d{8}$/;
const V_VALID_COURSES = ["BSIT", "BSCS", "ACT"];
const V_VALID_CAMPUSES = ["UC-Banilad", "UC-LM", "UC-PT"];
const V_DISABLED_ADD_ATTENDEE_CAMPUSES = ["UC-Main", "UC-CS"];

const CAMPUS_ID_SUFFIX: Record<string, string> = {
  "UC-Banilad": "ucb",
  "UC-LM": "uclm",
  "UC-PT": "ucpt",
};

const buildCampusScopedStudentId = (rawStudentId: string, campus: string) => {
  const baseId = rawStudentId.trim().split("-")[0]?.trim() ?? "";
  const suffix = CAMPUS_ID_SUFFIX[campus];

  if (!baseId || !suffix) {
    return null;
  }

  return `${baseId}-${suffix}`;
};

const validateNameField = (
  value: string | undefined,
  label: string,
  required: boolean
): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return required ? `${label} is required` : null;
  if (trimmed.length < V_NAME_MIN)
    return `${label} must be at least ${V_NAME_MIN} characters`;
  if (trimmed.length > V_NAME_MAX)
    return `${label} must not exceed ${V_NAME_MAX} characters`;
  if (!V_NAME_REGEX.test(trimmed))
    return `${label} contains invalid characters`;
  return null;
};

const validatePasswordStrength = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < V_PWD_MIN)
    return `Password must be at least ${V_PWD_MIN} characters`;
  if (!/[A-Z]/.test(password))
    return "Password must include at least 1 uppercase letter";
  if (!/[a-z]/.test(password))
    return "Password must include at least 1 lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must include at least 1 number";
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password))
    return "Password must include at least 1 symbol";
  return null;
};

const parseYearLevel = (yearLevel: string): number | null => {
  const num = parseInt(yearLevel, 10);
  if (!Number.isFinite(num) || num < 1 || num > 4) return null;
  return num;
};

interface AddAttendeeV2Body {
  studentId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  course?: string;
  yearLevel?: string;
  shirtSize?: string;
  shirtPrice?: number;
  password?: string;
}

export const addAttendeeV2Controller = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    // ── Auth guard ──────────────────────────────────────────────────────
    const claims = req.userV2;
    if (!claims || claims.role !== "Admin") {
      return res.status(403).json({
        error: "INSUFFICIENT_PERMISSIONS",
        message: "Admin access required",
      });
    }

    const adminCampus = claims.campus;
    if (V_DISABLED_ADD_ATTENDEE_CAMPUSES.includes(adminCampus)) {
      return res.status(403).json({
        error: "INSUFFICIENT_PERMISSIONS",
        message: `Adding attendees via V2 is not allowed for ${adminCampus}`,
      });
    }

    if (!V_VALID_CAMPUSES.includes(adminCampus)) {
      return res.status(400).json({
        error: "INVALID_CAMPUS",
        message: "Admin campus is invalid",
      });
    }

    // ── Event ID param ──────────────────────────────────────────────────
    const { eventId } = req.params;
    const query = buildEventLookupQuery(eventId);
    if (!query) {
      return res.status(400).json({
        error: "INVALID_EVENT_ID",
        message: "Invalid event ID format",
      });
    }

    // ── Body extraction & validation ────────────────────────────────────
    const {
      studentId,
      firstName,
      middleName,
      lastName,
      email,
      course,
      yearLevel,
      shirtSize,
      shirtPrice,
      password,
    } = req.body as AddAttendeeV2Body;

    // Required field presence
    if (!studentId?.trim()) {
      return res
        .status(400)
        .json({ error: "VALIDATION", message: "Student ID is required" });
    }

    if (!V_STUDENT_ID_REGEX.test(studentId.trim())) {
      return res.status(400).json({
        error: "VALIDATION",
        message: "Student ID must be exactly 8 digits",
      });
    }

    const normalizedStudentId = buildCampusScopedStudentId(
      studentId,
      adminCampus
    );
    if (!normalizedStudentId) {
      return res.status(400).json({
        error: "VALIDATION",
        message: "Unable to derive campus-based Student ID",
      });
    }

    const firstNameErr = validateNameField(firstName, "First name", true);
    if (firstNameErr) {
      return res
        .status(400)
        .json({ error: "VALIDATION", message: firstNameErr });
    }

    const middleNameErr = validateNameField(middleName, "Middle name", false);
    if (middleNameErr) {
      return res
        .status(400)
        .json({ error: "VALIDATION", message: middleNameErr });
    }

    const lastNameErr = validateNameField(lastName, "Last name", true);
    if (lastNameErr) {
      return res
        .status(400)
        .json({ error: "VALIDATION", message: lastNameErr });
    }

    if (!email?.trim()) {
      return res
        .status(400)
        .json({ error: "VALIDATION", message: "Email is required" });
    }
    if (!V_EMAIL_REGEX.test(email.trim())) {
      return res
        .status(400)
        .json({ error: "VALIDATION", message: "Invalid email format" });
    }

    if (!course?.trim() || !V_VALID_COURSES.includes(course.trim())) {
      return res
        .status(400)
        .json({ error: "VALIDATION", message: "Invalid course" });
    }

    if (!yearLevel?.trim()) {
      return res
        .status(400)
        .json({ error: "VALIDATION", message: "Year level is required" });
    }
    const yearNumber = parseYearLevel(yearLevel);
    if (yearNumber === null) {
      return res
        .status(400)
        .json({ error: "VALIDATION", message: "Invalid year level" });
    }

    if (!password) {
      return res
        .status(400)
        .json({ error: "VALIDATION", message: "Password is required" });
    }
    const pwdErr = validatePasswordStrength(password);
    if (pwdErr) {
      return res.status(400).json({ error: "VALIDATION", message: pwdErr });
    }

    // ── Fetch event ─────────────────────────────────────────────────────
    const event = await Event.findOne(query);
    if (!event) {
      return res
        .status(404)
        .json({ error: "EVENT_NOT_FOUND", message: "Event not found" });
    }

    const campusLimit = event.limit.find(
      (entry) => entry.campus === adminCampus
    );
    const campusAttendeeCount = Array.isArray(event.attendees)
      ? event.attendees.filter((attendee) => attendee.campus === adminCampus)
          .length
      : 0;

    if (
      campusLimit &&
      campusLimit.limit > 0 &&
      campusAttendeeCount >= campusLimit.limit
    ) {
      return res.status(409).json({
        error: "CAMPUS_LIMIT_REACHED",
        message: `Campus attendee limit reached for ${adminCampus}`,
      });
    }

    // ── Duplicate attendee check ────────────────────────────────────────
    const attendeeList = Array.isArray(event.attendees)
      ? (event.attendees as unknown as IAttendee[])
      : [];

    const alreadyRegistered = attendeeList.some(
      (a) => a.id_number === normalizedStudentId && a.campus === adminCampus
    );
    if (alreadyRegistered) {
      return res.status(409).json({
        error: "ATTENDEE_EXISTS",
        message: "Student is already registered for this event at this campus",
      });
    }

    // ── Validate user-provided price ──────────────────────────────────
    if (shirtPrice == null) {
      return res
        .status(400)
        .json({ error: "VALIDATION", message: "Price is required" });
    }
    const resolvedPrice = Number(shirtPrice);
    if (!Number.isFinite(resolvedPrice) || resolvedPrice < 0) {
      return res.status(400).json({
        error: "VALIDATION",
        message: "Price must be a non-negative number",
      });
    }

    // ── Check existing student ──────────────────────────────────────────
    const existingStudent = await Student.findOne({
      id_number: normalizedStudentId,
    });
    const isNewStudent = !existingStudent;

    // For new students, verify email is not already taken
    if (isNewStudent) {
      const emailTaken = await Student.findOne({
        email: email.trim().toLowerCase(),
      });
      if (emailTaken) {
        return res.status(409).json({
          error: "EMAIL_CONFLICT",
          message: "A student with this email already exists",
        });
      }
    }

    // ── Build attendee name ─────────────────────────────────────────────
    const attendeeName = [
      firstName!.trim(),
      middleName?.trim(),
      lastName!.trim(),
    ]
      .filter(Boolean)
      .join(" ");

    // ── Transaction ─────────────────────────────────────────────────────
    session.startTransaction();

    // Step 1: Create student if new
    if (isNewStudent) {
      const hashedPassword = await bcrypt.hash(password, 10);

      await Student.create(
        [
          {
            id_number: normalizedStudentId,
            rfid: "N/A",
            password: hashedPassword,
            first_name: firstName!.trim(),
            middle_name: middleName?.trim() ?? "",
            last_name: lastName!.trim(),
            email: email.trim(),
            course: course!.trim(),
            year: yearNumber,
            status: "True",
            membershipStatus: "NOT_APPLIED",
            campus: adminCampus,
            role: "all",
            isRequest: false,
            isYearUpdated: true,
            isFirstApplication: true,
          },
        ],
        { session }
      );
    }

    // Step 2: Push attendee into event
    event.attendees.push({
      id_number: normalizedStudentId,
      name: attendeeName,
      course: course!.trim(),
      year: yearNumber,
      campus: adminCampus,
      shirtSize: shirtSize?.trim() ?? "",
      shirtPrice: resolvedPrice,
      transactBy: claims.idNumber,
      transactDate: new Date(),
      attendance: {
        morning: { attended: false, timestamp: null },
        afternoon: { attended: false, timestamp: null },
        evening: { attended: false, timestamp: null },
      },
      confirmedBy: "",
      raffleIsRemoved: false,
      raffleIsWinner: false,
    } as IAttendee);

    // Step 3: Update sales data (campus-specific)
    if (resolvedPrice > 0) {
      const campusData = event.sales_data.find((s) => s.campus === adminCampus);
      if (campusData) {
        campusData.unitsSold += 1;
        campusData.totalRevenue += resolvedPrice;
      }
      event.totalUnitsSold = (event.totalUnitsSold ?? 0) + 1;
      event.totalRevenueAll = (event.totalRevenueAll ?? 0) + resolvedPrice;
    }

    await event.save({ session });

    await session.commitTransaction();
    session.endSession();

    let emailSent = true;
    if (isNewStudent) {
      try {
        await attendeeRegistrationMail({
          studentName: attendeeName,
          studentEmail: email.trim(),
          eventName: event.eventName,
          campus: adminCampus,
          studentId: normalizedStudentId,
          password: password,
        });
      } catch (emailError) {
        emailSent = false;
        console.error("Failed to send registration email:", emailError);
      }
    }

    return res.status(201).json({
      message: isNewStudent
        ? emailSent
          ? "Account created and attendee registered successfully"
          : "Account created and attendee registered successfully, but email notification failed"
        : "Attendee registered successfully",
      data: {
        isNewStudent,
        emailSent,
        attendee: {
          id_number: normalizedStudentId,
          name: attendeeName,
          campus: adminCampus,
          course: course!.trim(),
          year: yearNumber,
          shirtSize: shirtSize?.trim() ?? "",
          shirtPrice: resolvedPrice,
        },
      },
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    console.error("Error in addAttendeeV2Controller:", error);

    // Duplicate key error (race condition on id_number)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      return res.status(409).json({
        error: "DUPLICATE_ENTRY",
        message: "Student ID already exists",
      });
    }

    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Internal server error",
    });
  }
};
export const getMyEventsController = async (req: Request, res: Response) => {
  try {
    const idNumber = req.userV2?.idNumber;
    const campus = req.userV2?.campus;

    if (!idNumber) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Exclude sensitive/unnecessary fields with - prefix
    const events = await Event.find()
      .select("-totalRevenueAll -totalUnitsSold -limit -sales_data")
      .sort({ eventDate: 1 })
      .lean();

    // Just filter attendees
    const filteredEvents = events.map((event) => ({
      ...event,
      attendees: (event.attendees || []).filter((att) => {
        if (!campus) {
          return att.id_number === idNumber;
        }
        return (
          att.id_number === idNumber &&
          att.campus?.toLowerCase() === campus.toLowerCase()
        );
      }),
    }));

    return res.status(200).json({ data: filteredEvents });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
