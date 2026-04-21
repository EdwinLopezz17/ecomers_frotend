import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () =>{
  const auth = inject(AuthService)
  if(!auth.isLoggedIn()) return true;
  inject(Router).navigate(['/']);
  return false;
}
