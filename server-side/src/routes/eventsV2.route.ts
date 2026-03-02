import { Router } from "express";
import {
  requireAccessTokenV2,
  roleAuthenticateV2,
} from "../middlewares/authV2.middleware";
import {
  getAllEventsV2Controller,
  getEventByIdV2Controller,
} from "../controllers/eventV2.controller";

const router = Router();

// GET all events
router.get(
  "/get-all-event",
  requireAccessTokenV2,
  roleAuthenticateV2(["Admin", "Student"]),
  getAllEventsV2Controller
);

// GET specific event
router.get(
  "/:eventId",
  requireAccessTokenV2,
  roleAuthenticateV2(["Admin", "Student"]),
  getEventByIdV2Controller
);

export default router;
