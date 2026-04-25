export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: number;
  categoryName: string;
  sellerId: number;
  sellerName: string;
}
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  parentId: number;
  parentName: string;
  children: CategoryResponse[];
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: number;
}

export interface UpdateProductRequest {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: number;
}
