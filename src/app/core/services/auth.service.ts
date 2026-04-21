import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from '../models/auth.models';
import { tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platform = inject(PLATFORM_ID);

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly API = 'http://localhost:8080/api/auth';

  private _token = signal<string | null>(this.readStorage(this.TOKEN_KEY));
  private _user = signal<UserResponse | null>(this.parseUser());

  readonly token = this._token.asReadonly();
  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platform);
  }

  private readStorage(key: string): string | null {
    return this.isBrowser() ? localStorage.getItem(key) : null;
  }

  private parseUser(): UserResponse | null {
    const raw = this.readStorage(this.USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  login(body: LoginRequest) {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.API}/login`, body)
      .pipe(tap((res) => this.saveSession(res.data)));
  }

  register(body: RegisterRequest) {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.API}/register`, body)
      .pipe(tap((res) => this.saveSession(res.data)));
  }

  logout() {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  updateUser(user: UserResponse) {
    this._user.set(user);
    if (this.isBrowser()) localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private saveSession(data: AuthResponse) {
    this._token.set(data.token);
    this._user.set(data.user);
    if (this.isBrowser()) {
      localStorage.setItem(this.TOKEN_KEY, data.token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
    }
  }

  private clearSession() {
    this._token.set(null);
    this._user.set(null);
    if (this.isBrowser()) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }
}
