import re

ts_path = 'outward.component.ts'
html_path = 'outward.component.html'

with open(ts_path, 'r', encoding='utf-8') as f:
    ts = f.read()

# Replace sizeBreakdown in initForm with colourBreakdowns
ts = ts.replace("sizeBreakdown: this.fb.array([]),", "colourBreakdowns: this.fb.array([]),")

# Replace get sizeBreakdown() with get colourBreakdowns()
ts = ts.replace("""  get sizeBreakdown(): FormArray {
    return this.outwardForm.get('sizeBreakdown') as FormArray;
  }""", """  get colourBreakdowns(): FormArray {
    return this.outwardForm.get('colourBreakdowns') as FormArray;
  }

  getSizesArray(colourIndex: number): FormArray {
    return this.colourBreakdowns.at(colourIndex).get('sizes') as FormArray;
  }

  // NEW Multi Colour Properties
  isColourPickerOpen: boolean = false;
  availableColours: string[] = [];
  activeColourIndex: number = -1;
  activeColourName: string = '';
""")

# Fix calculateTotal
ts = ts.replace("""  calculateTotal(): void {
    this.totalQuantity = this.sizeBreakdown.controls.reduce((sum, control) => {
      const qty = control.get('quantity')?.value || 0;
      return sum + Number(qty);
    }, 0);
  }""", """  calculateTotal(): void {
    this.totalQuantity = 0;
    this.colourBreakdowns.controls.forEach(colourCtrl => {
      let cTotal = 0;
      const sizesArray = colourCtrl.get('sizes') as FormArray;
      sizesArray.controls.forEach(sizeCtrl => {
        cTotal += Number(sizeCtrl.get('quantity')?.value || 0);
      });
      colourCtrl.get('colourTotal')?.setValue(cTotal, { emitEvent: false });
      this.totalQuantity += cTotal;
    });
    this.cdr.markForCheck();
  }""")

# resetForm
ts = ts.replace("this.sizeBreakdown.clear();", "this.colourBreakdowns.clear();")

# trackChanges
ts = ts.replace("""      if (value !== 'size') {
        this.sizeBreakdown.clear();
      }
      this.calculateTotal();""", """      if (value !== 'size') {
        this.colourBreakdowns.clear();
      }
      this.calculateTotal();""")
ts = ts.replace("""    this.sizeBreakdown.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.calculateTotal();
    });""", """    this.colourBreakdowns.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.calculateTotal();
    });""")

# setEntryType
ts = ts.replace("""      this.sizeBreakdown.clear();
      this.totalQuantity = 0;""", """      this.colourBreakdowns.clear();
      this.totalQuantity = 0;""")

