import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OutwardPreviewService, ChallanData } from '../../../../core/services/outward-preview.service';
import { ApiService } from '../../../../core/services/api.service';
import { MessageService } from '../../../../core/services/message.service';
import { DeliveryChallanPrintService, DcPrintRequest } from '../../../../core/services/delivery-challan-print.service';
import { CompanyService } from '../../../../core/services/company.service';
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
  matrixTotals: { [key: string]: number } = {};

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
    private companyService: CompanyService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

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

  private buildPrintPayload(gstNo: string): any {
    const colourBreakdowns = this.data!.items?.map(item => {
      const cb: any = { colourName: item.colour };
      if (item.sizes) {
        item.sizes.forEach(s => {
          cb[s.label] = s.qty;
        });
      }
      return cb;
    }) || [];

    const entryType = this.data!.entryType || 'S';

    const formattedDate = (() => {
      const d = new Date(this.data!.date);
      const dd = ('0' + d.getDate()).slice(-2);
      const mm = ('0' + (d.getMonth() + 1)).slice(-2);
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    })();

    const payload: any = {
      dcNo: this.data!.dcNo,
      companyName: this.data!.receiverName,
      address: this.data!.receiverAddress,
      gstNo: gstNo,
      date: formattedDate,
      remarks: this.data!.remarks,
      style: this.data!.items && this.data!.items.length > 0 ? this.data!.items[0].styleNo : '',
      designReference: this.data!.items && this.data!.items.length > 0 ? this.data!.items[0].designName : '',
      printedBy: localStorage.getItem('userId') || 'Current User',
      printMode: 'Original',
      entryType: entryType,
      company: this.data!.company,
      items: this.data!.items,
      deliveryTo: this.data!.deliveryTo,
      poNo: this.data!.poNo,
      weight: this.data!.weight,
      noOfBundles: this.data!.noOfBundles,
      supplierDcNo: this.data!.supplierDcNo
    };

    if (entryType === 'M') {
      payload.itemType = 'Meter Based';
      payload.meterDetails = this.data!.meterDetails || [];
      payload.totalMeterSum = this.data!.totalMeterSum || 0;
    } else {
      payload.itemType = 'Size Based';
      payload.colourBreakdowns = colourBreakdowns;
    }

    return payload;
  }

  printPage(): void {
    if (!this.data) return;
    this.isSaving = true;

    // Fetch GST number for company ID 2 (static for now)
    this.companyService.getCompanyById(2).subscribe({
      next: (company) => {
        const gstNo = company?.gst_No ?? company?.gstNo ?? '';
        const payload = this.buildPrintPayload(gstNo);

        this.deliveryChallanPrintService.generateAndPrint(payload).subscribe({
          next: (res) => {
            this.isSaving = false;
            if (res.success) {
              this.messageService.success(`Challan printed successfully`);
            } else {
              this.messageService.error(res.message || 'Failed to print challan');
            }
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.isSaving = false;
            console.error('Print error:', err);
            this.messageService.error('Connection error while printing');
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Company fetch error:', err);
        this.messageService.error('Failed to fetch GST number');
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/outward']);
  }

  downloadDC(): void {
    if (!this.data) return;
    this.isDownloading = true;

    // Fetch GST number for company ID 2 (static for now)
    this.companyService.getCompanyById(2).subscribe({
      next: (company) => {
        const gstNo = company?.gst_No ?? company?.gstNo ?? '';
        const payload = this.buildPrintPayload(gstNo);

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
                const matches = /filename=\"([^\"]*)\"/.exec(contentDisposition);
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
      },
      error: (err) => {
        this.isDownloading = false;
        console.error('Company fetch error:', err);
        this.messageService.error('Failed to fetch GST number');
        this.cdr.detectChanges();
      }
    });
  }

  trackByFn(index: number, item: any): any {
    return item.colour || index;
  }
}
