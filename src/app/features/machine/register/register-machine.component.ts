import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppDatePickerComponent } from '../../../shared/components/app-date-picker/app-date-picker.component';

@Component({
  selector: 'app-register-machine',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AppDatePickerComponent],
  templateUrl: './register-machine.component.html',
  styleUrls: ['./register-machine.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterMachineComponent {
  machineForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.machineForm = this.fb.group({
      machineName: ['', Validators.required],
      machineId: ['', Validators.required],
      machineType: ['', Validators.required],
      heads: [1],
      manufacturer: [''],
      model: [''],
      installationDate: [''],
      capacity: [''],
      power: [''],
      location: [''],
      status: ['active']
    });
  }

  onSubmit() {
    if (this.machineForm.valid) {
      console.log('Machine Registered:', this.machineForm.value);
      // Logic to save
    }
  }
}