# Add new Add Colour and Add Size methods
add_colour_methods = """
  // MULTI COLOUR LOGIC
  selectColour() {
    if (!this.selectedCompanyId || !this.selectedStyle || !this.selectedDesign) {
      this.showAlert('Please select Company, Style, and Design first.', 'error');
      return;
    }
    this.inwardService.getAvailableColours(this.selectedCompanyId, this.selectedStyle, this.selectedDesign).subscribe({
      next: (colours) => {
        const addedColours = this.colourBreakdowns.controls.map(c => c.get('colourName')?.value);
        this.availableColours = colours.filter(c => !addedColours.includes(c));
        if (this.availableColours.length > 0) {
          this.isColourPickerOpen = true;
        } else {
          this.showAlert('No more colours available or all colours added.', 'error');
        }
        this.cdr.markForCheck();
      }
    });
  }

  addColourRow(colourName: string) {
    if (!colourName) return;
    const row = this.fb.group({
      colourName: [colourName, Validators.required],
      colourTotal: [0],
      sizes: this.fb.array([])
    });
    this.colourBreakdowns.push(row);
    this.isColourPickerOpen = false;
    this.calculateTotal();
  }

  removeColour(index: number) {
    this.colourBreakdowns.removeAt(index);
    this.calculateTotal();
  }

  selectSizesForColour(colourIndex: number) {
    const colourName = this.colourBreakdowns.at(colourIndex).get('colourName')?.value;
    this.activeColourIndex = colourIndex;
    this.activeColourName = colourName;

    this.isSizesLoading = true;
    this.inwardService.getAvailableSizesByColour(this.selectedCompanyId!, this.selectedStyle, this.selectedDesign, colourName).subscribe({
      next: (res: any[]) => {
        this.sizeData = res || [];
        if (this.sizeData.length > 0) {
          this.sizes = this.sizeData.map(x => (x.size || '').toUpperCase());
          this.isSizePickerOpen = true;
        } else {
          this.showAlert('No sizes found for this colour', 'error');
        }
        this.isSizesLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSizesLoading = false;
        this.showAlert('Failed to fetch sizes', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  onSizesSelected(selectedSizes: string[]) {
    const sizesArray = this.getSizesArray(this.activeColourIndex);
    const currentSizes = sizesArray.controls.map(c => c.get('size')?.value);

    selectedSizes.forEach(size => {
      if (!currentSizes.includes(size)) {
        const stockInfo = this.sizeData.find(s => (s.size || '').toUpperCase() === size);
        const avail = stockInfo ? stockInfo.count : 0;
        sizesArray.push(this.fb.group({
          sizeCountId: [null],
          size: [size, Validators.required],
          availableQty: [avail],
          quantity: [null, [Validators.required, Validators.min(1), Validators.max(avail)]]
        }));
      }
    });
    this.isSizePickerOpen = false;
    this.calculateTotal();
  }

  removeSizeRow(colourIndex: number, sizeIndex: number) {
    this.getSizesArray(colourIndex).removeAt(sizeIndex);
    this.calculateTotal();
  }

"""
ts = ts.replace("  addSizeRow(size?: string): void {", add_colour_methods + "  addSizeRow_OLD(size?: string): void {")

# Modify selectSizes to redirect (if accidentally called)
ts = ts.replace("  selectSizes() {", "  selectSizes() {\n    // Replaced by selectSizesForColour")

# Edit Mode patchForm
patch_form_multi_colour = """
    this.colourBreakdowns.clear();
    if (data.colourBreakdowns && data.colourBreakdowns.length > 0) {
      data.colourBreakdowns.forEach((cb: any) => {
        const row = this.fb.group({
          colourName: [cb.colourName, Validators.required],
          colourTotal: [0],
          sizes: this.fb.array([])
        });
        const sizesArray = row.get('sizes') as FormArray;
        if (cb.sizes && cb.sizes.length > 0) {
          cb.sizes.forEach((sc: any) => {
            sizesArray.push(this.fb.group({
              sizeCountId: [sc.sizeCountId],
              size: [sc.size, Validators.required],
              availableQty: [999999], // For edit mode, we bypass max validation or fetch it if needed
              quantity: [sc.count, [Validators.required, Validators.min(1)]]
            }));
          });
        }
        this.colourBreakdowns.push(row);
      });
    } else if (data.sizeCounts && data.sizeCounts.length > 0) {
      // Fallback for old single colour data
      const row = this.fb.group({
          colourName: [data.colour || 'MULTI', Validators.required],
          colourTotal: [0],
          sizes: this.fb.array([])
      });
      const sizesArray = row.get('sizes') as FormArray;
      data.sizeCounts.forEach((sc: any) => {
        sizesArray.push(this.fb.group({
          sizeCountId: [sc.sizeCountId],
          size: [sc.size, Validators.required],
          availableQty: [999999], 
          quantity: [sc.count, [Validators.required, Validators.min(1)]]
        }));
      });
      this.colourBreakdowns.push(row);
    }
"""
ts = re.sub(r"this\.sizeBreakdown\.clear\(\);[\s\S]*?this\.calculateTotal\(\);", patch_form_multi_colour + "\n    this.calculateTotal();", ts)

# Validation logic
is_form_valid = """
    return this.selectedCompanyId &&
           this.selectedStyle &&
           this.colourBreakdowns.length > 0 &&
           this.outwardForm.valid &&
           this.colourBreakdowns.controls.every(c => (c.get('sizes') as FormArray).length > 0 && c.valid);
"""
ts = re.sub(r"return this\.selectedCompanyId &&[\s\S]*?this\.outwardForm\.valid;", is_form_valid, ts)

