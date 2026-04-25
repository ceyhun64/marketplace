// web/app/admin/products/types.ts

export interface Product {
  id: string;
  name: string;
  categoryName?: string;
  category?: { id: string; name: string; slug: string } | null;
  offerCount: number;
  isApproved: boolean;
  imageUrls: string[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface CreateProductForm {
  name: string;
  description: string;
  categoryId: string;
  imageUrls: string[]; // Cloudinary'den gelen URL'ler
  tags: string; // comma separated, split on submit
}
