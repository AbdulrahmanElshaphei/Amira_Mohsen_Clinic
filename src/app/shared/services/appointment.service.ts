import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment } from '../interfaces/appointment';
import { AuthService } from './auth.service';
import { AppointmentInfo } from '../interfaces/appointment-info';
import { ClinicHours } from '../interfaces/clinic-hours';
import { throwError } from 'rxjs';
import { CreateAppointmentRequest, CreateAppointmentResponse } from '../interfaces/create-appointment';
import { ChangeDayStatusRequest, ChangeDayStatusResponse } from '../interfaces/change-day-status';
import { RescheduleRequest, RescheduleResponse } from '../interfaces/reschedule';
import { RescheduleAppointment } from '../interfaces/appointmentmodel';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'https://amiramohsenclinic.com/api/Dashboard/appointments';

  constructor(private http: HttpClient, private authService: AuthService) { }

  // جلب كل المواعيد
  getAppointments(): Observable<Appointment[]> {
    const token = this.authService.getToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<Appointment[]>(this.apiUrl, { headers });
  }

  // appointment.service.ts
completeAppointment(appointmentId: number, status: number = 1) {
  const token = this.authService.getToken();

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  const body = {
    appointmentId,
    status
  };

  return this.http.put(`${this.apiUrl}/complete`, body, { headers });
}


// إلغاء الحجز
cancelAppointment(appointmentId: number): Observable<any> {
  const url = `${this.apiUrl}/cancel`;

  const body = {
    appointmentId: appointmentId,
    status: 2
  };

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${this.authService.getToken()}`, // هات التوكن من الـ service اللي عندك
    'Content-Type': 'application/json'
  });

  return this.http.put(url, body, { headers });
}



// في appointment.service.ts

trackAppointment(phoneNumber: string, date: string): Observable<AppointmentInfo> {
  // شيل أي صفر في الأول بعد +20
  let formattedPhone = phoneNumber;
  if (!phoneNumber.startsWith('+20')) {
    formattedPhone = `+20${phoneNumber.replace(/^0+/, '')}`;
  }

  const params = new HttpParams()
    .set('phoneNumber', formattedPhone)
    .set('date', date);

  return this.http.get<AppointmentInfo>(
    `https://amiramohsenclinic.com/api/Appointments/track`,
    { params }
  );
}






setClinicHours(payload: ClinicHours): Observable<any> {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    console.error('No auth token found');
    return throwError(() => new Error('Not authenticated'));
  }

  return this.http.post('https://amiramohsenclinic.com/api/Dashboard/set-clinic-hours', payload, {
    headers: new HttpHeaders({
      'Authorization': `Bearer ${token}`
    })
  });
}





createAppointment(data: CreateAppointmentRequest): Observable<CreateAppointmentResponse> {
  const url = 'https://amiramohsenclinic.com/api/Appointments/book';
  
  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  return this.http.post<CreateAppointmentResponse>(url, data, { headers });
}


changeDayStatus(request: ChangeDayStatusRequest): Observable<ChangeDayStatusResponse> {
  const token = localStorage.getItem('adminToken'); // ✅ خذ التوكن من الـ localStorage
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}) // لو فيه توكن ضيفه
    });

    return this.http.post<ChangeDayStatusResponse>(
      'https://amiramohsenclinic.com/api/Dashboard/change-day-status',
      request,
      { headers }
    );
  }




changeDayStatus2(request: ChangeDayStatusRequest): Observable<ChangeDayStatusResponse> {
    const token = localStorage.getItem('adminToken'); // ✅ خذ التوكن من الـ localStorage
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}) // لو فيه توكن ضيفه
    });

    return this.http.post<ChangeDayStatusResponse>(
      'https://amiramohsenclinic.com/api/Dashboard/toggle-clinic-day-status',
      request,
      { headers }
    );
  }









  // ✅ ميثود تأجيل الميعاد مع إضافة الـ headers
// appointment.service.ts
rescheduleAppointment(request: RescheduleRequest): Observable<RescheduleResponse> {
  const token = localStorage.getItem('adminToken');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  return this.http.put<RescheduleResponse>(
    'https://amiramohsenclinic.com/api/Dashboard/reschedule',
    request,
    { headers }
  );
}




private apiUrl2 = 'https://amiramohsenclinic.com/api/Dashboard/reschedule-other-day';

// 🔹 تأجيل لموعد آخر يوم
  rescheduleAppointmentDay(request: RescheduleRequest, token: string): Observable<RescheduleAppointment> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<RescheduleAppointment>(
      `${this.apiUrl2}`,
      request,
      { headers }
    );
  }
  




}
