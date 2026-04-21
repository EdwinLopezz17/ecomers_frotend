import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { ApiResponse, UserResponse } from '../models/auth.models';
import { UpdateProfileRequest } from '../models/user.models';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService)
  private readonly API = 'http://localhost:8080/api/users';

  getProfile(){
    return this.http.get<ApiResponse<UserResponse>>(`${this.API}/me`);
  }

  updateProfile(body:UpdateProfileRequest){
    return this.http.put<ApiResponse<UserResponse>>(`${this.API}/me`, body).pipe(
      tap(res => this.auth.updateUser(res.data))
    )
  }
}
