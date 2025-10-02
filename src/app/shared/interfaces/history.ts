export interface HistoryAppointment {
  id: number;
  patientName: string;
  phone: string;
  date: string;          // التاريخ الأصلي
  queueNumber: number;
  estimatedTime: string; // الميعاد الجديد أو وقت الدخول
  status: string;        // Waiting | Completed | Cancelled
  appointmentType: string; // Contract | Checkup
}

export interface HistoryResponse {
  count: number;
  appointments: HistoryAppointment[];
}
