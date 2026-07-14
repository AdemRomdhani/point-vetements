import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private defaultTitle = 'Point Vetements - Boutique en ligne';
  private defaultDescription = 'Votre destination mode en ligne. Vetements de qualite pour toute la famille a prix accessibles.';

  constructor(private titleService: Title, private metaService: Meta) {}

  setTitle(title: string): void {
    this.titleService.setTitle(title ? `${title} | Point Vetements` : this.defaultTitle);
  }

  setDescription(description: string): void {
    this.metaService.updateTag({ name: 'description', content: description || this.defaultDescription });
  }

  setKeywords(keywords: string): void {
    this.metaService.updateTag({ name: 'keywords', content: keywords || 'vetements, mode, boutique, en ligne, homme, femme, enfant, point vetements' });
  }

  setOgTags(title: string, description: string, image?: string, url?: string): void {
    this.metaService.updateTag({ property: 'og:title', content: title || this.defaultTitle });
    this.metaService.updateTag({ property: 'og:description', content: description || this.defaultDescription });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    if (image) this.metaService.updateTag({ property: 'og:image', content: image });
    if (url) this.metaService.updateTag({ property: 'og:url', content: url });
  }

  setProductSeo(product: any): void {
    this.setTitle(product.nom);
    this.setDescription(product.description || `${product.nom} - ${product.marque || ''} ${product.categorie || ''}`.trim());
    this.setKeywords(`${product.nom}, ${product.marque}, ${product.categorie}, ${product.typeVetement}, vetements`);
    if (product.images && product.images[0]) {
      this.setOgTags(product.nom, product.description || '', product.images[0]);
    }
  }

  resetSeo(): void {
    this.setTitle('');
    this.setDescription('');
    this.setKeywords('');
  }
}
