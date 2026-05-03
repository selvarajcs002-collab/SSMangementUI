import { Validators } from '@angular/forms';

export const emailValidator = Validators.pattern(
  '^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$'
);

export const phoneValidator = Validators.pattern('^[0-9]{10}$');

export const gstValidator = Validators.pattern('^[0-9A-Z]{15}$');

export const pincodeValidator = Validators.pattern('^[0-9]{6}$');
