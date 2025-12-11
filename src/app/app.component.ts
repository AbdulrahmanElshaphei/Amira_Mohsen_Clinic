import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FooterComponent } from './shared/footer/footer.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Amira_Clinic';

  constructor(private router: Router) {

   this.router.events
  .pipe(filter(event => event instanceof NavigationEnd))
  .subscribe((event) => {

    const nav = event as NavigationEnd; // ← كده TypeScript هيسكت

    const url = nav.urlAfterRedirects;

    const protectedPages = ['/dashboard', '/history'];
    const isProtected = protectedPages.some(p => url.startsWith(p));

    if (!isProtected) {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem('adminToken');
      }
    }

  });


  }
}
