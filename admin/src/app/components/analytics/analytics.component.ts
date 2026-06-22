import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="analytics-page">
      <div class="page-header">
        <div>
          <h2>Tableau de bord</h2>
          <p>Vue d'ensemble de votre boutique</p>
        </div>
        <button class="btn btn-secondary" (click)="loadDashboard()">
          <i class="fas fa-sync-alt"></i> Actualiser
        </button>
      </div>

      <div class="loading" *ngIf="loading">
        <div class="spinner"></div>
        <p>Chargement du tableau de bord...</p>
      </div>

      <div class="error-state" *ngIf="error && !loading">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erreur de chargement</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" (click)="loadDashboard()">
          <i class="fas fa-redo"></i> Reessayer
        </button>
      </div>

      <div *ngIf="!loading && !error && data">
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon" style="background: #E8F5E9; color: #4CAF50;">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-value">{{ data.kpis.totalRevenue | number:'1.0-0' }} DT</span>
              <span class="kpi-label">Revenu (30j)</span>
              <span class="kpi-change" [class.positive]="data.kpis.revenueGrowth >= 0" [class.negative]="data.kpis.revenueGrowth < 0">
                <i class="fas" [class.fa-arrow-up]="data.kpis.revenueGrowth >= 0" [class.fa-arrow-down]="data.kpis.revenueGrowth < 0"></i>
                {{ data.kpis.revenueGrowth >= 0 ? '+' : '' }}{{ data.kpis.revenueGrowth }}% vs mois precedent
              </span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background: #E3F2FD; color: #1976D2;">
              <i class="fas fa-shopping-bag"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-value">{{ data.kpis.totalOrders }}</span>
              <span class="kpi-label">Commandes totales</span>
              <span class="kpi-change" style="color: var(--gris);">
                {{ data.kpis.activeOrders }} en cours
              </span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background: #FFF3E0; color: #FF9800;">
              <i class="fas fa-receipt"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-value">{{ data.kpis.avgOrderValue | number:'1.0-0' }} DT</span>
              <span class="kpi-label">Panier moyen</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background: #F3E5F5; color: #9C27B0;">
              <i class="fas fa-box"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-value">{{ data.kpis.totalProducts }}</span>
              <span class="kpi-label">Produits</span>
              <span class="kpi-change negative" *ngIf="data.kpis.lowStockCount > 0">
                <i class="fas fa-exclamation-triangle"></i> {{ data.kpis.lowStockCount }} stock faible
              </span>
            </div>
          </div>
        </div>

        <div class="charts-row">
          <div class="chart-card revenue-chart">
            <div class="card-header">
              <h3><i class="fas fa-chart-line"></i> Revenus (30 derniers jours)</h3>
            </div>
            <div class="chart-container">
              <canvas #revenueCanvas></canvas>
              <div class="chart-empty" *ngIf="!data.dailyRevenue || data.dailyRevenue.length === 0">
                <i class="fas fa-chart-line"></i>
                <p>Aucune donnee de revenu pour les 30 derniers jours</p>
              </div>
            </div>
          </div>

          <div class="chart-card status-chart">
            <div class="card-header">
              <h3><i class="fas fa-chart-pie"></i> Commandes par statut</h3>
            </div>
            <div class="chart-container">
              <canvas #statusCanvas></canvas>
            </div>
          </div>
        </div>

        <div class="bottom-row">
          <div class="widget-card">
            <div class="card-header">
              <h3><i class="fas fa-clock"></i> Commandes recentes</h3>
              <a routerLink="/commandes" class="see-all">Voir tout <i class="fas fa-arrow-right"></i></a>
            </div>
            <div class="recent-list">
              <div class="recent-item" *ngFor="let order of data.recentOrders">
                <div class="recent-info">
                  <span class="recent-id">#{{ order._id.slice(-6).toUpperCase() }}</span>
                  <span class="recent-client">{{ order.client.prenom }} {{ order.client.nom }}</span>
                </div>
                <div class="recent-meta">
                  <span class="recent-total">{{ order.montantTotal | number:'1.0-0' }} DT</span>
                  <span class="badge badge-sm" [ngClass]="getStatusBadge(order.statut)">{{ getStatusLabel(order.statut) }}</span>
                </div>
              </div>
              <div class="empty-widget" *ngIf="data.recentOrders.length === 0">
                <i class="fas fa-inbox"></i>
                <p>Aucune commande</p>
              </div>
            </div>
          </div>

          <div class="widget-card">
            <div class="card-header">
              <h3><i class="fas fa-trophy"></i> Top ventes</h3>
            </div>
            <div class="top-list">
              <div class="top-item" *ngFor="let product of data.topProducts; let i = index">
                <span class="top-rank">{{ i + 1 }}</span>
                <img [src]="getImageUrl(product.image)" [alt]="product.nom" class="top-img" (error)="onImageError($event)">
                <div class="top-info">
                  <span class="top-name">{{ product.nom }}</span>
                  <span class="top-sold">{{ product.totalVendu }} vendus</span>
                </div>
                <span class="top-revenue">{{ product.totalRevenue | number:'1.0-0' }} DT</span>
              </div>
              <div class="empty-widget" *ngIf="data.topProducts.length === 0">
                <i class="fas fa-inbox"></i>
                <p>Aucune vente</p>
              </div>
            </div>
          </div>

          <div class="widget-card" *ngIf="data.lowStockProducts.length > 0">
            <div class="card-header">
              <h3><i class="fas fa-exclamation-triangle"></i> Stock faible</h3>
              <a routerLink="/produits" class="see-all">Voir tout <i class="fas fa-arrow-right"></i></a>
            </div>
            <div class="stock-list">
              <div class="stock-item" *ngFor="let product of data.lowStockProducts">
                <img [src]="getImageUrl(product.images[0])" [alt]="product.nom" class="stock-img" (error)="onImageError($event)">
                <div class="stock-info">
                  <span class="stock-name">{{ product.nom }}</span>
                  <span class="stock-qty" [class.critical]="product.quantite <= 2">{{ product.quantite }} restant(s)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .page-header h2 { font-size: 28px; margin-bottom: 4px; }
    .page-header p { color: var(--gris); font-size: 14px; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
    .kpi-card { background: var(--blanc); border-radius: var(--radius); padding: 24px; display: flex; align-items: center; gap: 16px; box-shadow: var(--shadow); }
    .kpi-icon { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
    .kpi-info { display: flex; flex-direction: column; gap: 2px; }
    .kpi-value { font-size: 26px; font-weight: 700; font-family: 'Playfair Display', serif; }
    .kpi-label { font-size: 13px; color: var(--gris); }
    .kpi-change { font-size: 12px; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
    .kpi-change.positive { color: #4CAF50; }
    .kpi-change.negative { color: #E53935; }
    .kpi-change i { font-size: 10px; }

    .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px; }
    .chart-card { background: var(--blanc); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-light); }
    .card-header h3 { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .card-header h3 i { color: var(--accent); font-size: 14px; }
    .see-all { font-size: 13px; color: var(--accent); text-decoration: none; display: flex; align-items: center; gap: 4px; transition: var(--transition); }
    .see-all:hover { color: var(--noir); }
    .chart-container { padding: 20px 24px; height: 300px; position: relative; }
    .chart-container canvas { width: 100% !important; height: 100% !important; }
    .chart-empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--gris); }
    .chart-empty i { font-size: 36px; margin-bottom: 12px; opacity: 0.2; }
    .chart-empty p { font-size: 13px; }

    .bottom-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
    .widget-card { background: var(--blanc); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }

    .recent-list, .top-list, .stock-list { padding: 8px 0; }
    .recent-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; transition: var(--transition); cursor: pointer; }
    .recent-item:hover { background: var(--beige-light); }
    .recent-info { display: flex; flex-direction: column; gap: 2px; }
    .recent-id { font-weight: 600; font-size: 14px; }
    .recent-client { font-size: 13px; color: var(--gris); }
    .recent-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .recent-total { font-weight: 600; font-size: 14px; }

    .top-item { display: flex; align-items: center; gap: 12px; padding: 12px 24px; }
    .top-rank { width: 24px; height: 24px; border-radius: 50%; background: var(--beige); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: var(--noir); flex-shrink: 0; }
    .top-item:nth-child(1) .top-rank { background: #FFD700; }
    .top-item:nth-child(2) .top-rank { background: #C0C0C0; }
    .top-item:nth-child(3) .top-rank { background: #CD7F32; }
    .top-img { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
    .top-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .top-name { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .top-sold { font-size: 12px; color: var(--gris); }
    .top-revenue { font-weight: 600; font-size: 14px; white-space: nowrap; }

    .stock-item { display: flex; align-items: center; gap: 12px; padding: 12px 24px; }
    .stock-img { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
    .stock-info { display: flex; flex-direction: column; gap: 2px; }
    .stock-name { font-size: 14px; font-weight: 500; }
    .stock-qty { font-size: 13px; color: var(--warning); font-weight: 500; }
    .stock-qty.critical { color: var(--danger); font-weight: 600; }

    .empty-widget { text-align: center; padding: 40px 20px; color: var(--gris); }
    .empty-widget i { font-size: 32px; margin-bottom: 8px; opacity: 0.3; }
    .empty-widget p { font-size: 13px; }

    .badge-sm { font-size: 11px; padding: 3px 8px; border-radius: 4px; }

    .loading { text-align: center; padding: 60px; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--noir); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-state { text-align: center; padding: 60px; }
    .error-state i { font-size: 48px; margin-bottom: 16px; opacity: 0.3; color: var(--danger); }
    .error-state h3 { margin-bottom: 8px; }
    .error-state p { color: var(--gris); margin-bottom: 16px; }

    @media (max-width: 1200px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .charts-row { grid-template-columns: 1fr; }
      .bottom-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .kpi-grid { grid-template-columns: 1fr; gap: 12px; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
    }
  `]
})
export class AnalyticsComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('revenueCanvas') revenueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusCanvas') statusCanvas!: ElementRef<HTMLCanvasElement>;

  data: any = null;
  loading = true;
  error = '';
  private revenueChart: Chart | null = null;
  private statusChart: Chart | null = null;
  private chartsInitialized = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  ngAfterViewChecked() {
    if (this.data && !this.loading && !this.chartsInitialized && this.revenueCanvas) {
      this.chartsInitialized = true;
      this.initCharts();
    }
  }

  ngOnDestroy() {
    this.revenueChart?.destroy();
    this.statusChart?.destroy();
  }

  loadDashboard() {
    this.loading = true;
    this.error = '';
    this.chartsInitialized = false;
    this.api.getDashboard().subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Dashboard error:', err);
        this.error = err.error?.error || 'Impossible de charger les donnees du tableau de bord';
        this.loading = false;
      }
    });
  }

  initCharts() {
    this.revenueChart?.destroy();
    this.statusChart?.destroy();

    if (this.revenueCanvas && this.data?.dailyRevenue?.length > 0) {
      const labels = this.data.dailyRevenue.map((d: any) => {
        const date = new Date(d.date);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      });
      const revenues = this.data.dailyRevenue.map((d: any) => d.revenue);

      this.revenueChart = new Chart(this.revenueCanvas.nativeElement, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Revenus (DT)',
            data: revenues,
            borderColor: '#1A1A1A',
            backgroundColor: 'rgba(26, 26, 26, 0.05)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#1A1A1A',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1A1A1A',
              titleFont: { size: 13 },
              bodyFont: { size: 13 },
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: (ctx: any) => `${ctx.parsed.y.toLocaleString()} DT`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 }, color: '#999', maxTicksLimit: 10 }
            },
            y: {
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: {
                font: { size: 11 },
                color: '#999',
                callback: (val: any) => val.toLocaleString() + ' DT'
              }
            }
          }
        }
      });
    }

    if (this.statusCanvas && this.data?.ordersByStatus) {
      const status = this.data.ordersByStatus;
      const labels = ['En attente', 'En preparation', 'Expédie', 'Livré', 'Annulé'];
      const values = [status.en_attente, status.en_preparation, status.expedie, status.livre, status.annule];
      const colors = ['#FF9800', '#1976D2', '#9E9E9E', '#4CAF50', '#E53935'];

      this.statusChart = new Chart(this.statusCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 16,
                usePointStyle: true,
                pointStyle: 'circle',
                font: { size: 12 }
              }
            },
            tooltip: {
              backgroundColor: '#1A1A1A',
              padding: 12,
              cornerRadius: 8
            }
          }
        }
      });
    }
  }

  getStatusLabel(statut: string): string {
    const labels: any = {
      'en_attente': 'En attente',
      'en_preparation': 'En preparation',
      'expedie': 'Expidie',
      'livre': 'Livre',
      'annule': 'Annule'
    };
    return labels[statut] || statut;
  }

  getStatusBadge(statut: string): string {
    const badges: any = {
      'en_attente': 'badge-warning',
      'en_preparation': 'badge-info',
      'expedie': 'badge-secondary',
      'livre': 'badge-success',
      'annule': 'badge-danger'
    };
    return badges[statut] || 'badge-secondary';
  }

  getImageUrl(image: string): string {
    return this.api.getImageUrl(image);
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop';
  }
}
