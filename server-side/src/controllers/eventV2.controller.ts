import { Request, Response } from "express";
import { Event } from "../models/event.model";
import { Merch } from "../models/merch.model";
import mongoose, { Types } from "mongoose";
import { IEvent } from "../models/event.interface";
import { getSgDate } from "../custom_function/date.formatter";
import { ISessionConfig } from "../models/event.interface";
import { IAttendanceSession, IAttendee } from "../models/attendee.interface";

export const getAllEventsV2Controller = async (req: Request, res: Response) => {
  try {
    const events: IEvent[] = await Event.find().select("-attendees");

    if (!events || events.length === 0) {
      return res.status(404).json({ message: "No events found" });
    }

    return res.status(200).json({ data: events });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
