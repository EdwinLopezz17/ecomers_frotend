import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiResponse } from '../models/auth.models';
import { CategoryResponse, PageResponse, ProductResponse } from '../models/product.model';

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
    const params = new HttpParams().set('page', page).set('size', size)

    return this.http.get<ApiResponse<PageResponse<ProductResponse>>>(
      `${this.API}/products/category/${categoryId}`,
      { params },
    );
  }

  getCategories(){
    return this.http.get<ApiResponse<CategoryResponse[]>>(`${this.API}/categories/roots`);
  }

  getImageUrl(filename: string):string{
    return `${this.API.replace('/api', '')}/uploads/${filename}`;
  }
}
