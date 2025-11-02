import { Component, AfterViewInit, ElementRef, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import flatpickr from 'flatpickr';
import { Arabic } from 'flatpickr/dist/l10n/ar.js';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

// استدعي الـ service اللي فيها الـ createAppointment
import { AppointmentService } from '../../shared/services/appointment.service';

// واجهات الطلب والرد (مسار الملف حسب مشروعك - عدل لو لازم)
import { CreateAppointmentRequest, CreateAppointmentResponse } from '../../shared/interfaces/create-appointment';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FormsModule, CommonModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements AfterViewInit {
  @ViewChild('dateInput', { static: false }) dateInput?: ElementRef;

  // نموذج الفورم (raw values كما يدخلها المستخدم)
  bookingData = {
    name: '',
    phone: '',
    bookingDate: '', // قد يأتي 'd-m-Y' أو 'Y-m-d' بحسب إعداد flatpickr — سنعالجه قبل الإرسال
    appointmentType:''
  };

  // النتيجة المعالجة للعرض
  responseData: (CreateAppointmentResponse & {
    displayDate?: string;
    displayEstimatedTime?: string;
  }) | null = null;

  isLoading = false;
  errorMessage = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private appointmentService: AppointmentService,
    private toastr:ToastrService
  ) { }

ngAfterViewInit(): void {
  if (isPlatformBrowser(this.platformId) && this.dateInput) {
    const unlockHour = 8; // 🕗 الحجز يفتح الساعة 8 الصبح في نفس اليوم

    flatpickr(this.dateInput.nativeElement, {
      dateFormat: 'd-m-Y',
      locale: Arabic,
      disableMobile: true,
      defaultDate: new Date(),
      minDate: 'today',
      disable: [
        (date: Date) => {
          const day = date.getDay();
          // السماح فقط بالسبت(6) والأحد(0) والتلات(2) والأربع(3)
          return !(day === 6 || day === 0 || day === 2 || day === 3);
        }
      ],
      onChange: (selectedDates: Date[], dateStr: string, instance) => {
        if (selectedDates.length > 0) {
          const selectedDate = selectedDates[0];
          const now = new Date();

          // نجهز نسخة من "الوقت المسموح" = 8 صباحًا في نفس اليوم المختار
          const unlockTimeForSelectedDay = new Date(selectedDate);
          unlockTimeForSelectedDay.setHours(unlockHour, 0, 0, 0);

          // ⛔ لو الوقت الحالي أقل من 8 صباحًا في نفس اليوم اللي اختاره المستخدم
          if (now < unlockTimeForSelectedDay) {
            this.toastr.error(`عذرًا، سيتم فتح الحجز ليوم ${dateStr} في تمام الساعة ${unlockHour}:00 صباحًا`);
            instance.clear();
            return;
          }

          // ✅ لو عدى 8 الصبح في نفس اليوم المختار، نخزن التاريخ
          this.bookingData.bookingDate = dateStr;
        }
      }
    });
  }
}






  // ===== helper: normalize phone to +20... =====
  private normalizePhone(input: string): string {
    if (!input) return input;
    let phone = input.trim().replace(/\s+/g, '');
    // already has plus
    if (phone.startsWith('+')) return phone;
    // starts with 00 -> convert to +
    if (phone.startsWith('00')) return '+' + phone.slice(2);
    // starts with 0 -> egyptian local -> replace leading 0 with +20
    if (phone.startsWith('0')) return '+20' + phone.slice(1);
    // starts with 20 (no plus) -> add +
    if (/^20\d+/.test(phone)) return '+' + phone;
    // fallback: assume local without leading zero -> add +20
    return '+20' + phone;
  }

  // ===== helper: convert various date strings to yyyy-MM-dd (API format) =====
  private toApiDate(dateStr: string): string {
    if (!dateStr) return dateStr;
    // if already in yyyy-mm-dd
    const isoLike = /^\d{4}-\d{2}-\d{2}$/;
    if (isoLike.test(dateStr)) return dateStr;

    // if like dd-mm-yyyy or d-m-yyyy
    const dashParts = dateStr.split('-');
    if (dashParts.length === 3) {
      // could be dd-mm-yyyy OR yyyy-mm-dd
      if (dashParts[0].length === 4) {
        // yyyy-mm-dd-like (but we handled above) — still normalize
        const [y, m, d] = dashParts;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      } else {
        // assume dd-mm-yyyy
        const [d, m, y] = dashParts;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }

    // try to parse with Date fallback
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dt = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dt}`;
    }

    // fallback: return as-is (will probably cause 400)
    return dateStr;
  }

  // ===== helper: format response date/time for display without timezone-shift =====
  private extractDisplayDate(dateIso?: string): string {
    if (!dateIso) return '';
    // dateIso expected like "2025-09-25T00:00:00" or "2025-09-25"
    const dateOnly = dateIso.split('T')[0]; // "2025-09-25"
    const [y, m, d] = dateOnly.split('-');
    // عرض قابل للقراءة بالعربي (مثال: 25/09/2025)
    try {
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      return dt.toLocaleDateString('ar-EG'); // ثابت ولن يزود يوم لأننا أنشأنا التاريخ محلياً من الأجزاء
    } catch {
      return dateOnly;
    }
  }

  private extractDisplayTime(dateTimeIso?: string): string {
    if (!dateTimeIso) return '';
    // إذا جاء بالشكل ISO "YYYY-MM-DDTHH:mm:ss" نأخذ الجزء بعد T
    const parts = dateTimeIso.split('T');
    const timePart = parts[1] ?? parts[0]; // في حال أرسلوا الوقت فقط
    const hhmm = timePart.split(':').slice(0, 2).join(':'); // "12:06"
    // ممكن ترجعه كـ "12:06 م" لو حبيت، لكن نرجع HH:MM للبساطة
    return hhmm;
  }

  // ===== submit =====
  onSubmit() {
    this.errorMessage = '';
    this.responseData = null;

    // بسيط فالفاليديشن (يمكن تطويله لو عايز)
    if (!this.bookingData.name || !this.bookingData.phone || !this.bookingData.bookingDate) {
      this.errorMessage = 'من فضلك املأ كل الحقول المطلوبة (الاسم، الهاتف، والتاريخ).';
      return;
    }

    // تجهيز الجسم بالـ format المطلوب من الـ API
    const payload: CreateAppointmentRequest = {
      name: this.bookingData.name.trim(),
      phone: this.normalizePhone(this.bookingData.phone),
      bookingDate: this.toApiDate(this.bookingData.bookingDate), // yyyy-MM-dd
      appointmentType: Number(this.bookingData.appointmentType)
    };

    // خيار مفيد للتصحيح لو تحب تطبع قبل الإرسال
    console.log('➡️ إرسال createAppointment payload:', payload);

    this.isLoading = true;

    // استدعاء السيرفس الفعلي: createAppointment
    this.appointmentService.createAppointment(payload).subscribe({
      next: (res: CreateAppointmentResponse) => {
        console.log('✅ Response from API:', res);
        this.toastr.success('تم الحجز بنجاح وسيتم ارسال رسالة بالتأكيد✅');
        // معالجة الريسبونس للعرض (نحول التاريخ والوقت لعرض ثابت)
        const displayDate = this.extractDisplayDate(res.date);
        const displayEstimatedTime = this.extractDisplayTime(res.estimatedTime);

        // نحتفظ بالرد الأصلي لكن نضيف حقول للعرض
        this.responseData = {
          ...res,
          displayDate,
          displayEstimatedTime
        };

        this.isLoading = false;
      },
      error: (err) => {

        // ✅ استخرج الرسالة الحقيقية لو موجودة
        const serverMsg =
          err?.error?.statusMessage || // الرسالة اللي بترجع من الـ API
          err?.error?.message ||       // fallback لو السيرفر بيرجع message بس
          err?.message ||              // لو error عام من Angular/HTTP
          'حصل خطأ من السيرفر';        // fallback أخير

        this.errorMessage = `⚠️ ${serverMsg}`;
        this.isLoading = false;
      }

    });
  }




validatePhone(event: any) {
  let value = event.target.value;

  // إزالة أي رموز أو حروف غير الأرقام أو +
  value = value.replace(/[^0-9+]/g, '');

  // السماح بـ + واحدة فقط في البداية
  if ((value.match(/\+/g) || []).length > 1) {
    value = value.replace(/\+(?=.+\+)/g, '');
  }
  if (value.includes('+') && !value.startsWith('+')) {
    value = value.replace('+', '');
  }

  // تحديث القيمة في الـ ngModel
  event.target.value = value;
  this.bookingData.phone = value;
}


}
