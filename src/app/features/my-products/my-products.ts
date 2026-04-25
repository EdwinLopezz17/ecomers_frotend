import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ProductService } from '../../core/services/product.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CategoryResponse,
  CreateProductRequest,
  ProductResponse,
} from '../../core/models/product.model';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatProgressSpinner, MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MatError,
  MatFormField,
  MatHint,
  MatInput,
  MatInputModule,
  MatLabel,
} from '@angular/material/input';
import { MatOption, MatSelect, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';

type ModalMode = 'create' | 'edit' | 'images' | 'stock' | null;

@Component({
  selector: 'app-my-products',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule,
    MatIcon,
    CurrencyPipe,
    MatIconButton,
    MatProgressSpinner,
    ReactiveFormsModule,
    MatTooltip,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatHint,
    MatSelect,
    MatOption,
  ],
  templateUrl: './my-products.html',
  styleUrl: './my-products.css',
})
export class MyProducts implements OnInit {
  private readonly productSvc = inject(ProductService);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  products = signal<ProductResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);
  loading = signal(true);
  saving = signal(false);
  uploadingImgs = signal(false);
  deletingId = signal<number | null>(null);

  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  loadingMore = signal(false);

  modalMode = signal<ModalMode>(null);
  selectedProduct = signal<ProductResponse | null>(null);

  pendingFiles = signal<File[]>([]);
  pendingPreviews = signal<string[]>([]);
  dragOver = signal(false);

  stockValue = signal(0);

  productForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: [''],
    price: [null as number | null, [Validators.required, Validators.min(0.01)]],
    stock: [null as number | null, [Validators.required, Validators.min(0)]],
    categoryId: [null as number | null, Validators.required],
  });

  private readonly imgCache = new Map<number, string>();
  private readonly failedImgIds = new Set<number>();

  readonly hasMore = computed(() => this.currentPage() < this.totalPages() - 1);

  readonly stats = computed(() => {
    const list = this.products();
    return {
      total: list.length,
      inStock: list.filter((p) => p.stock > 0).length,
      outStock: list.filter((p) => p.stock === 0).length,
      lowStock: list.filter((p) => p.stock > 0 && p.stock <= 5).length,
    };
  });

  ngOnInit() {
    this.productSvc.getCategories().subscribe({
      next: (res) => this.categories.set(res.data),
      error: () => {},
    });
    this.loadProducts(0);
  }

  // ── Load ───────────────────────────────────────────────
  loadProducts(page: number) {
    page === 0 ? this.loading.set(true) : this.loadingMore.set(true);

    this.productSvc.getMyProducts(page, 12).subscribe({
      next: (res) => {
        const data = res.data;
        const merged = page === 0 ? data.content : [...this.products(), ...data.content];
        this.buildCache(merged);
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
        this.snack.open('Error al cargar tus productos', 'Cerrar', { duration: 3000 });
      },
    });
  }

  loadMore() {
    if (this.hasMore()) this.loadProducts(this.currentPage() + 1);
  }

  // ── Modals ─────────────────────────────────────────────
  openCreate() {
    this.productForm.reset();
    this.selectedProduct.set(null);
    this.modalMode.set('create');
  }

  openEdit(p: ProductResponse) {
    this.selectedProduct.set(p);
    this.productForm.patchValue({
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      categoryId: p.categoryId,
    });
    this.modalMode.set('edit');
  }

  openImages(p: ProductResponse) {
    this.selectedProduct.set(p);
    this.pendingFiles.set([]);
    this.pendingPreviews.set([]);
    this.modalMode.set('images');
  }

  openStock(p: ProductResponse) {
    this.selectedProduct.set(p);
    this.stockValue.set(p.stock);
    this.modalMode.set('stock');
  }

  closeModal() {
    this.modalMode.set(null);
    this.selectedProduct.set(null);
    this.pendingFiles.set([]);
    this.pendingPreviews.set([]);
  }

  saveProduct() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);

    const v = this.productForm.getRawValue();

    const payload: CreateProductRequest = {
      name: v.name!,
      description: v.description ?? '',
      price: Number(v.price),
      stock: Number(v.stock),
      categoryId: Number(v.categoryId),
    };

    const isEdit = this.modalMode() === 'edit';
    const req$ = isEdit
      ? this.productSvc.updateProduct(this.selectedProduct()!.id, payload)
      : this.productSvc.createProduct(payload);

    req$.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.closeModal();
        this.snack.open(isEdit ? 'Producto actualizado' : 'Producto publicado exitosamente', '', {
          duration: 3000,
          panelClass: 'snack-success',
        });
        this.imgCache.delete(res.data.id);
        this.loadProducts(0);
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(err?.error?.message ?? 'Error al guardar', 'Cerrar', {
          duration: 4000,
          panelClass: 'snack-error',
        });
      },
    });
  }

  confirmDelete(p: ProductResponse) {
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;
    this.deletingId.set(p.id);

    this.productSvc.deleteProduct(p.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.products.update((list) => list.filter((x) => x.id !== p.id));
        this.snack.open('Producto eliminado', '', { duration: 3000 });
      },
      error: (err) => {
        this.deletingId.set(null);
        this.snack.open(err?.error?.message ?? 'Error al eliminar', 'Cerrar', {
          duration: 4000,
          panelClass: 'snack-error',
        });
      },
    });
  }

  saveStock() {
    const p = this.selectedProduct();
    if (!p) return;
    const newStock = this.stockValue();
    if (newStock < 0) {
      this.snack.open('El stock no puede ser negativo', '', { duration: 2500 });
      return;
    }
    this.saving.set(true);

    this.productSvc
      .updateProduct(p.id, {
        name: p.name,
        description: p.description,
        price: p.price,
        stock: newStock,
        categoryId: p.categoryId,
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.products.update((list) =>
            list.map((x) => (x.id === p.id ? { ...x, stock: res.data.stock } : x)),
          );
          this.closeModal();
          this.snack.open('Stock actualizado', '', { duration: 2500, panelClass: 'snack-success' });
        },
        error: (err) => {
          this.saving.set(false);
          this.snack.open(err?.error?.message ?? 'Error al actualizar stock', 'Cerrar', {
            duration: 4000,
            panelClass: 'snack-error',
          });
        },
      });
  }

  adjustStock(delta: number) {
    this.stockValue.update((v) => Math.max(0, v + delta));
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    this.addFiles(files);
  }

  onFileSelect(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    this.addFiles(files);
    (event.target as HTMLInputElement).value = '';
  }

  private addFiles(files: File[]) {
    const valid = files.filter((f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    const invalid = files.length - valid.length;
    if (invalid > 0)
      this.snack.open(`${invalid} archivo(s) inválido(s) — max 5MB por imagen`, '', {
        duration: 3000,
      });

    const current = this.pendingFiles();
    const total = current.length + valid.length;
    if (total > 5) {
      this.snack.open('Máximo 5 imágenes por carga', '', { duration: 3000 });
      return;
    }

    this.pendingFiles.update((f) => [...f, ...valid]);
    valid.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => this.pendingPreviews.update((p) => [...p, e.target!.result as string]);
      reader.readAsDataURL(f);
    });
  }

  removePending(index: number) {
    this.pendingFiles.update((f) => f.filter((_, i) => i !== index));
    this.pendingPreviews.update((p) => p.filter((_, i) => i !== index));
  }

  uploadImages() {
    const p = this.selectedProduct();
    if (!p || !this.pendingFiles().length) return;
    this.uploadingImgs.set(true);

    this.productSvc.uploadImages(p.id, this.pendingFiles()).subscribe({
      next: (res) => {
        this.uploadingImgs.set(false);
        this.imgCache.delete(p.id);
        this.buildCache([res.data]);
        this.products.update((list) => list.map((x) => (x.id === p.id ? res.data : x)));
        this.selectedProduct.set(res.data);
        this.pendingFiles.set([]);
        this.pendingPreviews.set([]);
        this.snack.open('Imágenes subidas correctamente', '', {
          duration: 3000,
          panelClass: 'snack-success',
        });
      },
      error: (err) => {
        this.uploadingImgs.set(false);
        this.snack.open(err?.error?.message ?? 'Error al subir imágenes', 'Cerrar', {
          duration: 4000,
          panelClass: 'snack-error',
        });
      },
    });
  }

  private buildCache(items: ProductResponse[]) {
    items.forEach((p) => {
      if (!this.imgCache.has(p.id) || p.images?.length) {
        this.imgCache.set(
          p.id,
          p.images?.length ? this.productSvc.getImageUrl(p.images[0]) : '/no-image.svg',
        );
      }
    });
  }

  getImageUrl(p: ProductResponse): string {
    return this.imgCache.get(p.id) ?? '/no-image.svg';
  }

  getProductImageUrl(filename: string): string {
    return this.productSvc.getImageUrl(filename);
  }

  onImgError(event: Event, id: number) {
    if (this.failedImgIds.has(id)) return;
    this.failedImgIds.add(id);
    this.imgCache.set(id, '/no-image.svg');
    (event.target as HTMLImageElement).src = '/no-image.svg';
  }

  stockClass(stock: number): string {
    if (stock === 0) return 'stock-out';
    if (stock <= 5) return 'stock-low';
    return 'stock-ok';
  }
}
