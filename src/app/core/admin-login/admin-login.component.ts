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

  this.loading = true;
  this.errorMessage = '';

  this.authService.login(username, password).subscribe({
    next: (res) => {
      if (res?.token) {
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = '❌ بيانات الدخول غير صحيحة';
      }
      this.loading = false;
    },
    error: () => {
      this.errorMessage = '❌ اسم المستخدم أو كلمة المرور غير صحيحة';
      this.loading = false;
    }
  });
}
}
