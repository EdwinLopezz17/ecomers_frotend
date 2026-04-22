import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatDivider } from '@angular/material/list';
import { MatError, MatFormField, MatHint, MatInput, MatLabel } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [
    MatIcon,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatDivider,
    MatCardContent,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatHint,
    MatButton,
    MatProgressSpinner,
    DatePipe,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly userSvc = inject(UserService);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  editMode = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    username: ['', [Validators.required]],
    profilePicture: [''],
  });

  ngOnInit() {
    this.loadUser();
    this.form.disable();

    this.userSvc.getProfile().subscribe({
      next: (res) => {
        this.auth.updateUser(res.data);
        this.loadUser();
      },
      error: () => {},
    });
  }

  private loadUser() {
    const u = this.auth.currentUser();
    this.user;
    if (u) {
      this.form.patchValue({
        name: u.name,
        lastName: u.lastName,
        username: u.username,
        profilePicture: u.profilePicture ?? '',
      });
    }
  }

  enableEdit() {
    this.editMode.set(true);
    this.form.enable();
  }
  cancelEdit() {
    this.editMode.set(false);
    this.form.disable();
    this.loadUser();
  }
  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload = this.form.getRawValue();
    if (!payload.profilePicture) {
      delete (payload as any).profilePicture;
    }

    this.userSvc.updateProfile(payload as any).subscribe({
      next: () => {
        this.loading.set(false);
        this.editMode.set(false);
        this.form.disable();
        this.snack.open('Perfil actualizado correctamente', '', {
          duration: 3000,
          panelClass: 'snack-success',
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(err?.error?.message ?? 'Error al actualizar el perfil', 'Cerrar', {
          duration: 4000,
          panelClass: 'snack-error',
        });
      },
    });
  }

  get user() {
    return this.auth.currentUser();
  }

  get initials(): string {
    const u = this.user;
    if (!u?.name || !u?.lastName) return '?';
    return `${u.name.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();
  }
}
