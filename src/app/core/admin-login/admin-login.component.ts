import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  // القيم الثابتة
  private readonly correctUsername = 'Amira_Mohsen_admin';
  private readonly correctPassword = 'Amira1234@admin';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    const { username, password } = this.loginForm.value;

    // التحقق من القيم المدخلة
    if (username !== this.correctUsername || password !== this.correctPassword) {
      this.errorMessage = '❌ اسم المستخدم أو كلمة المرور غير صحيحة';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // استدعاء الـ Service (اللي أصلاً بيرسل اليوزر والباسورد الثابتين)
    this.authService.login().subscribe({
      next: (res) => {
        if (res && res.token) {
          localStorage.setItem('adminToken', res.token);
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'فشل تسجيل الدخول';
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
        this.loading = false;
      }
    });
  }
}