# Update payload builder logic
ts = ts.replace("colour: formVal.colour,", "colour: formVal.colour || 'MULTI',")
update_payload_sizes = """
        colourBreakdowns: this.colourBreakdowns.getRawValue().map((c: any) => ({
          colourName: c.colourName,
          sizes: c.sizes.map((s: any) => ({
            size: s.size,
            count: Number(s.quantity) || 0,
            sizeCountId: s.sizeCountId
          }))
        }))
"""
ts = re.sub(r"sizeCounts: this\.sizeBreakdown\.getRawValue\(\)\.map\(\(c: any\) => \(\{[\s\S]*?\}\)\)", update_payload_sizes, ts)

insert_payload_sizes = """
        colourBreakdowns: this.colourBreakdowns.getRawValue().map((c: any) => ({
          colourName: c.colourName,
          sizes: c.sizes.map((s: any) => ({
            size: s.size,
            count: Number(s.quantity) || 0
          }))
        }))
"""
ts = re.sub(r"sizes: this\.sizeBreakdown\.getRawValue\(\)\.map\(\(c: any\) => \(\{[\s\S]*?\}\)\)", insert_payload_sizes, ts)


# OutwardPreviewService mapping
preview_map = """
        sizes: this.colourBreakdowns.controls.flatMap(c => 
          (c.get('sizes') as FormArray).controls.map(sc => ({
            label: `${c.get('colourName')?.value} - ${sc.get('size')?.value}`,
            qty: Number(sc.get('quantity')?.value) || 0
          }))
        ),
"""
ts = re.sub(r"sizes: this\.sizeBreakdown\.controls\.map\(c => \(\{[\s\S]*?\}\)\),", preview_map, ts)


# Save TS
with open('outward.component.ts', 'w', encoding='utf-8') as f:
    f.write(ts)


# Now HTML
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Hide Colour dropdown from header
html = html.replace('<!-- Colour (Dropdown) -->', '<!-- Colour (Dropdown) -->\n            <!-- HIDING FOR MULTI-COLOUR FLOW (only show for Meter if needed, but we default to MULTI so we can just hide it for size) -->\n            <div class="input-group" *ngIf="entryType === \'meter\'">')
html = html.replace('<div class="input-group">\n              <label>Colour <span class="required">*</span></label>', '<div>\n              <label>Colour <span class="required">*</span></label>')

