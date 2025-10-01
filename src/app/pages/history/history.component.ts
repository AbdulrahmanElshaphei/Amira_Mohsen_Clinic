import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-history',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent {
   data = [
    { name: 'عبدالرحمن محمد', phone: '+201124859707', time: '9:19 PM', date: '2025/9/28', visitType: 'Contract', queue: 1 },
    { name: 'عبدالرحمن محمد', phone: '+201124859708', time: '9:43 PM', date: '2025/9/28', visitType: 'Checkup', queue: 2 },
  ];

  exportToExcel() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Appointments');

    // 📅 تاريخ اليوم
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; 
    // النتيجة بتبقى بالشكل: 2025-09-29

    // 📝 اسم الملف + التاريخ
    const fileName = `appointments_${formattedDate}.xlsx`;

    XLSX.writeFile(wb, fileName);
  }
}
