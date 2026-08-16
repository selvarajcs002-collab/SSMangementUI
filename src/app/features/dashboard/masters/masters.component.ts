import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { ThreadService } from '../../../core/services/thread.service';
import { NeedleService } from '../../../core/services/needle.service';
import { FoamService } from '../../../core/services/foam.service';
import { ThreadRequestDto, NeedleRequestDto, FoamRequestDto } from '../../../core/models/inventory.model';

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SectionHeaderComponent, SafeHtmlPipe],
  templateUrl: './masters.component.html',
  styleUrl: './masters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MastersComponent implements OnInit {
  activeTab: 'thread' | 'needle' | 'foam' | 'supplier' | 'machine' | 'worker' = 'thread';
  
  threadForm!: FormGroup;
  needleForm!: FormGroup;
  foamForm!: FormGroup;
  
  icons = {
    settings: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    save: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`,
    package: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
    box: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`
  };

  threadsList: any[] = [];
  needlesList: any[] = [];
  foamsList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private threadService: ThreadService,
    private needleService: NeedleService,
    private foamService: FoamService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initForms();
    this.loadAllMasters();
  }

  initForms() {
    this.threadForm = this.fb.group({
      brandName: ['', Validators.required],
      shadeName: ['', Validators.required],
      shadeCode: ['', Validators.required],
      colourFamily: [''],
      threadType: ['Viscose Rayon', Validators.required],
      thickness: ['']
    });

    this.needleForm = this.fb.group({
      brandName: ['', Validators.required],
      needleSystem: ['', Validators.required],
      needleSize: ['', Validators.required],
      pointType: ['Ball Point']
    });

    this.foamForm = this.fb.group({
      foamType: ['', Validators.required],
      thickness: ['', Validators.required],
      colour: [''],
      density: ['High']
    });
  }

  loadAllMasters() {
    this.loadThreads();
    this.loadNeedles();
    this.loadFoams();
  }

  loadThreads() {
    this.threadService.getThreads().subscribe(res => {
      if (res.success) {
        this.threadsList = res.data;
        this.cdr.markForCheck();
      }
    });
  }

  loadNeedles() {
    this.needleService.getNeedles().subscribe(res => {
      if (res.success) {
        this.needlesList = res.data;
        this.cdr.markForCheck();
      }
    });
  }

  loadFoams() {
    this.foamService.getFoams().subscribe(res => {
      if (res.success) {
        this.foamsList = res.data;
        this.cdr.markForCheck();
      }
    });
  }

  saveThread() {
    if (this.threadForm.invalid) {
      this.threadForm.markAllAsTouched();
      return;
    }
    
    const request: ThreadRequestDto = {
      ...this.threadForm.value,
      coneSize: 'Standard',
      isActive: true,
      user: 'System'
    };

    this.threadService.saveThread(request).subscribe(res => {
      if (res.success) {
        this.threadForm.reset({ threadType: 'Viscose Rayon' });
        this.loadThreads();
      } else {
        alert(res.message || 'Error saving thread master');
      }
    });
  }

  saveNeedle() {
    if (this.needleForm.invalid) {
      this.needleForm.markAllAsTouched();
      return;
    }

    const request: NeedleRequestDto = {
      ...this.needleForm.value,
      isActive: true,
      user: 'System'
    };

    this.needleService.saveNeedle(request).subscribe(res => {
      if (res.success) {
        this.needleForm.reset({ pointType: 'Ball Point' });
        this.loadNeedles();
      } else {
        alert(res.message || 'Error saving needle master');
      }
    });
  }

  saveFoam() {
    if (this.foamForm.invalid) {
      this.foamForm.markAllAsTouched();
      return;
    }

    const request: FoamRequestDto = {
      ...this.foamForm.value,
      isActive: true,
      user: 'System'
    };

    this.foamService.saveFoam(request).subscribe(res => {
      if (res.success) {
        this.foamForm.reset({ density: 'High' });
        this.loadFoams();
      } else {
        alert(res.message || 'Error saving foam master');
      }
    });
  }

  setTab(tab: any) {
    this.activeTab = tab;
  }
}
