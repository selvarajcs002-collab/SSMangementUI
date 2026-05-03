import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './password-strength.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordStrengthComponent implements OnChanges {
  @Input() password = '';

  hasMinLength = signal(false);
  hasUpperCase = signal(false);
  hasLowerCase = signal(false);
  hasNumeric = signal(false);
  hasSpecial = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['password']) {
      const val = this.password || '';
      
      this.hasMinLength.set(val.length >= 8);
      this.hasUpperCase.set(/[A-Z]/.test(val));
      this.hasLowerCase.set(/[a-z]/.test(val));
      this.hasNumeric.set(/[0-9]/.test(val));
      this.hasSpecial.set(/[!@#$%^&*(),.?":{}|<>_]/.test(val));
    }
  }
}
