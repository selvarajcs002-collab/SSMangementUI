import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChallanData } from '../../../../../core/services/outward-preview.service';

@Component({
  selector: 'app-meter-delivery-challan-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meter-delivery-challan-preview.component.html',
  styleUrl: './meter-delivery-challan-preview.component.scss'
})
export class MeterDeliveryChallanPreviewComponent {
  @Input() data!: ChallanData;
}
