export const ATTENDANCE_STATUS = {
  PRESENT: "Present",
  ABSENT: "Absent",
  PENDING: "Pending",
  NOT_RECORDED: "Not Recorded",
} as const;

export const ATTENDANCE_COLORS = {
  present: {
    badge: "bg-green-100 text-green-800",
    icon: "text-green-600",
  },
  absent: {
    badge: "bg-red-100 text-red-700",
    icon: "text-red-400",
  },
  pending: {
    badge: "bg-gray-100 text-gray-500",
    icon: "text-gray-400",
  },
} as const;

export const SESSION_ROLE_LABELS = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
} as const;
