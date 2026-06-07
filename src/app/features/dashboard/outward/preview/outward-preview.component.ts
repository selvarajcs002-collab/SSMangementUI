import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OutwardPreviewService, ChallanData } from '../../../../core/services/outward-preview.service';
import { ApiService } from '../../../../core/services/api.service';
import { MessageService } from '../../../../core/services/message.service';
import { DeliveryChallanPrintService, DcPrintRequest } from '../../../../core/services/delivery-challan-print.service';
import html2pdf from 'html2pdf.js';
import { MeterDeliveryChallanPreviewComponent } from './meter/meter-delivery-challan-preview.component';

@Component({
  selector: 'app-outward-preview',
  standalone: true,
  imports: [CommonModule, MeterDeliveryChallanPreviewComponent],
  templateUrl: './outward-preview.component.html',
  styleUrl: './outward-preview.component.scss'
})
export class OutwardPreviewComponent implements OnInit {
  data: ChallanData | null = null;
  isSaving: boolean = false;
  isDownloading: boolean = false;

  // New properties for matrix
  matrixColumns: string[] = [];
  matrixRows: any[] = [];
  matrixTotals: {[key: string]: number} = {};

  get totalBitsQuantity(): number {
    if (!this.data || !this.data.meterDetails) return 0;
    return this.data.meterDetails.reduce((sum, item) => sum + (Number(item.bitsCount) || 0), 0);
  }

  get totalMeterTypes(): number {
    if (!this.data || !this.data.meterDetails) return 0;
    return this.data.meterDetails.length;
  }

  constructor(
    private outwardPreviewService: OutwardPreviewService,
    private apiService: ApiService,
    private messageService: MessageService,
    private deliveryChallanPrintService: DeliveryChallanPrintService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.data = this.outwardPreviewService.getPreviewData();
    if (!this.data) {
      this.router.navigate(['/dashboard/outward']);
    } else {
      this.buildMatrix();
    }
  }

  buildMatrix(): void {
    if (this.data?.entryType === 'M' || !this.data?.items) return;

    const sizeSet = new Set<string>();
    this.data.items.forEach(item => {
      if (item.sizes) {
        item.sizes.forEach(s => sizeSet.add(s.label));
      }
    });
    
    // Sort sizes alphabetically
    this.matrixColumns = Array.from(sizeSet).sort();

    this.matrixRows = this.data.items.map(item => {
      const row: any = {
        colour: item.colour || 'UNKNOWN',
        styleNo: item.styleNo,
        designName: item.designName,
        total: item.count,
        sizes: {}
      };
      
      if (item.sizes) {
        item.sizes.forEach(s => {
          row.sizes[s.label] = s.qty;
        });
      }
      
      return row;
    });

    this.matrixTotals = {};
    this.matrixColumns.forEach(col => {
      this.matrixTotals[col] = this.matrixRows.reduce((sum, row) => sum + (row.sizes[col] || 0), 0);
    });
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
      filename: `DC_${this.data.dcNo || 'Unknown'}.pdf`,
      image: { type: 'jpeg' as "jpeg", quality: 0.98 },
      html2canvas: { 
        scale: 4, 
        useCORS: true, 
        letterRendering: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm' as "mm", format: [148, 210] as [number, number], orientation: 'portrait' as "portrait" },
      pagebreak: { mode: ['avoid-all'] }
    };

    // Generate PDF as base64 and send to backend
    html2pdf().from(element).set(opt as any).outputPdf('datauristring').then((pdfBase64: string) => {
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

  downloadDC(): void {
    if (!this.data) return;
    this.isDownloading = true;

    const colourBreakdowns = this.data.items?.map(item => {
      const cb: any = { colourName: item.colour };
      if (item.sizes) {
        item.sizes.forEach(s => {
          cb[s.label] = s.qty;
        });
      }
      return cb;
    }) || [];

    const entryType = this.data.entryType || 'S';

    const payload: any = {
      dcNo: this.data.dcNo,
      companyName: this.data.receiverName,
      address: this.data.receiverAddress,
      date: this.data.date,
      remarks: this.data.remarks,
      style: this.data.items && this.data.items.length > 0 ? this.data.items[0].styleNo : '',
      designReference: this.data.items && this.data.items.length > 0 ? this.data.items[0].designName : '',
      printedBy: localStorage.getItem('userId') || 'Current User',
      printMode: 'Original',
      entryType: entryType,
      company: this.data.company,
      items: this.data.items
    };

    if (entryType === 'M') {
      payload.itemType = 'Meter Based';
      payload.meterDetails = this.data.meterDetails || [];
      payload.totalMeterSum = this.data.totalMeterSum || 0;
    } else {
      payload.itemType = 'Size Based';
      payload.colourBreakdowns = colourBreakdowns;
    }

    this.deliveryChallanPrintService.generateAndDownload(payload).subscribe({
      next: (response) => {
        this.isDownloading = false;
        const blob = response.body;
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const contentDisposition = response.headers.get('content-disposition');
          let fileName = `DC_${this.data?.dcNo || 'Unknown'}.pdf`;
          if (contentDisposition) {
            const matches = /filename="([^"]*)"/.exec(contentDisposition);
            if (matches != null && matches[1]) {
              fileName = matches[1];
            }
          }
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
          this.messageService.success('DC downloaded successfully');
        } else {
          this.messageService.error('Failed to download PDF. Empty response.');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isDownloading = false;
        console.error('Download error:', err);
        this.messageService.error('Failed to download DC from server');
        this.cdr.detectChanges();
      }
    });
  }

  trackByFn(index: number, item: any): any {
    return item.colour || index;
  }
}
