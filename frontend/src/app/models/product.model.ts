export interface Product {
  _id: string;
  nom: string;
  description: string;
  prix: number;
  categorie: string;
  marque: string;
  sexe: string;
  typeVetement: string;
  matiere: string;
  couleur: string;
  couleurs: string[];
  saison: string;
  tailles: string[];
  quantite: number;
  images: string[];
  disponible: boolean;
  promotions: number;
  dateAjout: string;
  avgRating?: number;
  reviewCount?: number;
}

export interface Order {
  _id: string;
  produits: OrderItem[];
  client: Client;
  montantTotal: number;
  fraisLivraison: number;
  statut: string;
  paiement_statut: string;
  tracking_numero: string;
  dateCommande: string;
  dateLivraison?: string;
  notes: string;
}

export interface OrderItem {
  produit: string;
  nom: string;
  taille: string;
  couleur: string;
  quantite: number;
  prix: number;
  image: string;
}

export interface Client {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  adresse: string;
  ville: string;
  codePostal: string;
}

export interface CartItem {
  produit: Product;
  quantite: number;
  taille: string;
  couleur: string;
}

export interface Review {
  _id: string;
  produit_id: string;
  nom: string;
  prenom: string;
  rating: number;
  commentaire: string;
  approuve: number | boolean;
  dateReview: string;
}

export interface OrderTracking {
  _id: string;
  statut: string;
  statutLabel: string;
  paiement_statut: string;
  tracking_numero: string;
  montantTotal: number;
  fraisLivraison: number;
  dateCommande: string;
  dateLivraison: string;
  produits: OrderItem[];
  history: { statut: string; date: string; label: string }[];
}
