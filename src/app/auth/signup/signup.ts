import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputField } from '../components/input-field/input-field';
import { ButtonComponent } from '../components/button/button';
import { PasswordStrengthComponent } from '../components/password-strength/password-strength';
import { passwordStrengthValidator, confirmPasswordValidator } from '../validators/password.validator';
import { UserService } from '../../core/services/user.service';
import { UserRequest } from '../../core/models/request/user-request.model';
import { CommonResponse } from '../../core/models/response/common-response.model';
import { emailValidator } from '../../shared/validators/custom-validators';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, InputField, ButtonComponent, PasswordStrengthComponent],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Signup {
  signupForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, emailValidator]],
      password: ['', [Validators.required, passwordStrengthValidator()]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: [confirmPasswordValidator('password', 'confirmPassword')]
    });
  }

  get currentPasswordValue(): string {
    return this.signupForm.get('password')?.value || '';
  }

  onSignup(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const payload: UserRequest = {
      mode: 'INSERT',
      email: this.signupForm.get('email')?.value,
      password: this.signupForm.get('password')?.value
    };

    this.userService.saveUser(payload).subscribe({
      next: (res: CommonResponse) => {
        this.isLoading = false;
        if (res.status) {
          alert(res.message || 'Account created successfully!');
          this.router.navigate(['/login']);
        } else {
          alert(res.message || 'Signup failed');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        alert('Something went wrong during signup');
      }
    });
  }
}
