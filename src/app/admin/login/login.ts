import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';

@Component({
  selector: 'app-admin-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class AdminLogin {
  private auth = inject(Auth);
  private router = inject(Router);

  email = '';
  password = '';
  error = '';
  loading = false;

  async onSubmit() {
    this.error = '';
    this.loading = true;
    try {
      await signInWithEmailAndPassword(this.auth, this.email, this.password);
      this.router.navigate(['/admin/dashboard']);
    } catch {
      this.error = 'Incorrect email or password.';
    } finally {
      this.loading = false;
    }
  }
}
