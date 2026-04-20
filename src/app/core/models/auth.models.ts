export interface LoginRequest{
  email:string;
  password:string;
}

export interface RegisterRequest{
  username:string;
  password:string;
  email:string;
  name:string;
  lastname:string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  name: string;
  lastname: string;
  profile_pic_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse{
  token:string;
  user:UserResponse;
}

export interface ApiResponse<T>{
  success: boolean;
  message: string;
  data:T;
}
