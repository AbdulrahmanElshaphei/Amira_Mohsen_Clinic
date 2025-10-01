import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { BookingComponent } from './pages/booking/booking.component';
import { InfoComponent } from './pages/info/info.component';
import { InfoDetailsComponent } from './pages/info-details/info-details.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AdminLoginComponent } from './core/admin-login/admin-login.component';
import { AuthGuard } from './core/auth.guard';
import { HistoryComponent } from './pages/history/history.component';

export const routes: Routes = [
     { path: '', redirectTo: "home", pathMatch: "full" },
    { path: 'home', component: HomeComponent },
    { path: "notFound", component: NotFoundComponent },
    { path: "booking", component: BookingComponent },
    { path: "info", component: InfoComponent },
    { path: "info-details", component: InfoDetailsComponent},
    { path: "dashboard", component: DashboardComponent, canActivate: [AuthGuard]},
    { path: "history", component: HistoryComponent, canActivate: [AuthGuard]},
    { path: "Admin-login", component: AdminLoginComponent},


    { path: "**", component: NotFoundComponent },
];
