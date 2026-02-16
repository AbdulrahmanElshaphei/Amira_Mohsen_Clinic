import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Appointment } from '../../shared/interfaces/appointment';
import { AppointmentService } from '../../shared/services/appointment.service';
import { ToastrService } from 'ngx-toastr';
import { ClinicHours } from '../../shared/interfaces/clinic-hours';
import { DatePipe } from '@angular/common';
import { formatDate } from '@angular/common';
import { ChangeDayStatusRequest } from '../../shared/interfaces/change-day-status';
import { RescheduleRequest } from '../../shared/interfaces/reschedule';
import flatpickr from "flatpickr";
import { RescheduleAppointment } from '../../shared/interfaces/appointmentmodel';
import { NotificationService } from '../../shared/services/notification.service';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [DatePipe]
})
export class DashboardComponent implements OnInit, AfterViewInit {

  showWeeklyAlert = false;



  // متغيرات الحجز
  day: string = '';
  startTime: string = '';
  endTime: string = '';
  day_O_C: string = '';
  modalMessage: string = '';
  modalSuccess: boolean = false;
  selectedDay: string = '';       // اليوم المختار من الـ modal
  statusMessage: string = '';     // الرسالة اللي هنعرضها للمستخدم
  statusSuccess: boolean = true;  // للتحكم بلون الرسالة (success/danger)
  selectedDay2: string = '';
  // البيانات
  rows: Appointment[] = [];
  selectedRows = new Set<number>();
  loading = false;
  errorMessage = '';
  totalCount: number = 0;

  constructor(
    private appointmentService: AppointmentService,
    private toastr: ToastrService,
    private datePipe: DatePipe,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadAppointments();
    this.checkWeeklyAlert();
    this.loadCurrentAnnouncement();
    const saved = localStorage.getItem('rescheduledAppointmentsDay');
    if (saved) {
      this.rescheduledAppointmentsDay = JSON.parse(saved);
    }
    // 🟢 بعد تحميل المؤجلة نفحص مين جه يومه ونضيفه للجدول الأساسي
    // this.checkRescheduledAppointments();

  }


  // 🔹 جلب المواعيد
  loadAppointments(): void {
    this.loading = true;
    this.appointmentService.getAppointments().subscribe({
      next: (data) => {
        // ✅ ناخد الـ appointments من الـ object
        this.totalCount = data.count;
        const appointments = data.appointments;

        this.rows = appointments
          .map(app => {
            let timeOnly = '';
            let dateOnly = '';
            let appDate: Date | null = null;
            let appTime: Date | null = null;

            // 🕒 معالجة الوقت
            if (app.estimatedTime) {
              const d = new Date(app.estimatedTime);
              appTime = d;

              let hours = d.getHours();
              const minutes = d.getMinutes().toString().padStart(2, '0');
              const ampm = hours >= 12 ? 'PM' : 'AM';
              hours = hours % 12;
              hours = hours ? hours : 12;
              timeOnly = `${hours}:${minutes} ${ampm}\u200E`;
            }

            // 📅 معالجة التاريخ
            if (app.date) {
              const parts = app.date.split('T')[0];
              const [year, month, day] = parts.split('-').map(Number);
              appDate = new Date(year, month - 1, day);
              dateOnly = appDate.toLocaleDateString('ar-EG');
            }

            return {
              ...app,
              timeOnly: timeOnly,
              dateOnly: dateOnly,
              _rawDate: appDate,
              _rawTime: appTime
            };
          })
          .sort((a, b) => {
            const dateA = a._rawDate?.getTime() || 0;
            const dateB = b._rawDate?.getTime() || 0;

            if (dateA !== dateB) return dateA - dateB;

            const timeA = a._rawTime?.getTime() || 0;
            const timeB = b._rawTime?.getTime() || 0;
            if (timeA !== timeB) return timeA - timeB;

            return (a.queueNumber || 0) - (b.queueNumber || 0);
          });

        // this.checkRescheduledAppointments(); // 🟢
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'حصل خطأ أثناء تحميل المواعيد';
        this.loading = false;
      }
    });
  }





