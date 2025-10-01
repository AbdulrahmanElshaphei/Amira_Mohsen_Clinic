// src/app/shared/interfaces/create-appointment.ts
export interface CreateAppointmentRequest {
  name: string;
  phone: string;
  bookingDate: string; // yyyy-MM-dd
  appointmentType: number; // 0 = Checkup, 1 = Contract ✅
}

export interface CreateAppointmentResponse {
  id: number;
  patientName: string;
  phone: string;
  date: string;
  queueNumber: number;
  estimatedTime: string;
  status: string;
  appointmentType?: string; // لو الـ API بترجعها كـ نص "Contract" أو "Checkup"
}
