import { Request, Response } from "express";
import mongoose from "mongoose";
import { Event } from "../models/event.model";
import { IEvent } from "../models/event.interface";

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
