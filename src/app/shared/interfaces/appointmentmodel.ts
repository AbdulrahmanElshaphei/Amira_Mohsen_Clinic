// src/app/shared/interfaces/appointment.ts

// الـ Body اللي بتبعتو
export interface RescheduleRequest {
  appointmentId: number;
  newTime: string; // yyyy-MM-dd
}

// الـ Response اللي بيرجع من الـ API
export interface RescheduleAppointment {
  id: number;
  patientName: string;
  phone: string;
  date: string;           // ميعاد الحجز الأصلي
  queueNumber: number;
  estimatedTime: string;  // الميعاد الجديد بعد التأجيل
  status: string;         // Rescheduled
  appointmentType: string;
}