  // dashboard.component.ts
  completeAppointment(id: number) {
    this.appointmentService.completeAppointment(id, 1).subscribe({
      next: (res: any) => {
        const appointment = this.rows.find(a => a.id === id);
        if (appointment) {
          appointment.status = 'Completed';
        }

        // ✅ رسالة نجاح
        this.toastr.success('تم استكمال الكشف بنجاح ✅');
        this.loadAppointments();
      },
      error: (err) => {
        console.log("❌ Full API Error:", err);

        const msg =
          err?.error?.details ||   // 👈 الرسالة المترجمة من الـ API
          err?.error?.message ||   // 👈 fallback
          'لا يمكن انهاء الموعد في يوم مختلف عن موعده';
        this.toastr.error(msg);
      }

    });
  }

  cancelAppointment(id: number) {
    this.appointmentService.cancelAppointment(id).subscribe({
      next: () => {
        const appointment = this.rows.find(r => r.id === id);
        if (appointment) {
          appointment.status = 'Cancelled';
        }
        this.toastr.success('تم إلغاء الحجز بنجاح ✅');
        this.loadAppointments();
      },
      error: (err) => {
        this.toastr.error('لا يمكن الغاء الحجز لليوم التالي');
      }
    });
  }

  // 🔹 حفظ التغييرات (تغيير ميعاد بداية وقفل الحجز)
  saveChanges() {
    if (!this.day || !this.startTime?.trim() || !this.endTime?.trim()) {
      this.toastr.warning('⚠️ من فضلك أدخل كل البيانات قبل الحفظ');
      return;
    }

    const formattedDate = formatDate(this.day, 'yyyy-MM-dd', 'en-US');

    // ✅ نتأكد إن القيم مظبوطة قبل ما نضيف الثواني
    const start = this.startTime.includes(':') ? this.startTime + ':00' : this.startTime;
    const end = this.endTime.includes(':') ? this.endTime + ':00' : this.endTime;

    const payload: ClinicHours = {
      date: formattedDate,
      clinicStartTime: start,
      clinicEndTime: end
    };

    this.appointmentService.setClinicHours(payload).subscribe({
      next: () => {
        this.toastr.success('✅ تم حفظ التغييرات بنجاح');
      },
      error: () => {
        this.toastr.error('❌ حدث خطأ أثناء حفظ المواعيد');
      }
    });
  }




  changeDayStatus(isClosed: boolean) {
    if (!this.selectedDay) {
      this.toastr.warning('⚠️ من فضلك اختر اليوم أولاً.');
      return;
    }

    const request: ChangeDayStatusRequest = {
      date: this.selectedDay,   // yyyy-MM-dd من الـ input date جاهزة
      isClosed: isClosed
    };

    this.appointmentService.changeDayStatus(request).subscribe({
      next: (res) => {
        console.log('✅ API Response:', res);
        // رسائل مختلفة حسب الحالة
        if (isClosed) {
          this.toastr.success(res.message || 'تم إغلاق الحجز بنجاح ✅');
        } else {
          this.toastr.success(res.message || 'تم فتح الحجز بنجاح ✅');
        }
      },
      error: (err) => {
        console.error('❌ API Error:', err);
        this.toastr.error('حدث خطأ أثناء تغيير حالة الحجز. حاول مرة أخرى ❌');
      }
    });
  }



