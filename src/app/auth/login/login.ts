import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoginRequest } from '../../core/models/request/login-request.model';
import { CommonResponse } from '../../core/models/response/common-response.model';
import { emailValidator } from '../../shared/validators/custom-validators';
import { InputField } from '../components/input-field/input-field';
import { ButtonComponent } from '../components/button/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, InputField, ButtonComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, emailValidator]],
      password: ['', [Validators.required]]
    });
  }

  onLogin(): void {
    // 1. Validate form
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // 2. Prepare payload
    const payload: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    // 3. Call API
    this.authService.login(payload).subscribe({
      next: (res: CommonResponse) => {
        if (res.status) {
          console.log('Login Success:', res);

          // Store userId in localStorage
          localStorage.setItem('userId', res.id.toString());
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userEmail', this.loginForm.value.email);

          alert(res.message);

          // Redirect to dashboard
          this.router.navigate(['/dashboard']);
        } else {
          alert(res.message);
        }
      },
      error: (err) => {
        console.error(err);
        alert('Login failed. Please try again.');
      }
    });
  }
}
