import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { InventoryService } from '../../../core/services/inventory.service';
import { MaterialIssueService } from '../../../core/services/material-issue.service';
import { ThreadService } from '../../../core/services/thread.service';
import { NeedleService } from '../../../core/services/needle.service';
import { FoamService } from '../../../core/services/foam.service';
import { MaterialIssueDto, InventoryEntryDto } from '../../../core/models/inventory.model';

export interface BaseInventoryItem {
  inventoryId?: number;
  id: string; // Auto-generated SKU
  category: 'Thread' | 'Needle' | 'Foam';
  purchaseType: 'Cone' | 'Box' | 'Sheet';
  totalAvailableUnits: number;
  issuedUnits: number;
  productionUsed: number;
  remainingUnits: number;
  minStock: number;
  unit: string;
  status: 'In Stock' | 'Low Stock' | 'Out Of Stock';
  lastPurchaseDate: string;
  lastIssueDate: string | null;
  warehouseLocation: string;
}

export interface ThreadItem extends BaseInventoryItem {
  category: 'Thread';
  brand: string;
  shadeName: string;
  shadeCode: string; // Unique
  colourFamily: string;
  threadType: string;
}

export interface NeedleItem extends BaseInventoryItem {
  category: 'Needle';
  brand: string;
  needleSystem: string;
  needleSize: string;
  pointType: string;
  machineCompatibility: string;
}

export interface FoamItem extends BaseInventoryItem {
  category: 'Foam';
  foamType: string;
  thickness: string;
  colour: string;
  density: string;
}

export type InventoryItem = ThreadItem | NeedleItem | FoamItem;

