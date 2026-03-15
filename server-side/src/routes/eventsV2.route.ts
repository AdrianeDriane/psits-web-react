import { Router } from "express";
import {
  requireAccessTokenV2,
  requireAccessTokenWithDBCheck,
  roleAuthenticateV2,
} from "../middlewares/authV2.middleware";

import {
  addAttendeeV2Controller,
  getAllEventsV2Controller,
  getEventAttendeesV2Controller,
  getEventByIdV2Controller,
  getEventStatisticsV2Controller,
  getMyEventsController,
  markAttendanceV2Controller,
} from "../controllers/eventV2.controller";

const router = Router();

// GET all events
router.get(
  "/get-all-event",
  requireAccessTokenV2,
  roleAuthenticateV2(["Admin", "Student"]),
  getAllEventsV2Controller
);

// GET all events the student is attended in,
// with their attendance record filtered per event
router.get(
  "/my-events",
  requireAccessTokenV2,
  roleAuthenticateV2(["Student"]),
  getMyEventsController
);

// GET specific event
router.get(
  "/:eventId",
  requireAccessTokenV2,
  roleAuthenticateV2(["Admin", "Student"]),
  getEventByIdV2Controller
);

// GET paginated attendees for specific event
router.get(
  "/:eventId/attendees",
  requireAccessTokenV2,
  roleAuthenticateV2(["Admin"]),
  getEventAttendeesV2Controller
);

// GET statistics for specific event
router.get(
  "/:eventId/statistics",
  requireAccessTokenV2,
  roleAuthenticateV2(["Admin"]),
  getEventStatisticsV2Controller
);

// POST add attendee (creates user account if needed + registers as attendee)
router.post(
  "/:eventId/attendees",
  requireAccessTokenWithDBCheck,
  roleAuthenticateV2(["Admin"]),
  addAttendeeV2Controller
);

// PUT mark attendance for a specific attendee in an event
router.put(
  "/:eventId/attendance/:idNumber",
  requireAccessTokenWithDBCheck,
  roleAuthenticateV2(["Admin"]),
  markAttendanceV2Controller
);

export default router;
