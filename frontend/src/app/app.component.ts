import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <app-header></app-header>
    <main>
      <router-outlet></router-outlet>
    </main>
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <div class="footer-logo">
              <span class="footer-logo-text">POINT</span>
              <span class="footer-logo-sub">VETEMENTS</span>
            </div>
            <p>Votre destination mode en ligne</p>
          </div>
          <div class="footer-links">
            <a href="#">A propos</a>
            <a href="#">Contact</a>
            <a href="#">Politique de confidentialite</a>
          </div>
          <div class="footer-social">
            <a href="#"><i class="fab fa-facebook"></i></a>
            <a href="#"><i class="fab fa-instagram"></i></a>
            <a href="#"><i class="fab fa-twitter"></i></a>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 Point Vetements. Tous droits reserves.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    main {
      min-height: calc(100vh - 160px);
    }
    .footer {
      background: var(--noir);
      color: var(--beige);
      padding: 40px 0 20px;
      margin-top: 60px;
    }
    .footer-content {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 40px;
      margin-bottom: 30px;
    }
    .footer-logo {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-bottom: 10px;
    }
    .footer-logo-text {
      font-family: 'Inter', sans-serif;
      font-size: 28px;
      font-weight: 100;
      letter-spacing: 8px;
      color: var(--beige);
      line-height: 1;
    }
    .footer-logo-sub {
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      font-weight: 400;
      letter-spacing: 6px;
      color: #A89070;
      line-height: 1;
    }
    .footer-brand h3 {
      font-size: 24px;
      margin-bottom: 10px;
    }
    .footer-brand p {
      color: var(--gris-light);
    }
    .footer-links {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .footer-links a {
      color: var(--gris-light);
      transition: color 0.3s;
    }
    .footer-links a:hover {
      color: var(--accent);
    }
    .footer-social {
      display: flex;
      gap: 16px;
    }
    .footer-social a {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--noir-light);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--beige);
      transition: var(--transition);
    }
    .footer-social a:hover {
      background: var(--accent);
    }
    .footer-bottom {
      border-top: 1px solid var(--noir-light);
      padding-top: 20px;
      text-align: center;
      color: var(--gris);
      font-size: 14px;
    }
    @media (max-width: 1024px) {
      .footer-content {
        grid-template-columns: 1fr 1fr;
        gap: 30px;
      }
    }
    @media (max-width: 768px) {
      .footer-content {
        grid-template-columns: 1fr;
        text-align: center;
        gap: 24px;
      }
      .footer-logo {
        align-items: center;
      }
      .footer-social {
        justify-content: center;
      }
    }
    @media (max-width: 480px) {
      .footer { padding: 30px 0 16px; margin-top: 40px; }
      .footer-brand h3 { font-size: 20px; }
      .footer-brand p { font-size: 13px; }
      .footer-social a { width: 44px; height: 44px; }
      main { min-height: calc(100vh - 120px); }
    }
  `]
})
export class AppComponent {}
