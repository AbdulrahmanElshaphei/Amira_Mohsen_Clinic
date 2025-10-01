import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-rescheduled-appointments',
  standalone: true,
  imports: [],
  templateUrl: './rescheduled-appointments.component.html',
  styleUrl: './rescheduled-appointments.component.css'
})
export class RescheduledAppointmentsComponent implements OnInit{
   rescheduledAppointmentsDay: any[] = [];

  ngOnInit(): void {
    // تحميل الداتا من localStorage
    const saved = localStorage.getItem('rescheduledAppointmentsDay');
    if (saved) {
      this.rescheduledAppointmentsDay = JSON.parse(saved);
    }
  }
}
