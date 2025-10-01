import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) { 
      return true; // لو مسجل دخول يدخل
    } else {
      this.router.navigate(['/home']); // لو مش مسجل دخوله يروح للوجين
      return false;
    }
  }
}
