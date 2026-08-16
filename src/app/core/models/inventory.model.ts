export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
  errors: string[];
}

export interface ThreadRequestDto {
  threadId?: number;
  brandName: string;
  threadSeries?: string;
  shadeName: string;
  shadeCode: string;
  colourFamily?: string;
  threadType: string;
  finishType?: string;
  coneSize: string;
  thickness?: string;
  supplierId?: number;
  barcode?: string;
  isActive: boolean;
  user?: string;
}

export interface NeedleRequestDto {
  needleId?: number;
  brandName: string;
  needleSystem: string;
  needleSize: string;
  pointType?: string;
  isActive: boolean;
  user?: string;
}

export interface FoamRequestDto {
  foamId?: number;
  foamType: string;
  thickness: string;
  colour?: string;
  density?: string;
  isActive: boolean;
  user?: string;
}

export interface InventoryEntryDto {
  inventoryId?: number;
  category: string;
  itemId: number;
  supplierId?: number;
  warehouseId?: number;
  sku: string;
  purchaseType: string;
  conesPerBox?: number;
  totalBoxes?: number;
  directConeCount?: number;
  minStockAlert: number;
  isActive: boolean;
  user?: string;
}

export interface MaterialIssueDto {
  workerId: number;
  machineId: number;
  inventoryId: number;
  issueQty: number;
  designNo: string;
  user?: string;
}

export interface MaterialReturnDto {
  issueId: number;
  returnQty: number;
  damagedQty: number;
  returnType: string;
  user?: string;
}

export interface StockAdjustmentDto {
  inventoryId: number;
  adjustmentType: string;
  quantity: number;
  reason: string;
  user?: string;
}

// Static Constants for Dropdowns
export const INVENTORY_CONSTANTS = {
  PurchaseTypes: ['CONE', 'BOX'],
  FoamTypes: ['EVA', 'Soft', 'Hard'],
  ThreadTypes: ['Viscose Rayon', 'Polyester', 'Metallic', 'Cotton'],
  ColourFamilies: ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Mixed'],
  AdjustmentTypes: ['Add', 'Deduct'],
  ReturnTypes: ['Normal', 'Waste']
};