multi_colour_html = """
          <!-- NEW: Multi Colour Size Breakdown Section (Size Based only) -->
          <div class="size-breakdown-section" *ngIf="entryType === 'size' && outwardForm.get('itemType')?.value === 'size'">
            <div class="section-header-inline">
              <div class="title-group">
                <h3>Multi Colour Size Breakdown</h3>
                <p class="empty-hint">Add multiple colours and enter size wise quantities for each colour.</p>
              </div>
              <button type="button" class="btn-select-sizes" (click)="selectColour()"
                [disabled]="!isDataLoaded || isSizesLoading">
                <span class="btn-icon" [innerHTML]="icons.plus | safeHtml"></span>
                Add Colour
              </button>
            </div>

            <div formArrayName="colourBreakdowns" class="colour-cards-list" style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px;">
              <div *ngFor="let colourGroup of colourBreakdowns.controls; let cIndex=index" [formGroupName]="cIndex" class="colour-card animate-in" style="border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; overflow: hidden;">
                <div class="colour-card-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #e2e8f0; border-bottom: 1px solid #cbd5e1;">
                  <div class="cc-title" style="display: flex; align-items: center; gap: 12px;">
                    <h4 style="margin: 0; font-size: 15px; color: #1e293b; font-weight: 600;">{{ colourGroup.get('colourName')?.value }}</h4>
                    <span class="cc-total" style="font-size: 13px; color: #475569; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">Total: {{ colourGroup.get('colourTotal')?.value }}</span>
                  </div>
                  <div class="cc-actions">
                    <button type="button" class="btn-delete-row" (click)="removeColour(cIndex)" title="Delete Colour" style="color: #ef4444;">
                      <span [innerHTML]="icons.trash | safeHtml"></span>
                    </button>
                  </div>
                </div>

                <div class="colour-card-body" style="padding: 16px;">
                  <div class="size-list" formArrayName="sizes">
                    <div *ngFor="let sizeRow of getSizesArray(cIndex).controls; let sIndex=index" [formGroupName]="sIndex" class="size-row animate-in" style="background: white; border-bottom: none; margin-bottom: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                      <div class="field-col size-label-display">
                        <div class="size-badge">{{ sizeRow.get('size')?.value }}</div>
                        <small class="text-muted" style="display:block; font-size:11px; margin-top:4px;">Avail: {{ sizeRow.get('availableQty')?.value || 0 }}</small>
                      </div>
                      <div class="field-col size-qty">
                        <input type="number" formControlName="quantity" placeholder="Enter Count" class="form-control"
                          [class.invalid]="sizeRow.get('quantity')?.touched && sizeRow.get('quantity')?.invalid">
                        <div class="error-text" *ngIf="sizeRow.get('quantity')?.touched && sizeRow.get('quantity')?.hasError('max')" style="font-size: 11px;">Exceeds {{ sizeRow.get('availableQty')?.value }}</div>
                      </div>
                      <button type="button" class="btn-delete-row" (click)="removeSizeRow(cIndex, sIndex)" title="Delete Size">
                        <span [innerHTML]="icons.trash | safeHtml"></span>
                      </button>
                    </div>

                    <div class="sg-empty" *ngIf="getSizesArray(cIndex).length === 0" style="padding: 12px; text-align: center; color: #64748b; font-size: 13px; font-style: italic;">
                      No sizes added yet.
                    </div>
                  </div>
                  
                  <div class="cc-footer-actions" style="margin-top: 12px; text-align: right;">
                    <button type="button" class="btn-add-size" (click)="selectSizesForColour(cIndex)" style="background: white; border: 1px dashed #94a3b8; color: #475569; padding: 6px 12px; border-radius: 6px; font-size: 13px; cursor: pointer; transition: all 0.2s;">
                      <span class="btn-icon" [innerHTML]="icons.plus | safeHtml" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></span> Add Size
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Grand Total Summary -->
            <div class="total-summary" *ngIf="colourBreakdowns.length > 0" style="margin-top: 24px;">
              <span class="label">Grand Total Outward Quantity:</span>
              <span class="value">{{ totalQuantity }}</span>
            </div>
          </div>
"""
html = re.sub(r"<!-- Existing: Dynamic Size Breakdown Section \(Size Based only\) -->[\s\S]*?<!-- ── NEW: Meter Based Entry Section", multi_colour_html + "\n\n          <!-- ── NEW: Meter Based Entry Section", html)

# Add Colour Picker Modal
colour_picker_html = """
  <!-- Colour Picker Modal -->
  <div class="modal-overlay" *ngIf="isColourPickerOpen">
    <div class="modal-content animate-in" style="max-width: 400px;">
      <div class="modal-header">
        <h3>Select Colour</h3>
        <button type="button" class="close-btn" (click)="isColourPickerOpen = false">
          <span [innerHTML]="icons.x | safeHtml"></span>
        </button>
      </div>
      <div class="modal-body" style="padding: 24px;">
        <div class="input-group">
          <label>Available Colours</label>
          <select class="form-control" #colourSelect style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
            <option value="" disabled selected>Select a colour...</option>
            <option *ngFor="let col of availableColours" [value]="col">{{ col }}</option>
          </select>
        </div>
      </div>
      <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px;">
        <button type="button" class="btn-cancel" (click)="isColourPickerOpen = false">Cancel</button>
        <button type="button" class="btn-submit" (click)="addColourRow(colourSelect.value)">Add</button>
      </div>
    </div>
  </div>
"""

html = html.replace('<!-- Multiselect Size Picker Modal -->', colour_picker_html + '\n  <!-- Multiselect Size Picker Modal -->')

with open('outward.component.html', 'w', encoding='utf-8') as f:
    f.write(html)
