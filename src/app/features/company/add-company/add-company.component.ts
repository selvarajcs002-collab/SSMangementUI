import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompanyFormComponent } from '../company-form/company-form.component';

@Component({
  selector: 'app-add-company',
  standalone: true,
  imports: [CommonModule, CompanyFormComponent],
  template: `
    <div class="page-container">
      <app-company-form mode="add"></app-company-form>
    </div>
  `,
  styles: [`
    .page-container {
      width: 100%;
      height: 100%;
      overflow-y: auto;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddCompanyComponent {}
