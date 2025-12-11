import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';
import { HistoryAppointment, HistoryResponse } from '../../shared/interfaces/history';
import { AppointmentService } from '../../shared/services/appointment.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  appointments: HistoryAppointment[] = [];
  filteredAppointments: HistoryAppointment[] = [];
  selectedDate: string = '';
  totalCount: number = 0;

  constructor(
    private appointmentService: AppointmentService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // ✅ ضبط التاريخ الافتراضي على النهاردة
    const today = new Date().toISOString().split('T')[0];
    this.selectedDate = today;

    // ✅ نجيب بيانات اليوم من الـ API
    this.loadAppointments(this.selectedDate);
  }

  // 🟢 تحميل الحجوزات من السيرفر (مع فلترة بالتاريخ)
  loadAppointments(date?: string): void {
    const token = localStorage.getItem('adminToken') || '';
    this.appointmentService.getHistoryAppointments(token, date).subscribe({
      next: (res: HistoryResponse) => {
        this.appointments = res.appointments;
        
        // 🔢 ترتيب حسب رقم الدور (تصاعدي)
        this.appointments.sort((a, b) => Number(a.queueNumber) - Number(b.queueNumber));

        this.filteredAppointments = res.appointments;
        this.totalCount = res.count; // ✅ ناخد الكونت اللي جاي من السيرفر
      },
      error: (err) => {
        console.error('❌ Error loading appointments', err);
        this.toastr.error('لا يوجد حجوزات في الأرشيف لليوم المطلوب');
      }
    });
  }

  // 🟢 فلترة بالتاريخ (تستدعي API مباشرة)
  filterByDate(): void {
    if (!this.selectedDate) {
      this.toastr.warning('⚠️ اختر التاريخ أولا');
      return;
    }
    this.loadAppointments(this.selectedDate);
  }

  // 🟢 بحث بالاسم أو الهاتف (لوكال بس)
  searchAppointments(query: string): void {
    this.filteredAppointments = this.appointments.filter(a =>
      a.patientName.includes(query) || a.phone.includes(query)
    );
  }

  // 🟢 تصدير Excel
  exportToExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredAppointments);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Appointments');

    // ✅ لو فيه selectedDate استخدمه، لو مش موجود fallback لتاريخ النهاردة
    const fileDate = this.selectedDate || new Date().toISOString().split('T')[0];
    const fileName = `appointments-history-${fileDate}.xlsx`;

    XLSX.writeFile(wb, fileName);
    this.toastr.success('✅ تم تصدير البيانات إلى Excel');
  }



  // 🟢 مسح بيانات يوم معين (من السيرفر)
  clearTodayData(): void {
    if (!this.selectedDate) {
      this.toastr.warning('⚠️ اختر التاريخ لمسح بياناته');
      return;
    }

    const token = localStorage.getItem('adminToken') || '';

    this.appointmentService.deleteAppointmentsByDate(token, this.selectedDate).subscribe({
      next: (res) => {
        this.toastr.success(`🗑️ ${res.message}`);
        // تفريغ البيانات المعروضة بعد المسح
        this.filteredAppointments = [];
        this.totalCount = 0;
      },
      error: (err) => {
        console.error('❌ Error deleting appointments', err);
        this.toastr.error('فشل مسح بيانات اليوم');
      }
    });
  }

}
