import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { LoginResponse } from '../interfaces/login-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://amiramohsenclinic.com/api/Dashboard/login';
  private tokenKey = 'adminToken';

  constructor(private http: HttpClient, private router: Router) {}

  // تسجيل الدخول
  login(): Observable<LoginResponse> {
    const body = {
      username: 'Amira_Mohsen_admin',
      password: 'Amira1234@admin'
    };

    return this.http.post<LoginResponse>(this.apiUrl, body).pipe(
      tap((res: LoginResponse) => {
        if (res.token) {
          this.setToken(res.token);
        }
      })
    );
  }

  // حفظ التوكن
  private setToken(token: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  // جلب التوكن
  getToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  // هل المستخدم مسجل دخول؟
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // تسجيل الخروج
  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.tokenKey);
    }
    this.router.navigate(['/Admin-login']);
  }
}
