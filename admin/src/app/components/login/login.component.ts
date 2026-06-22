import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <span class="logo-icon"><i class="fas fa-tshirt"></i></span>
          <h1>Point Vetements</h1>
          <p>Panel d'administration</p>
        </div>
        <form (ngSubmit)="login()">
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" placeholder="admin@pointvetements.com" required>
          </div>
          <div class="form-group">
            <label>Mot de passe</label>
            <input type="password" [(ngModel)]="password" name="password" placeholder="Mot de passe" required>
          </div>
          <p class="error" *ngIf="error">{{ error }}</p>
          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            <span *ngIf="!loading"><i class="fas fa-sign-in-alt"></i> Connexion</span>
            <span *ngIf="loading"><i class="fas fa-spinner fa-spin"></i> Connexion...</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--beige) 0%, var(--beige-dark) 100%);
      padding: 20px;
    }
    .login-card {
      background: var(--blanc);
      border-radius: var(--radius);
      box-shadow: var(--shadow-hover);
      padding: 40px;
      width: 100%;
      max-width: 400px;
    }
    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo-icon {
      width: 60px;
      height: 60px;
      background: var(--noir);
      color: var(--blanc);
      border-radius: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      margin-bottom: 16px;
    }
    .login-header h1 {
      font-size: 24px;
      margin-bottom: 4px;
    }
    .login-header p {
      color: var(--gris);
      font-size: 14px;
    }
    .error {
      color: var(--danger);
      font-size: 14px;
      margin-bottom: 16px;
      text-align: center;
    }
    .btn-block {
      width: 100%;
      justify-content: center;
      padding: 14px;
      font-size: 16px;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.loading = true;
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Erreur de connexion';
      }
    });
  }
}
