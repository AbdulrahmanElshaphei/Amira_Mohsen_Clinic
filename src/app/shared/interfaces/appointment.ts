export interface Appointment {
  id: number;
  patientName: string;
  phone: string;
  date: string;          // ISO string
  queueNumber: number;
  estimatedTime: string; // ISO string
  status: 'Waiting' | 'Completed' | 'Cancelled';
  appointmentType: 'تعاقد' | 'كشف';
}

export interface DashboardResponse {
  count: number;
  appointments: Appointment[];
}
