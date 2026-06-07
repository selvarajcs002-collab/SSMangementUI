import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChallanData } from '../../../../../core/services/outward-preview.service';

@Component({
  selector: 'app-meter-pdf-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meter-pdf-template.component.html',
  styleUrl: './meter-pdf-template.component.scss'
})
export class MeterPdfTemplateComponent {
  @Input() data!: ChallanData;
}
