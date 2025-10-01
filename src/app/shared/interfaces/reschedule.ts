// models/reschedule.model.ts
export interface RescheduleRequest {
  appointmentId: number;
  newTime: string; // بصيغة ISO 8601 زي: 2025-09-25T14:30:00Z
}

export interface RescheduleResponse {
  id: number;
  patientName: string;
  phone: string;
  date: string;          // التاريخ بصيغة ISO من السيرفر
  queueNumber: number;
  estimatedTime: string; // الوقت الجديد
  status: string;        // غالباً "Rescheduled"
}
