import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiResponse } from '../models/auth.models';
import {
  CategoryResponse,
  CreateProductRequest,
  PageResponse,
  ProductResponse,
  UpdateProductRequest,
} from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly API = 'http://localhost:8080/api';

  getProducts(page = 0, size = 12, sort = '') {
    let params = new HttpParams().set('page', page).set('size', size);
    if (sort) params = params.set('sort', sort);

    return this.http.get<ApiResponse<PageResponse<ProductResponse>>>(`${this.API}/products`, {
      params,
    });
  }

  searchProducts(q: string, page = 0, size = 12) {
    const params = new HttpParams().set('q', q).set('page', page).set('size', size);

    return this.http.get<ApiResponse<PageResponse<ProductResponse>>>(
      `${this.API}/products/search`,
      { params },
    );
  }

  getByCategory(categoryId: number, page = 0, size = 12) {
    const params = new HttpParams().set('page', page).set('size', size);

    return this.http.get<ApiResponse<PageResponse<ProductResponse>>>(
      `${this.API}/products/category/${categoryId}`,
      { params },
    );
  }

  getCategories() {
    return this.http.get<ApiResponse<CategoryResponse[]>>(`${this.API}/categories/roots`);
  }

  getImageUrl(filename: string): string {
    return `${this.API.replace('/api', '')}/uploads/${filename}`;
  }

  getMyProducts(page = 0, size = 12) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<ProductResponse>>>(`${this.API}/products/me`, {
      params,
    });
  }

  createProduct(body: CreateProductRequest) {
    return this.http.post<ApiResponse<ProductResponse>>(`${this.API}/products`, body);
  }

  updateProduct(id:number, body:UpdateProductRequest){
    return this.http.put<ApiResponse<ProductResponse>>(
      `${this.API}/products/${id}`, body
    )
  }

  deleteProduct(id:number){
    return this.http.delete<ApiResponse<null>>(`${this.API}/products/${id}`);
  }

  uploadImages(productId:number, files: File[]){
    const form = new FormData()
    files.forEach(f => form.append('files', f))
    return this.http.post<ApiResponse<ProductResponse>>(
      `${this.API}/products/${productId}/images`, form
    )
  }
}
