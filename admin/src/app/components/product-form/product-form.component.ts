import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService, Product } from '../../services/api.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="product-form-page">
      <div class="page-header">
        <div>
          <h2>{{ isEditing ? 'Modifier le produit' : 'Ajouter un produit' }}</h2>
          <p>{{ isEditing ? 'Modifiez les informations du produit' : 'Remplissez les informations du nouveau produit' }}</p>
        </div>
        <button class="btn btn-secondary" (click)="goBack()">
          <i class="fas fa-arrow-left"></i> Retour
        </button>
      </div>

      <form (ngSubmit)="saveProduct()" class="form-card">
        <div class="form-section">
          <h3><i class="fas fa-info-circle"></i> Informations generales</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Nom du produit *</label>
              <input type="text" [(ngModel)]="product.nom" name="nom" required placeholder="Ex: T-shirt classique">
            </div>
            <div class="form-group">
              <label>Marque</label>
              <input type="text" [(ngModel)]="product.marque" name="marque" placeholder="Ex: Nike, Zara...">
            </div>
            <div class="form-group">
              <label>Categorie *</label>
              <select [(ngModel)]="product.categorie" name="categorie" required (change)="onCategorieChange()">
                <option value="">Selectionner</option>
                <option value="homme">Homme</option>
                <option value="femme">Femme</option>
                <option value="enfant">Enfant</option>
                <option value="chaussure">Chaussures</option>
                <option value="accessoire">Accessoires</option>
              </select>
            </div>
            <div class="form-group">
              <label>Sexe</label>
              <select [(ngModel)]="product.sexe" name="sexe">
                <option value="unisexe">Unisexe</option>
                <option value="homme">Homme</option>
                <option value="femme">Femme</option>
              </select>
            </div>
            <div class="form-group">
              <label>Type de vetement</label>
              <input type="text" [(ngModel)]="product.typeVetement" name="typeVetement" placeholder="Ex: T-shirt, Pantalon, Robe...">
            </div>
            <div class="form-group full-width">
              <label>Description</label>
              <textarea [(ngModel)]="product.description" name="description" rows="3" placeholder="Description detaillee du produit"></textarea>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3><i class="fas fa-palette"></i> Couleurs disponibles</h3>
          <div class="colors-grid">
            <label *ngFor="let couleur of allCouleurs" class="color-checkbox">
              <input type="checkbox" [checked]="product.couleurs.includes(couleur)"
                     (change)="toggleCouleur(couleur)">
              <span class="color-chip" [style.background]="couleur"></span>
              <span class="color-name">{{ getColorName(couleur) }}</span>
            </label>
          </div>
        </div>

        <div class="form-section">
          <h3><i class="fas fa-tag"></i> Caracteristiques</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Matiere</label>
              <input type="text" [(ngModel)]="product.matiere" name="matiere" placeholder="Ex: Coton, Polyester, Cuir">
            </div>
            <div class="form-group">
              <label>Saison</label>
              <select [(ngModel)]="product.saison" name="saison">
                <option value="toutes">Toutes saisons</option>
                <option value="printemps">Printemps</option>
                <option value="ete">Ete</option>
                <option value="automne">Automne</option>
                <option value="hiver">Hiver</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3><i class="fas fa-ruler"></i> Tailles disponibles</h3>
          <div class="sizes-grid">
            <label *ngFor="let taille of allTailles" class="size-checkbox">
              <input type="checkbox" [checked]="product.tailles.includes(taille)"
                     (change)="toggleTaille(taille)">
              <span>{{ taille }}</span>
            </label>
          </div>
        </div>

        <div class="form-section">
          <h3><i class="fas fa-dollar-sign"></i> Prix et stock</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Prix (DT) *</label>
              <input type="number" [(ngModel)]="product.prix" name="prix" required min="0" step="0.01">
            </div>
            <div class="form-group">
              <label>Promotion (%)</label>
              <input type="number" [(ngModel)]="product.promotions" name="promotions" min="0" max="100">
            </div>
            <div class="form-group">
              <label>Quantite en stock *</label>
              <input type="number" [(ngModel)]="product.quantite" name="quantite" required min="0">
            </div>
            <div class="form-group">
              <label>Statut</label>
              <select [(ngModel)]="product.disponible" name="disponible">
                <option [ngValue]="true">Disponible</option>
                <option [ngValue]="false">Indisponible</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3><i class="fas fa-images"></i> Images</h3>
          <div class="upload-area" (click)="fileInput.click()">
            <input #fileInput type="file" multiple accept="image/*" (change)="onFileSelect($event)" hidden>
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Cliquez ou glissez vos images ici</p>
            <span>JPG, PNG, GIF, WebP - Max 10MB</span>
          </div>
          <div class="image-previews" *ngIf="imagePreviews.length > 0">
            <div class="preview-item" *ngFor="let preview of imagePreviews; let i = index">
              <img [src]="preview" alt="Preview">
              <button type="button" class="remove-btn" (click)="removeImage(i)">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div class="existing-images" *ngIf="isEditing && existingImages.length > 0">
            <p>Images existantes:</p>
            <div class="image-previews">
              <div class="preview-item" *ngFor="let img of existingImages; let i = index">
                <img [src]="getImageUrl(img)" alt="Existing" (error)="onImageError($event)">
                <button type="button" class="remove-btn" (click)="removeExistingImage(i)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="goBack()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            <i class="fas" [class.fa-save]="!saving" [class.fa-spinner]="saving"></i>
            {{ saving ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Ajouter') }}
          </button>
        </div>
      </form>
    </div>

    <div class="toast" *ngIf="showToast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'">
      {{ toastMessage }}
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }
    .page-header h2 {
      font-size: 28px;
      margin-bottom: 4px;
    }
    .page-header p {
      color: var(--gris);
      font-size: 14px;
    }

    .form-card {
      background: var(--blanc);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 32px;
    }

    .form-section {
      margin-bottom: 32px;
      padding-bottom: 32px;
      border-bottom: 1px solid var(--border);
    }
    .form-section:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
    }
    .form-section h3 {
      font-size: 16px;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--noir);
    }
    .form-section h3 i {
      color: var(--accent);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .sizes-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .size-checkbox {
      display: flex;
      align-items: center;
      cursor: pointer;
    }
    .size-checkbox input {
      display: none;
    }
    .size-checkbox span {
      padding: 10px 20px;
      border: 2px solid var(--border);
      border-radius: 8px;
      font-weight: 500;
      transition: var(--transition);
    }
    .size-checkbox input:checked + span {
      background: var(--noir);
      color: var(--blanc);
      border-color: var(--noir);
    }

    .colors-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .color-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 8px 14px;
      border: 2px solid var(--border);
      border-radius: 8px;
      transition: var(--transition);
    }
    .color-checkbox input { display: none; }
    .color-checkbox input:checked ~ .color-chip {
      box-shadow: 0 0 0 2px var(--blanc), 0 0 0 4px var(--noir);
    }
    .color-checkbox:has(input:checked) {
      border-color: var(--noir);
      background: var(--beige-light);
    }
    .color-chip {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid var(--border);
      flex-shrink: 0;
    }
    .color-name {
      font-size: 13px;
      font-weight: 500;
    }

    .upload-area {
      border: 2px dashed var(--border);
      border-radius: var(--radius);
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: var(--transition);
    }
    .upload-area:hover {
      border-color: var(--accent);
      background: var(--beige-light);
    }
    .upload-area i {
      font-size: 40px;
      color: var(--accent);
      margin-bottom: 12px;
    }
    .upload-area p {
      font-weight: 500;
      margin-bottom: 4px;
    }
    .upload-area span {
      font-size: 12px;
      color: var(--gris);
    }

    .image-previews {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 16px;
    }
    .preview-item {
      position: relative;
      width: 100px;
      height: 100px;
      border-radius: 8px;
      overflow: hidden;
    }
    .preview-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .remove-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--danger);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
    }

    .existing-images p {
      margin-top: 16px;
      margin-bottom: 8px;
      font-size: 13px;
      color: var(--gris);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
    }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
      .form-card { padding: 20px; }
      .form-grid { grid-template-columns: 1fr; }
      .form-actions { flex-direction: column; }
      .form-actions .btn { width: 100%; justify-content: center; }
      .upload-area { padding: 24px; }
    }
    @media (max-width: 480px) {
      .form-card { padding: 16px; }
      .form-section { margin-bottom: 24px; padding-bottom: 24px; }
      .sizes-grid { gap: 6px; }
      .size-checkbox span { padding: 8px 14px; font-size: 13px; }
      .image-previews { gap: 8px; }
      .preview-item { width: 80px; height: 80px; }
    }
  `]
})
export class ProductFormComponent implements OnInit {
  isEditing = false;
  productId = '';
  saving = false;
  showToast = false;
  toastMessage = '';
  toastType = 'success';
  imageFiles: File[] = [];
  imagePreviews: string[] = [];
  existingImages: string[] = [];
  allTaillesVetement = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  allTaillesChaussure = Array.from({ length: 15 }, (_, i) => String(i + 36));
  allTailles = this.allTaillesVetement;
  allCouleurs = [
    '#1A1A1A', '#FFFFFF', '#808080', '#C62828', '#1565C0',
    '#2E7D32', '#E91E63', '#FFC107', '#FF5722', '#795548',
    '#FFCCBC', '#01579B', '#4E342E', '#F5F5DC', '#263238'
  ];

  product: any = {
    nom: '',
    description: '',
    prix: 0,
    categorie: '',
    marque: '',
    sexe: 'unisexe',
    typeVetement: '',
    matiere: '',
    couleur: '',
    couleurs: [],
    saison: 'toutes',
    tailles: [],
    quantite: 0,
    disponible: true,
    promotions: 0
  };

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.productId = id;
      this.api.getProduct(id).subscribe({
        next: (data) => {
          this.product = { ...data };
          if (!Array.isArray(this.product.couleurs)) this.product.couleurs = [];
          this.existingImages = data.images || [];
        },
        error: (err) => console.error(err)
      });
    }
  }

  toggleTaille(taille: string) {
    const idx = this.product.tailles.indexOf(taille);
    if (idx > -1) {
      this.product.tailles.splice(idx, 1);
    } else {
      this.product.tailles.push(taille);
    }
  }

  onCategorieChange() {
    const isChaussure = this.product.categorie === 'chaussure';
    this.allTailles = isChaussure ? this.allTaillesChaussure : this.allTaillesVetement;
    this.product.tailles = [];
  }

  toggleCouleur(couleur: string) {
    const idx = this.product.couleurs.indexOf(couleur);
    if (idx > -1) {
      this.product.couleurs.splice(idx, 1);
    } else {
      this.product.couleurs.push(couleur);
    }
  }

  getColorName(hex: string): string {
    const names: any = {
      '#1A1A1A': 'Noir', '#FFFFFF': 'Blanc', '#808080': 'Gris',
      '#C62828': 'Rouge', '#1565C0': 'Bleu', '#2E7D32': 'Vert',
      '#E91E63': 'Rose', '#FFC107': 'Jaune', '#FF5722': 'Orange',
      '#795548': 'Marron', '#FFCCBC': 'Beige', '#01579B': 'Marine',
      '#4E342E': 'Marron fonce', '#F5F5DC': 'Ecru', '#263238': 'Anthracite'
    };
    return names[hex] || hex;
  }

  onFileSelect(event: any) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
      this.imageFiles.push(files[i]);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push(e.target.result);
      };
      reader.readAsDataURL(files[i]);
    }
  }

  removeImage(index: number) {
    this.imageFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  removeExistingImage(index: number) {
    this.existingImages.splice(index, 1);
  }

  saveProduct() {
    this.saving = true;
    const formData = new FormData();

    Object.keys(this.product).forEach(key => {
      if (key !== '_id' && key !== 'images' && key !== 'dateAjout') {
        if (key === 'tailles') {
          formData.append('tailles', this.product.tailles.join(','));
        } else if (key === 'couleurs') {
          formData.append('couleurs', this.product.couleurs.join(','));
        } else {
          formData.append(key, this.product[key]);
        }
      }
    });

    if (this.isEditing) {
      this.existingImages.forEach(img => {
        formData.append('existingImages', img);
      });
    }

    this.imageFiles.forEach(file => {
      formData.append('images', file);
    });

    const request = this.isEditing
      ? this.api.updateProduct(this.productId, formData)
      : this.api.createProduct(formData);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.showToastMessage(
          this.isEditing ? 'Produit modifie' : 'Produit cree',
          'success'
        );
        setTimeout(() => this.router.navigate(['/produits']), 1500);
      },
      error: (err) => {
        this.saving = false;
        this.showToastMessage('Erreur: ' + (err.error?.error || 'Erreur inconnue'), 'error');
      }
    });
  }

  goBack() {
    this.router.navigate(['/produits']);
  }

  showToastMessage(message: string, type: string) {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  getImageUrl(image: string): string {
    return this.api.getImageUrl(image);
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop';
  }
}
