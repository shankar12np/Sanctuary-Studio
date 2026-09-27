import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Programs } from './pages/programs/programs';
import { Admissions } from './pages/admissions/admissions';
import { Gallery } from './pages/gallery/gallery';
import { Contact } from './pages/contact/contact';
import { AdminLogin } from './admin/login/login';
import { AdminDashboard } from './admin/dashboard/dashboard';
import { authGuard } from './admin/auth-guard';

export const routes: Routes = [
  { path: '', component: Home, title: 'Sanctuary Studio | Learning Centre in Kathmandu' },
  { path: 'about', component: About, title: 'About | Sanctuary Studio' },
  { path: 'programs', component: Programs, title: 'Programs | Sanctuary Studio' },
  { path: 'admissions', component: Admissions, title: 'Admissions | Sanctuary Studio' },
  { path: 'gallery', component: Gallery, title: 'Gallery | Sanctuary Studio' },
  { path: 'contact', component: Contact, title: 'Contact | Sanctuary Studio' },
  { path: 'admin', component: AdminLogin, title: 'Admin | Sanctuary Studio' },
  { path: 'admin/dashboard', component: AdminDashboard, canActivate: [authGuard], title: 'Admin Dashboard | Sanctuary Studio' },
];
