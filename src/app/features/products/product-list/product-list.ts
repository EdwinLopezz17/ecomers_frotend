import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { CategoryResponse, ProductResponse } from '../../../core/models/product.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatButton, MatIconButton } from '@angular/material/button';
import { CurrencyPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-product-list',
  imports: [MatIcon, MatTooltip, MatIconButton, CurrencyPipe, MatButton, MatProgressSpinner],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  private readonly productSvc = inject(ProductService);
  private readonly auth = inject(AuthService);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly search$ = new Subject<string>();

  // Pre-cache de URLs para evitar re-evaluación en cada ciclo
  private readonly imageCache = new Map<number, string>();
  private readonly failedIds = new Set<number>();

  products = signal<ProductResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  searchQuery = signal('');
  selectedCat = signal<number | null>(null);
  sortOrder = signal('');
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  viewMode = signal<'grid' | 'list'>('grid');

  readonly isLoggedIn = computed(() => this.auth.isLoggedIn());

  readonly sortOptions = [
    { value: '', label: 'Relevancia' },
    { value: 'price,asc', label: 'Precio: menor a mayor' },
    { value: 'price,desc', label: 'Precio: mayor a menor' },
    { value: 'name,asc', label: 'Nombre A-Z' },
    { value: 'name,desc', label: 'Nombre Z-A' },
  ];

  constructor() {
    this.search$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.loadProducts(0));
  }

  ngOnInit() {
    this.productSvc.getCategories().subscribe({
      next: (res) => this.categories.set(res.data),
      error: () => {},
    });
    this.loadProducts(0);
  }

  private buildImageCache(items: ProductResponse[]) {
    items.forEach((p) => {
      if (!this.imageCache.has(p.id)) {
        this.imageCache.set(
          p.id,
          p.images?.length ? this.productSvc.getImageUrl(p.images[0]) : '/no-image.svg',
        );
      }
    });
  }

  getImageUrl(product: ProductResponse): string {

    return this.imageCache.get(product.id) ?? '/no-image.svg';
  }

  onImageError(event: Event, productId: number) {
    if (this.failedIds.has(productId)) return;
    this.failedIds.add(productId);
    this.imageCache.set(productId, '/no-image.svg');
    (event.target as HTMLImageElement).src = '/no-image.svg';
  }

  loadProducts(page: number) {
    page === 0 ? (this.loading.set(true), this.products.set([])) : this.loadingMore.set(true);

    const q = this.searchQuery();
    const cat = this.selectedCat();
    const sort = this.sortOrder();

    const req$ = q
      ? this.productSvc.searchProducts(q, page)
      : cat
        ? this.productSvc.getByCategory(cat, page, 12)
        : this.productSvc.getProducts(page, 12, sort);

    req$.subscribe({
      next: (res) => {
        const data = res.data;
        const merged = page === 0 ? data.content : [...this.products(), ...data.content];

        this.buildImageCache(merged);
        this.products.set(merged);
        this.currentPage.set(data.number);
        this.totalPages.set(data.totalPages);
        this.totalElements.set(data.totalElements);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadingMore.set(false);
        this.snack.open('Error al cargar productos', 'Cerrar', { duration: 3000 });
      },
    });
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    this.selectedCat.set(null);
    this.search$.next(value);
  }

  selectCategory(id: number | null) {
    this.selectedCat.set(id);
    this.searchQuery.set('');
    this.loadProducts(0);
  }

  onSortChange(value: string) {
    this.sortOrder.set(value);
    this.loadProducts(0);
  }

  loadMore() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.loadProducts(this.currentPage() + 1);
    }
  }

  addToCart(product: ProductResponse, event: Event) {
    event.stopPropagation();
    if (!this.isLoggedIn()) {
      this.snack
        .open('Inicia sesión para agregar al carrito', 'Iniciar sesión', { duration: 4000 })
        .onAction()
        .subscribe(() => this.router.navigate(['/auth/login']));
      return;
    }
    this.snack.open(`"${product.name}" agregado al carrito`, '', {
      duration: 2500,
      panelClass: 'snack-success',
    });
  }

  hasStock(product: ProductResponse): boolean {
    return product.stock > 0;
  }

  clearSearch() {
    this.searchQuery.set('');
    this.selectedCat.set(null);
    this.loadProducts(0);
  }

  get hasMore(): boolean {
    return this.currentPage() < this.totalPages() - 1;
  }

  get activeFilterLabel(): string {
    const cat = this.categories().find((c) => c.id === this.selectedCat());
    if (cat) return cat.name;
    if (this.searchQuery()) return `"${this.searchQuery()}"`;
    return '';
  }
}
