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
}

export interface Order {
  _id: string;
  produits: OrderItem[];
  client: Client;
  montantTotal: number;
  fraisLivraison: number;
  statut: string;
  dateCommande: string;
  dateLivraison?: string;
  notes: string;
}

export interface OrderItem {
  produit: Product;
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
  adresse: string;
  ville: string;
  codePostal: string;
}
