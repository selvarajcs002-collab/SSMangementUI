import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OutwardPreviewService, ChallanData } from '../../../../core/services/outward-preview.service';
import { ApiService } from '../../../../core/services/api.service';
import { MessageService } from '../../../../core/services/message.service';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-outward-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './outward-preview.component.html',
  styleUrl: './outward-preview.component.scss'
})
export class OutwardPreviewComponent implements OnInit {
  data: ChallanData | null = null;
  isSaving: boolean = false;

  constructor(
    private outwardPreviewService: OutwardPreviewService,
    private apiService: ApiService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.data = this.outwardPreviewService.getPreviewData();
    if (!this.data) {
      this.router.navigate(['/dashboard/outward']);
    }
  }

  printPage(): void {
    if (!this.data) return;
    this.isSaving = true;

    const element = document.querySelector('.dc-card') as HTMLElement;
    if (!element) {
      this.messageService.error('Could not find the document to print');
      this.isSaving = false;
      return;
    }

    element.classList.add('exporting-pdf');

    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `${this.data.dcNo || this.data.receiverName}.pdf`,
      image: { type: 'jpeg' as "jpeg", quality: 0.98 },
      html2canvas: { 
        scale: 4, 
        useCORS: true, 
        letterRendering: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm' as "mm", format: [210, 148] as [number, number], orientation: 'landscape' as "landscape" },
      pagebreak: { mode: ['avoid-all'] }
    };

    // Generate PDF as base64 and send to backend
    html2pdf().from(element).set(opt).outputPdf('datauristring').then((pdfBase64: string) => {
      element.classList.remove('exporting-pdf');

      const payload = {
        companyName: this.data?.receiverName || 'Unknown',
        dcNo: this.data?.dcNo || 'DC_Unknown',
        base64Pdf: pdfBase64
      };

      this.apiService.post<any>('Print/save-pdf', payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.success) {
            this.messageService.success(`PDF saved successfully to: ${res.path}`);
          } else {
            this.messageService.error('Failed to save PDF to folder');
          }
        },
        error: (err) => {
          this.isSaving = false;
          console.error('PDF Save error:', err);
          this.messageService.error('Connection error while saving PDF');
        }
      });
    }).catch((err: unknown) => {
      element.classList.remove('exporting-pdf');
      this.isSaving = false;
      console.error('PDF generation error:', err);
      this.messageService.error('Could not generate PDF preview');
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/outward']);
  }
}