export interface ActivityLog {
  id: number;
  date: Date;
  type: 'Purchased' | 'Issued' | 'Returned' | 'Production Used' | 'Adjustments';
  description: string;
  user: string;
  color: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SafeHtmlPipe, AlertComponent],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class InventoryComponent implements OnInit {
  icons = {
    box: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M12 12H5"/><path d="M19 12h-7"/></svg>`,
    download: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
    search: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    filter: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
    trendingUp: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
    trendingDown: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    package: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
    send: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    return: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
  };

  currentDate = new Date();
  
  // Category State
  activeCategory: 'Thread' | 'Needle' | 'Foam' | 'All' = 'All';

  // Modals/Drawers
  showAdvancedFilter = false;
  isAddDialogOpen = false;
  isIssueDialogOpen = false;
  isReturnDialogOpen = false;
  isDrawerOpen = false;
  currentStep = 1;
  loading = false;
  
  // Selections
  selectedItemForIssue: InventoryItem | null = null;
  selectedItemForReturn: InventoryItem | null = null;
  selectedItemDetails: InventoryItem | null = null;
  selectedMasterRecord: any = null; // Used for previewing master data in Add Purchase Modal
  
  // Forms
  filterForm!: FormGroup;
  addForm!: FormGroup;
  issueForm!: FormGroup;
  returnForm!: FormGroup;

  // Master Data populated from backend
  warehouses = ['WH1 - Main Store', 'WH2 - Embroidery Floor'];
  workers = [
    { id: 1, name: 'W001 - Raju' },
    { id: 2, name: 'W002 - Mahesh' }
  ];
  machines = [
    { id: 1, name: 'M/C 1 (Tajima)' },
    { id: 2, name: 'M/C 2 (SWF)' }
  ];
  statuses = ['In Stock', 'Low Stock', 'Out Of Stock'];

  // Linkable Master Arrays
  masterThreads: any[] = [];
  masterNeedles: any[] = [];
  masterFoams: any[] = [];

  // Enhanced Inventory Data
  inventoryData: InventoryItem[] = [];

  filteredData: InventoryItem[] = [];
  activityFeed: ActivityLog[] = [];

  alertMessage: string | null = null;
  alertType: 'success' | 'error' = 'success';

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe,
    private inventoryService: InventoryService,
    private materialIssueService: MaterialIssueService,
    private threadService: ThreadService,
    private needleService: NeedleService,
    private foamService: FoamService
  ) {}

  ngOnInit() {
    this.initForms();
    this.loadMasterData();
    setInterval(() => { this.currentDate = new Date(); this.cdr.markForCheck(); }, 60000);

    // Dynamic Master Logic
    this.addForm.get('category')?.valueChanges.subscribe(val => {
      this.addForm.get('selectedMasterId')?.setValue('');
      this.selectedMasterRecord = null;
      this.cdr.markForCheck();
    });

    this.addForm.get('selectedMasterId')?.valueChanges.subscribe(id => {
      const cat = this.addForm.get('category')?.value;
      const numericId = Number(id);
      if (cat === 'Thread') this.selectedMasterRecord = this.masterThreads.find(m => m.id === numericId);
      else if (cat === 'Needle') this.selectedMasterRecord = this.masterNeedles.find(m => m.id === numericId);
      else if (cat === 'Foam') this.selectedMasterRecord = this.masterFoams.find(m => m.id === numericId);
      this.cdr.markForCheck();
    });

    this.addForm.get('purchaseType')?.valueChanges.subscribe(val => {
      if (val === 'Box') {
        this.addForm.get('totalBoxes')?.setValidators([Validators.required, Validators.min(1)]);
        this.addForm.get('unitsPerBox')?.setValidators([Validators.required, Validators.min(1)]);
        this.addForm.get('totalUnits')?.clearValidators();
      } else {
        this.addForm.get('totalBoxes')?.clearValidators();
        this.addForm.get('unitsPerBox')?.clearValidators();
        this.addForm.get('totalUnits')?.setValidators([Validators.required, Validators.min(1)]);
      }
      this.addForm.updateValueAndValidity();
    });

    this.addForm.valueChanges.subscribe(val => {
      if (val.purchaseType === 'Box') {
        this.addForm.patchValue({ calculatedTotal: (val.totalBoxes || 0) * (val.unitsPerBox || 0) }, { emitEvent: false });
      }
    });

    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }

  initForms() {
    this.filterForm = this.fb.group({ search: [''], status: [''], warehouse: [''] });

    this.addForm = this.fb.group({
      category: ['Thread', Validators.required],
      selectedMasterId: ['', Validators.required], // Strict link to Master Data
      purchaseType: ['Cone', Validators.required],
      totalUnits: [null], totalBoxes: [null], unitsPerBox: [null], calculatedTotal: [{value: 0, disabled: true}],
      unit: ['Cones', Validators.required], minStock: [10, Validators.required], warehouse: ['WH1 - Main Store']
    });

    this.issueForm = this.fb.group({ workerId: ['', Validators.required], machineNo: ['', Validators.required], issueQty: [null, [Validators.required, Validators.min(1)]], designNo: ['', Validators.required], remarks: [''] });
    this.returnForm = this.fb.group({ workerId: ['', Validators.required], returnQty: [null, [Validators.required, Validators.min(1)]], damagedQty: [0, [Validators.min(0)]], remarks: [''] });
  }

  get metrics() {
    return {
      totalItems: this.inventoryData.length,
      totalAvailable: this.inventoryData.reduce((acc, curr) => acc + curr.remainingUnits, 0),
      lowStock: this.inventoryData.filter(i => i.status === 'Low Stock').length,
      outOfStock: this.inventoryData.filter(i => i.status === 'Out Of Stock').length
    };
  }

  setCategoryTab(category: 'Thread' | 'Needle' | 'Foam' | 'All') {
    this.activeCategory = category;
    this.applyFilters();
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const search = (filters.search || '').toLowerCase();
    
    this.filteredData = this.inventoryData.filter(item => {
      const matchCat = this.activeCategory === 'All' ? true : item.category === this.activeCategory;
      const matchSearch = item.id.toLowerCase().includes(search) || JSON.stringify(item).toLowerCase().includes(search);
      const matchStatus = filters.status ? item.status === filters.status : true;
      const matchWH = filters.warehouse ? item.warehouseLocation === filters.warehouse : true;
      return matchCat && matchSearch && matchStatus && matchWH;
    });
    this.cdr.markForCheck();
  }

  resetFilters() { this.filterForm.reset(); }
  toggleAdvancedFilter() { this.showAdvancedFilter = !this.showAdvancedFilter; }
  getStatusClass(status: string) { return status === 'In Stock' ? 'status-success' : status === 'Low Stock' ? 'status-warning' : 'status-danger'; }

  asThread(item: any): ThreadItem { return item as ThreadItem; }
  asNeedle(item: any): NeedleItem { return item as NeedleItem; }
  asFoam(item: any): FoamItem { return item as FoamItem; }

  // SKU logic maps from the Master Record
  generateSKU(cat: string, masterRec: any): string {
    if (cat === 'Thread') {
      const brand = (masterRec.brand || 'UNK').substring(0, 3).toUpperCase();
      const shade = (masterRec.shadeCode || 'UNK').toUpperCase();
      return `THREAD-${brand}-${shade}`;
    } else if (cat === 'Needle') {
      const sys = (masterRec.needleSystem || 'UNK').toUpperCase();
      const sz = (masterRec.needleSize || 'UNK').replace(/[^a-zA-Z0-9]/g, '');
      return `NEEDLE-${sys}-${sz}`;
    } else {
      const type = (masterRec.foamType || 'UNK').substring(0, 4).toUpperCase();
      const th = (masterRec.thickness || 'UNK').toUpperCase();
      return `FOAM-${type}-${th}`;
    }
  }

  loadMasterData() {
    // Load Threads
    this.threadService.getThreads().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.masterThreads = res.data.map(t => ({
            id: t.ThreadId,
            brand: t.BrandName,
            shadeCode: t.ShadeCode,
            shadeName: t.ShadeName,
            colourFamily: t.ColourFamily,
            threadType: t.ThreadType
          }));
        }
        this.loadInventoryData();
      },
      error: () => this.loadInventoryData()
    });

    // Load Needles
    this.needleService.getNeedles().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.masterNeedles = res.data.map(n => ({
            id: n.NeedleId,
            brand: n.BrandName,
            needleSystem: n.NeedleSystem,
            needleSize: n.NeedleSize,
            pointType: n.PointType
          }));
        }
        this.loadInventoryData();
      }
    });

    // Load Foams
    this.foamService.getFoams().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.masterFoams = res.data.map(f => ({
            id: f.FoamId,
            foamType: f.FoamType,
            thickness: f.Thickness,
            colour: f.Colour,
            density: f.Density
          }));
        }
        this.loadInventoryData();
      }
    });
  }

  loadInventoryData() {
    this.inventoryService.getInventoryList(1, 100).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.inventoryData = res.data.map(item => {
            let status: 'In Stock' | 'Low Stock' | 'Out Of Stock' = 'In Stock';
            if (item.RemainingCones === 0) status = 'Out Of Stock';
            else if (item.RemainingCones <= item.MinStockAlert) status = 'Low Stock';

            let mapped: any = {
              inventoryId: item.InventoryId,
              id: item.SKU,
              category: item.Category,
              purchaseType: item.PurchaseType === 'BOX' ? 'Box' : 'Cone',
              totalAvailableUnits: item.TotalPurchasedCones,
              issuedUnits: item.IssuedCones,
              productionUsed: item.UsedCones,
              remainingUnits: item.RemainingCones,
              minStock: item.MinStockAlert,
              unit: item.Category === 'Thread' ? 'Cones' : (item.Category === 'Needle' ? 'Pieces' : 'Sheets'),
              status: status,
              lastPurchaseDate: item.CreatedDate ? this.datePipe.transform(new Date(item.CreatedDate), 'yyyy-MM-dd')! : this.datePipe.transform(new Date(), 'yyyy-MM-dd')!,
              lastIssueDate: null,
              warehouseLocation: item.WarehouseId === 1 ? 'WH1 - Main Store' : 'WH2 - Embroidery Floor'
            };

            if (item.Category === 'Thread') {
              const mt = this.masterThreads.find(t => t.id === item.ItemId);
              if (mt) {
                Object.assign(mapped, {
                  brand: mt.brand,
                  shadeName: mt.shadeName,
                  shadeCode: mt.shadeCode,
                  colourFamily: mt.colourFamily,
                  threadType: mt.threadType
                });
              } else {
                Object.assign(mapped, {
                  brand: 'Madeira',
                  shadeName: item.ItemName || 'Thread Item',
                  shadeCode: 'M-1001',
                  colourFamily: 'Blue',
                  threadType: 'Viscose Rayon'
                });
              }
            } else if (item.Category === 'Needle') {
              const mn = this.masterNeedles.find(n => n.id === item.ItemId);
              if (mn) {
                Object.assign(mapped, {
                  brand: mn.brand,
                  needleSystem: mn.needleSystem,
                  needleSize: mn.needleSize,
                  pointType: mn.pointType
                });
              } else {
                Object.assign(mapped, {
                  brand: 'Organ',
                  needleSystem: 'DBxK5',
                  needleSize: item.ItemName || '#11/75',
                  pointType: 'Ball Point'
                });
              }
            } else if (item.Category === 'Foam') {
              const mf = this.masterFoams.find(f => f.id === item.ItemId);
              if (mf) {
                Object.assign(mapped, {
                  foamType: mf.foamType,
                  thickness: mf.thickness,
                  colour: mf.colour,
                  density: mf.density
                });
              } else {
                Object.assign(mapped, {
                  foamType: item.ItemName || 'EVA Foam',
                  thickness: '3mm',
                  colour: 'White',
                  density: 'High'
                });
              }
            }
            return mapped;
          });
          this.applyFilters();
          this.loadRecentActivity();
        }
      }
    });
  }

  loadRecentActivity() {
    this.materialIssueService.getMaterialIssueList().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.activityFeed = res.data.slice(0, 10).map(issue => {
            const wName = this.workers.find(w => w.id === issue.WorkerId)?.name || `Worker ID: ${issue.WorkerId}`;
            const mName = this.machines.find(m => m.id === issue.MachineId)?.name || `Machine ID: ${issue.MachineId}`;
            return {
              id: issue.IssueId,
              date: issue.IssueDate ? new Date(issue.IssueDate) : new Date(),
              type: 'Issued',
              description: `Issued ${issue.IssueQty} units to ${wName} for ${mName} (Design: ${issue.DesignNo})`,
              user: issue.CreatedBy || 'Store Keeper',
              color: '#3B82F6'
            };
          });
          this.cdr.markForCheck();
        }
      }
    });
  }

  openAddDialog() { this.isAddDialogOpen = true; this.currentStep = 1; this.selectedMasterRecord = null; this.addForm.reset({ category: 'Thread', selectedMasterId: '', purchaseType: 'Cone', unit: 'Cones', minStock: 10, warehouse: 'WH1 - Main Store' }); }
  closeAddDialog() { this.isAddDialogOpen = false; }
  nextStep() { if (this.currentStep < 3) this.currentStep++; }
  prevStep() { if (this.currentStep > 1) this.currentStep--; }
  setStep(step: number) { if (step < this.currentStep) this.currentStep = step; }

  saveInventory() {
    if (this.addForm.invalid || !this.selectedMasterRecord) { this.showAlert('Complete all required fields and select a Master item.', 'error'); return; }
    this.loading = true;
    
    const val = this.addForm.value;
    const sku = this.generateSKU(val.category, this.selectedMasterRecord);

    const payload: InventoryEntryDto = {
      category: val.category,
      itemId: Number(val.selectedMasterId),
      supplierId: 1, // Seeded supplier ID
      warehouseId: val.warehouse === 'WH1 - Main Store' ? 1 : 2,
      sku: sku,
      purchaseType: val.purchaseType === 'Box' ? 'BOX' : 'CONE',
      conesPerBox: val.purchaseType === 'Box' ? Number(val.unitsPerBox) : undefined,
      totalBoxes: val.purchaseType === 'Box' ? Number(val.totalBoxes) : undefined,
      directConeCount: val.purchaseType === 'Cone' ? Number(val.totalUnits) : undefined,
      minStockAlert: Number(val.minStock),
      isActive: true,
      user: 'Store Keeper'
    };

    this.inventoryService.saveInventory(payload).subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.success) {
          this.showAlert(res.message || 'Inventory purchase recorded successfully!', 'success');
          this.closeAddDialog();
          this.loadInventoryData();
        } else {
          this.showAlert(res.message || 'Failed to save inventory.', 'error');
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.showAlert(err?.error?.message || 'Error occurred while saving inventory.', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  // Issue / Return Logic remains the same
  openIssueDialog(item: InventoryItem) { this.selectedItemForIssue = item; this.isIssueDialogOpen = true; this.issueForm.reset(); }
  closeIssueDialog() { this.isIssueDialogOpen = false; }
  saveIssue() {
    if (this.issueForm.invalid || !this.selectedItemForIssue) return;
    const val = this.issueForm.value;
    if (val.issueQty > this.selectedItemForIssue.remainingUnits) { this.showAlert('Not enough stock', 'error'); return; }
    this.loading = true;
    
    const payload: MaterialIssueDto = {
      workerId: Number(val.workerId),
      machineId: Number(val.machineNo),
      inventoryId: this.selectedItemForIssue.inventoryId!,
      issueQty: Number(val.issueQty),
      designNo: val.designNo,
      user: 'Store Keeper'
    };

    this.materialIssueService.saveMaterialIssue(payload).subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.success) {
          this.showAlert(res.message || 'Material issued successfully!', 'success');
          this.closeIssueDialog();
          this.loadInventoryData();
        } else {
          this.showAlert(res.message || 'Failed to issue material.', 'error');
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.showAlert(err?.error?.message || 'Error occurred while saving issue.', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  openReturnDialog(item: InventoryItem) { this.selectedItemForReturn = item; this.isReturnDialogOpen = true; this.returnForm.reset({ damagedQty: 0 }); }
  closeReturnDialog() { this.isReturnDialogOpen = false; }
  saveReturn() {
    if (this.returnForm.invalid || !this.selectedItemForReturn) return;
    const val = this.returnForm.value;
    const goodQty = val.returnQty - val.damagedQty;
    this.loading = true;
    setTimeout(() => {
      const idx = this.inventoryData.findIndex(i => i.id === this.selectedItemForReturn!.id);
      if (idx !== -1) {
        this.inventoryData[idx].remainingUnits += goodQty; this.inventoryData[idx].issuedUnits -= val.returnQty;
        this.inventoryData[idx].status = this.inventoryData[idx].remainingUnits > this.inventoryData[idx].minStock ? 'In Stock' : 'Low Stock';
        this.activityFeed.unshift({ id: Date.now(), date: new Date(), type: 'Returned', description: `Returned ${val.returnQty} of ${this.inventoryData[idx].id} from ${val.workerId} (${val.damagedQty} damaged)`, user: 'Store Keeper', color: '#F59E0B' });
      }
      this.applyFilters(); this.loading = false; this.closeReturnDialog(); this.showAlert('Material returned!', 'success'); this.cdr.markForCheck();
    }, 600);
  }

  openDrawer(item: InventoryItem) { this.selectedItemDetails = item; this.isDrawerOpen = true; }
  closeDrawer() { this.isDrawerOpen = false; setTimeout(() => this.selectedItemDetails = null, 300); }
  showAlert(msg: string, type: 'success' | 'error') { this.alertMessage = msg; this.alertType = type; setTimeout(() => { this.alertMessage = null; this.cdr.markForCheck(); }, 4000); }
}
