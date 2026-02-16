import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface DoctorAnnouncement {
  id: number;
  message: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private baseUrl = 'https://amiramohsenclinic.com/api/DoctorAnnouncements';

  constructor(private http: HttpClient) {}

  addAnnouncement(message: string): Observable<DoctorAnnouncement> {
    return this.http.post<DoctorAnnouncement>(this.baseUrl, { message });
  }

  getAnnouncements() {
  return this.http.get<DoctorAnnouncement[]>(this.baseUrl);
}

deleteAnnouncement(id: number) {
  return this.http.delete(`${this.baseUrl}/${id}`);
}
}