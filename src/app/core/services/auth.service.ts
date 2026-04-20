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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platform = inject(PLATFORM_ID);

  private readonly API = 'http://localhost:8080/api/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private _token = signal<string | null>(this.loadToken());
  private _user = signal<UserResponse | null>(this.loadUser());

  readonly token = this._token.asReadonly();
  readonly currenUser = this._user.asReadonly();
  readonly isLoggedIn = computed(()=> !!this._token());

  login(body: LoginRequest) {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/login`, body).pipe(
      tap(res => this.saveSesion(res.data))
    );
  }

  register(body: RegisterRequest){
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/register`, body).pipe(
      tap(res => this.saveSesion(res.data))
    );
  }

  logout(){
    this.clearSesion();
    this.router.navigate(['/auth/login']);
  }



}
