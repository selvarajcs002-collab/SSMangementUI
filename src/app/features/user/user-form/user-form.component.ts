import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { UserRequest } from '../../../core/models/request/user-request.model';
import { CommonResponse } from '../../../core/models/response/common-response.model';
import { emailValidator } from '../../../shared/validators/custom-validators';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEdit = false;
  editId?: number;

  constructor(private fb: FormBuilder, private userService: UserService) {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, emailValidator]],
      password: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {}

  onCreate(): void {
    // 1. Validate form
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    // 2. Prepare payload
    const payload: UserRequest = {
      mode: 'INSERT',
      email: this.userForm.value.email,
      password: this.userForm.value.password
    };

    // 3. Call API
    this.userService.saveUser(payload).subscribe({
      next: (res: CommonResponse) => {
        if (res.status) {
          alert(res.message);

          // Reset form after success
          this.userForm.reset();
        } else {
          alert(res.message);
        }
      },
      error: (err) => {
        console.error(err);
        alert('Failed to create user');
      }
    });
  }
}
