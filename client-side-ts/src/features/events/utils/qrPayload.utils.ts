import type { QRCodePayloadV2 } from "@/features/events/types/event.types";

export const QR_PAYLOAD_VERSION = 2;

export const createQRPayload = (
  eventId: string,
  studentId: string,
  name: string,
  campus: string,
  course: string,
  year: number
): QRCodePayloadV2 => ({
  v: QR_PAYLOAD_VERSION,
  eventId,
  studentId,
  name,
  campus,
  course,
  year,
});
