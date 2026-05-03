import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CompanyFormComponent } from '../company-form/company-form.component';

@Component({
  selector: 'app-update-company',
  standalone: true,
  imports: [CommonModule, CompanyFormComponent],
  template: `
    <div class="page-container">
      <app-company-form 
        mode="update" 
        [companyId]="selectedCompanyId()">
      </app-company-form>
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
export class UpdateCompanyComponent implements OnInit {
  selectedCompanyId = signal<number | null>(null);

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Check for id in query params or route params
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.selectedCompanyId.set(Number(id));
      }
    });

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.selectedCompanyId.set(Number(id));
      }
    });
  }
}