  // في أعلى الكلاس DashboardComponent
  appointments: any[] = [];   // هتجيبها من API
  selectedAppointmentId!: number;
  newDate!: string;
  selectedNewTime!: string;  // ✅ الاسم الجديد
  selectedPeriod: 'AM' | 'PM' = 'AM';


  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      flatpickr("#newTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "h:i K",  // ⏰ 12 ساعة مع AM/PM
        time_24hr: false,
        minuteIncrement: 1,
        onChange: (selectedDates, dateStr) => {
          this.selectedNewTime = dateStr;
        }
      });
    }
  }



  reschedule(): void {
    if (!this.selectedAppointmentId || !this.newDate || !this.selectedNewTime) {
      this.toastr.warning('⚠️ من فضلك اختر الموعد وحدد اليوم والوقت الجديد');
      return;
    }

    try {
      // 🟢 نفك الوقت (مع AM/PM لو موجود)
      const [time, period] = this.selectedNewTime.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      if (period?.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (period?.toUpperCase() === 'AM' && hours === 12) hours = 0;

      // 🟢 نجهز التاريخ بصيغة يدويّة عشان نتفادى UTC
      const d = new Date(this.newDate);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');

      const hh = hours.toString().padStart(2, '0');
      const mm = minutes.toString().padStart(2, '0');

      // ✅ نعمل ISO-like string بس من غير ما يتأثر بالـ timezone
      const isoTime = `${year}-${month}-${day}T${hh}:${mm}:00Z`;

      const payload: RescheduleRequest = {
        appointmentId: this.selectedAppointmentId,
        newTime: isoTime
      };

      this.appointmentService.rescheduleAppointment(payload).subscribe({
        next: (res) => {
          this.toastr.success('✅ تم تأجيل الموعد بنجاح');
          console.log('📥 Reschedule Response:', res);
          this.loadAppointments(); // تحديث الجدول بعد التأجيل
        },
        error: (err) => {
          console.error('❌ Reschedule API Error:', err);
          const msg = err?.error?.message || 'حدث خطأ أثناء تأجيل الموعد';
          this.toastr.error(msg);
        }
      });
    } catch (e) {
      console.error('❌ خطأ في معالجة الوقت:', e);
      this.toastr.error('⚠️ صيغة الوقت غير صحيحة');
    }
  }






  // 🟢 متغيرات جديدة في أعلى الكلاس
  statusMessage2: string = '';
  statusSuccess2: boolean = true;

  changeDayStatus2(isClosed: boolean) {
    if (!this.selectedDay2) {
      this.toastr.warning('⚠️ من فضلك اختر اليوم أولاً.');
      return;
    }

    const request: ChangeDayStatusRequest = {
      date: this.selectedDay2, // yyyy-MM-dd جاهزة من input date
      isClosed: isClosed
    };
    console.log('📌 Current Token:', localStorage.getItem('adminToken'));
    this.appointmentService.changeDayStatus2(request).subscribe({
      next: (res) => {
        console.log('✅ API Response:', res);


        this.statusMessage2 = res.message || (isClosed
          ? 'تم إغلاق الحجز بنجاح ✅'
          : 'تم فتح الحجز بنجاح ✅');

        this.statusSuccess2 = true;
        this.toastr.success(this.statusMessage2);
      },
      error: (err) => {
        console.error('❌ API Error:', err);

        this.statusMessage2 = 'حدث خطأ أثناء تغيير حالة الحجز. حاول مرة أخرى ❌';
        this.statusSuccess2 = false;

        this.toastr.error(this.statusMessage2);
      }
    });
  }




  checkWeeklyAlert() {
    const lastAlertDate = localStorage.getItem('lastWeeklyAlert');
    const now = new Date();

    if (!lastAlertDate) {
      // أول مرة
      this.showWeeklyAlert = true;
      localStorage.setItem('lastWeeklyAlert', now.toISOString());
    } else {
      const last = new Date(lastAlertDate);
      const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 7) {
        // لو فات 7 أيام
        this.showWeeklyAlert = true;
        localStorage.setItem('lastWeeklyAlert', now.toISOString());
      }
    }
  }

  dismissAlert() {
    this.showWeeklyAlert = false;
  }






  // 🟢 متغيرات جديدة للتأجيل ليوم آخر
  selectedAppointmentIdOtherDay!: number;
  newDateOtherDay!: string;
  rescheduledAppointmentsDay: RescheduleAppointment[] = [];

  rescheduleOtherDay(): void {
    if (!this.selectedAppointmentIdOtherDay || !this.newDateOtherDay) {
      this.toastr.warning('⚠️ من فضلك اختر الموعد وحدد اليوم الجديد');
      return;
    }

    const payload: RescheduleRequest = {
      appointmentId: this.selectedAppointmentIdOtherDay,
      newTime: new Date(this.newDateOtherDay + 'T12:00:00').toISOString()
    };

    const token = localStorage.getItem('adminToken') || '';

    this.appointmentService.rescheduleAppointmentDay(payload, token).subscribe({
      next: (res) => {
        this.toastr.success('✅ تم تأجيل الموعد بنجاح');
        console.log('📥 Reschedule Response:', res);

        // ✨ أضف النتيجة مباشرة في الجدول
        this.rescheduledAppointmentsDay.push(res);
        localStorage.setItem('rescheduledAppointmentsDay', JSON.stringify(this.rescheduledAppointmentsDay));
      },
      error: (err) => {
        console.error('❌ Reschedule API Error:', err);
        const msg = err?.error?.message || 'حدث خطأ أثناء تأجيل الموعد';
        this.toastr.error(msg);
      }
    });

  }


  // اضافه تنبيه

  notificationMessage: string = '';
  modalMessage2: string = '';
  modalSuccess2: boolean = false;
  currentNotificationId: number | null = null; // هنستخدمه لما تبعتلي شكل الـ API

  saveNotification() {

    // 🚫 لو فيه رسالة موجودة بالفعل
    if (this.currentNotificationId) {
      this.modalMessage2 = '⚠️ يوجد رسالة حالياً، يجب حذفها أولاً قبل إضافة رسالة جديدة';
      this.modalSuccess2 = false;
      return;
    }

    if (!this.notificationMessage.trim()) {
      this.modalMessage2 = '⚠️ من فضلك اكتب رسالة أولا';
      this.modalSuccess2 = false;
      return;
    }

    this.notificationService.addAnnouncement(this.notificationMessage)
      .subscribe({
        next: (res) => {

          this.currentNotificationId = res.id; // نحفظ الـ id
          // this.modalMessage2 = '✅ تم حفظ الرسالة بنجاح';
          this.toastr.success('✅ تم حفظ الرسالة بنجاح');
          this.modalSuccess2 = true;

        },
        error: (err) => {
          console.error(err);
          this.toastr.error('❌ حدث خطأ أثناء حفظ الرسالة');
          // this.modalMessage2 = '❌ حدث خطأ أثناء حفظ الرسالة';
          this.modalSuccess2 = false;
        }
      });
  }


  deleteNotification() {

    if (!this.currentNotificationId) {
      this.modalMessage = 'لا توجد رسالة لحذفها';
      this.modalSuccess = false;
      return;
    }

    this.notificationService.deleteAnnouncement(this.currentNotificationId)
      .subscribe({
        next: () => {

          this.notificationMessage = '';
          this.currentNotificationId = null;

          // this.modalMessage = '🗑️ تم حذف الرسالة بنجاح';
          this.toastr.success('🗑️ تم حذف الرسالة بنجاح');
          this.modalSuccess = true;

        },
        error: (err) => {
          console.error(err);
          // this.modalMessage = '❌ حدث خطأ أثناء الحذف';
          this.toastr.error('❌ حدث خطأ أثناء الحذف');
          this.modalSuccess = false;
        }
      });
  }

  loadCurrentAnnouncement() {
    this.notificationService.getAnnouncements().subscribe({
      next: (res) => {
        if (res.length > 0) {
          const last = res[res.length - 1];
          this.notificationMessage = last.message;
          this.currentNotificationId = last.id;
        }
      }
    });
  }





  // checkRescheduledAppointments() {
  //   const today = new Date();
  //   const todayStr = today.getFullYear() + "-" +
  //     String(today.getMonth() + 1).padStart(2, '0') + "-" +
  //     String(today.getDate()).padStart(2, '0');

  //   const dueAppointments = this.rescheduledAppointmentsDay.filter(a => {
  //     const appointmentDate = a.estimatedTime.substring(0, 10);
  //     return appointmentDate === todayStr;
  //   });

  //   if (dueAppointments.length > 0) {
  //     const mappedAppointments: Appointment[] = dueAppointments.map(a => {
  //       const dateObj = new Date(a.estimatedTime);


  //       const arabicDate = dateObj.toLocaleDateString("ar-EG");

  //       return {
  //         id: a.id,
  //         patientName: a.patientName,
  //         phone: a.phone,
  //         date: arabicDate,
  //         queueNumber: a.queueNumber,
  //         estimatedTime: a.estimatedTime,
  //         status: 'Waiting',
  //         appointmentType: a.appointmentType === "contract" ? "تعاقد" : "كشف",
  //       };
  //     });

  //     this.rows = [...this.rows, ...mappedAppointments];

  //     this.rescheduledAppointmentsDay = this.rescheduledAppointmentsDay.filter(
  //       a => !dueAppointments.some(d => d.id === a.id)
  //     );

  //     localStorage.setItem(
  //       'rescheduledAppointmentsDay',
  //       JSON.stringify(this.rescheduledAppointmentsDay)
  //     );

  //     console.log("✅ تم نقل المواعيد للجدول الأساسي:", mappedAppointments);
  //   }
  // }


















  // 🔹 checkbox
  // getChecked(event: Event): boolean {
  //   return (event.target as HTMLInputElement)?.checked ?? false;
  // }
  // toggleRow(id: number, checked: boolean) {
  //   if (checked) this.selectedRows.add(id);
  //   else this.selectedRows.delete(id);
  // }
  // toggleAll(checked: boolean) {
  //   if (checked) this.selectedRows = new Set(this.rows.map(r => r.id));
  //   else this.selectedRows.clear();
  // }
  // isAllSelected(): boolean {
  //   return this.rows.length > 0 && this.selectedRows.size === this.rows.length;
  // }
}
