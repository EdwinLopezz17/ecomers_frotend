import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIcon } from '@angular/material/icon';
import { MatStep, MatStepper, MatStepperNext, MatStepperPrevious } from '@angular/material/stepper';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-register',
  imports: [
    MatIcon,
    MatStepper,
    MatStep,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatButton,
    MatStepperNext,
    MatIconButton,
    MatStepperPrevious,
    MatProgressSpinner,
    RouterLink,
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  loading = signal(false);
  showPassword = signal(false);

  personalForm = this.fb.group({
    name: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
  });

  accountForm = this.fb.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  submit() {
    if (this.personalForm.invalid || this.accountForm.invalid) {
      this.personalForm.markAllAsTouched();
      this.accountForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const payload = {
      ...this.personalForm.getRawValue(),
      ...this.accountForm.getRawValue(),
    } as any;

    this.auth.register(payload).subscribe({
      next: () => {
        this.snack.open('¡Cuenta creada exitosamente!', '', {
          duration: 3000,
          panelClass: 'snack-success',
        });
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(err?.error?.message ?? 'Error al crear la cuenta', 'Cerrar', {
          duration: 4000,
          panelClass: 'snack-error',
        });
      },
    });
  }
}

