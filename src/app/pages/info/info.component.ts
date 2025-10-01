// src/app/pages/info/info.component.ts
import { AfterViewInit, Component, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AppointmentService } from '../../shared/services/appointment.service';
import { AppointmentInfo } from '../../shared/interfaces/appointment-info';
import { ToastrService } from 'ngx-toastr';
import flatpickr from 'flatpickr';
import { Arabic } from 'flatpickr/dist/l10n/ar.js';

@Component({
  selector: 'app-info',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  providers: [DatePipe],
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.css']
})
export class InfoComponent implements AfterViewInit {
  phoneNumber = '';
  date = ''; // متوقع input type="date" => yyyy-MM-dd
  errorMessage = '';
  loading = false;
  today: string = '';

  constructor(
    private appointmentService: AppointmentService,
    private datePipe: DatePipe,
    private router: Router,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  private normalizePhone(phone: string) {
    let p = phone.trim();
    if (!p) return p;
    if (!p.startsWith('+')) {
      if (p.startsWith('0')) p = '+20' + p.slice(1);
      else p = '+20' + p;
    }
    return p;
  }

  search() {
    this.errorMessage = '';
    if (!this.phoneNumber || !this.date) {
      this.errorMessage = 'من فضلك أدخل رقم الهاتف والتاريخ';
      return;
    }

    this.loading = true;
    const formattedDate = this.datePipe.transform(this.date, 'yyyy-MM-dd') || this.date;
    const phone = this.normalizePhone(this.phoneNumber);

    // نستخدم الـ service لجلب البيانات ثم ننقل query params
    this.appointmentService.trackAppointment(phone, formattedDate).subscribe({
      next: (res: AppointmentInfo) => {
        console.log('✅ Appointment found:', res);
        this.loading = false;
        // ننقل مع queryParams (آمن للـ refresh / مباشرة)
        this.router.navigate(['/info-details'], {
          queryParams: { phoneNumber: phone, date: formattedDate }
        });
      },
      error: (err) => {
        const msg =
          err?.error?.details ||   // 👈 الرسالة المترجمة من الـ API
          err?.error?.message ||   // 👈 fallback
          'لا يوجد حجز بهذا الرقم في هذا اليوم.';
        this.toastr.error(msg);
      }
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      flatpickr('#dateInput', {
        locale: Arabic,
        dateFormat: 'Y-m-d',
        minDate: 'today',
        disable: [
          (date) => {
            const day = date.getDay();
            // الأيام المتاحة: السبت (6)، الأحد (0)، الثلاثاء (2)، الأربعاء (3)
            return !(day === 0 || day === 2 || day === 3 || day === 6);
          }
        ]
      });
    }
  }
}
