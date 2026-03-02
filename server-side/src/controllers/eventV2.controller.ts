import { Request, Response } from "express";
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
