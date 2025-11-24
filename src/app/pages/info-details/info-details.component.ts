// src/app/pages/info-details/info-details.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../shared/services/appointment.service';
import { AppointmentInfo } from '../../shared/interfaces/appointment-info';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-info-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './info-details.component.html',
  styleUrls: ['./info-details.component.scss']
})
export class InfoDetailsComponent implements OnInit {
  booking: AppointmentInfo | null = null;
  loading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private appointmentService: AppointmentService,
    private toastr: ToastrService
  ) {}

  private normalizePhone(phone: string) {
    let p = phone.trim();
    if (!p) return p;
    if (!p.startsWith('+')) {
      if (p.startsWith('0')) p = '+20' + p.slice(1);
      else p = '+20' + p;
    }
    return p;
  }

  ngOnInit(): void {
    const phone = this.route.snapshot.queryParamMap.get('phoneNumber');
    const date = this.route.snapshot.queryParamMap.get('date'); // متوقع yyyy-MM-dd

    if (!phone || !date) {
      // بيانات ناقصة: ظهرت لك الرسالة "لا توجد بيانات..."
      this.loading = false;
      this.errorMessage = '❌ لا توجد بيانات لعرضها، برجاء إعادة البحث.';
      return;
    }

    const phoneForApi = this.normalizePhone(phone);

    this.appointmentService.trackAppointment(phoneForApi, date).subscribe({
      next: (res: AppointmentInfo) => {
        this.booking = res;
        this.loading = false;
        console.log('✅ Appointment found (details):', res);
      },
      error: (err) => {
        console.error('Error fetching appointment:', err);
        this.errorMessage = 'لم يتم العثور على الحجز أو حدث خطأ في الخادم.';
        this.loading = false;
      }
    });
  }






cancelBooking() {
  if (!this.booking) return;

  const phone = this.booking.phone;

  // التاريخ النصي الأصلي بدون أي تحويل
  const dateForApi = this.booking.date.replace('Z', '');

  console.log("Sending to cancel API:", dateForApi);

  this.appointmentService.cancelByPatient(phone, dateForApi).subscribe({
    next: () => {
      this.toastr.success('تم إلغاء حجزك بنجاح');
      this.booking!.status = 'Cancelled';
    },
    error: () => {
      this.toastr.error('حدث خطأ أثناء إلغاء الحجز');
    }
  });
}


}
