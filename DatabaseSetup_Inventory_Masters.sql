USE [SSManagement];
GO

/* =========================================================
   DROP PROCEDURES
========================================================= */

IF OBJECT_ID('sp_SaveStockAdjustment', 'P') IS NOT NULL
    DROP PROCEDURE sp_SaveStockAdjustment;
GO

IF OBJECT_ID('sp_SaveMaterialReturn', 'P') IS NOT NULL
    DROP PROCEDURE sp_SaveMaterialReturn;
GO

IF OBJECT_ID('sp_SaveMaterialIssue', 'P') IS NOT NULL
    DROP PROCEDURE sp_SaveMaterialIssue;
GO

IF OBJECT_ID('sp_ManageInventory', 'P') IS NOT NULL
    DROP PROCEDURE sp_ManageInventory;
GO

IF OBJECT_ID('sp_ManageFoam', 'P') IS NOT NULL
    DROP PROCEDURE sp_ManageFoam;
GO

IF OBJECT_ID('sp_ManageNeedle', 'P') IS NOT NULL
    DROP PROCEDURE sp_ManageNeedle;
GO

IF OBJECT_ID('sp_ManageThread', 'P') IS NOT NULL
    DROP PROCEDURE sp_ManageThread;
GO


/* =========================================================
   DROP TABLES IN FK ORDER
========================================================= */

IF OBJECT_ID('MaterialReturn', 'U') IS NOT NULL
    DROP TABLE MaterialReturn;
GO

IF OBJECT_ID('MaterialIssue', 'U') IS NOT NULL
    DROP TABLE MaterialIssue;
GO

IF OBJECT_ID('StockAdjustment', 'U') IS NOT NULL
    DROP TABLE StockAdjustment;
GO

IF OBJECT_ID('InventoryAuditHistory', 'U') IS NOT NULL
    DROP TABLE InventoryAuditHistory;
GO

IF OBJECT_ID('InventoryStockEntry', 'U') IS NOT NULL
    DROP TABLE InventoryStockEntry;
GO

IF OBJECT_ID('FoamMaster', 'U') IS NOT NULL
    DROP TABLE FoamMaster;
GO

IF OBJECT_ID('NeedleMaster', 'U') IS NOT NULL
    DROP TABLE NeedleMaster;
GO

IF OBJECT_ID('ThreadMaster', 'U') IS NOT NULL
    DROP TABLE ThreadMaster;
GO

IF OBJECT_ID('WarehouseMaster', 'U') IS NOT NULL
    DROP TABLE WarehouseMaster;
GO

IF OBJECT_ID('WorkerMaster', 'U') IS NOT NULL
    DROP TABLE WorkerMaster;
GO

IF OBJECT_ID('MachineMaster', 'U') IS NOT NULL
    DROP TABLE MachineMaster;
GO

IF OBJECT_ID('SupplierMaster', 'U') IS NOT NULL
    DROP TABLE SupplierMaster;
GO


/* =========================================================
   CREATE MASTER TABLES
========================================================= */

CREATE TABLE SupplierMaster
(
    SupplierId INT IDENTITY(1,1) PRIMARY KEY,
    SupplierName NVARCHAR(150) NOT NULL,
    ContactPerson NVARCHAR(100) NULL,
    MobileNo NVARCHAR(20) NULL,
    Email NVARCHAR(100) NULL,
    Address NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedDate DATETIME NULL
);
GO

CREATE TABLE MachineMaster
(
    MachineId INT IDENTITY(1,1) PRIMARY KEY,
    MachineNo NVARCHAR(50) NOT NULL UNIQUE,
    ModelName NVARCHAR(100) NULL,
    HeadCount INT NOT NULL DEFAULT 1,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedDate DATETIME NULL
);
GO

CREATE TABLE WorkerMaster
(
    WorkerId INT IDENTITY(1,1) PRIMARY KEY,
    WorkerName NVARCHAR(150) NOT NULL,
    Designation NVARCHAR(100) NULL,
    Shift NVARCHAR(50) NULL,
    MobileNo NVARCHAR(20) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedDate DATETIME NULL
);
GO

CREATE TABLE WarehouseMaster
(
    WarehouseId INT IDENTITY(1,1) PRIMARY KEY,
    WarehouseName NVARCHAR(150) NOT NULL UNIQUE,
    Location NVARCHAR(250) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedDate DATETIME NULL
);
GO


/* =========================================================
   THREAD MASTER
========================================================= */

CREATE TABLE ThreadMaster
(
    ThreadId INT IDENTITY(1,1) PRIMARY KEY,
    BrandName NVARCHAR(100) NOT NULL,
    ThreadSeries NVARCHAR(50) NULL,
    ShadeName NVARCHAR(100) NOT NULL,
    ShadeCode NVARCHAR(50) NOT NULL UNIQUE,
    ColourFamily NVARCHAR(50) NULL,
    ThreadType NVARCHAR(50) NOT NULL,
    FinishType NVARCHAR(50) NULL,
    ConeSize NVARCHAR(50) NULL,
    Thickness NVARCHAR(50) NULL,
    SupplierId INT NULL,
    Barcode NVARCHAR(100) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedDate DATETIME NULL,

    CONSTRAINT FK_Thread_Supplier
    FOREIGN KEY (SupplierId)
    REFERENCES SupplierMaster(SupplierId)
);
GO


/* =========================================================
   NEEDLE MASTER
========================================================= */

CREATE TABLE NeedleMaster
(
    NeedleId INT IDENTITY(1,1) PRIMARY KEY,
    BrandName NVARCHAR(100) NOT NULL,
    NeedleSystem NVARCHAR(100) NOT NULL,
    NeedleSize NVARCHAR(50) NOT NULL,
    PointType NVARCHAR(100) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedDate DATETIME NULL,

    CONSTRAINT UC_Needle UNIQUE (NeedleSystem, NeedleSize)
);
GO


/* =========================================================
   FOAM MASTER
========================================================= */

CREATE TABLE FoamMaster
(
    FoamId INT IDENTITY(1,1) PRIMARY KEY,
    FoamType NVARCHAR(100) NOT NULL,
    Thickness NVARCHAR(50) NOT NULL,
    Colour NVARCHAR(50) NULL,
    Density NVARCHAR(50) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedDate DATETIME NULL,

    CONSTRAINT UC_Foam UNIQUE (FoamType, Thickness, Colour)
);
GO


/* =========================================================
   INVENTORY STOCK ENTRY
========================================================= */

CREATE TABLE InventoryStockEntry
(
    InventoryId INT IDENTITY(1,1) PRIMARY KEY,

    Category NVARCHAR(50) NOT NULL,
    ItemId INT NOT NULL,

    SupplierId INT NULL,
    WarehouseId INT NULL,

    SKU NVARCHAR(100) NOT NULL UNIQUE,

    PurchaseType NVARCHAR(50) NOT NULL,

    ConesPerBox INT NULL,
    TotalBoxes INT NULL,
    DirectConeCount INT NULL,

    TotalPurchasedCones INT NOT NULL,
    IssuedCones INT NOT NULL DEFAULT 0,
    UsedCones INT NOT NULL DEFAULT 0,
    RemainingCones INT NOT NULL,

    MinStockAlert INT NOT NULL DEFAULT 5,

    IsActive BIT NOT NULL DEFAULT 1,

    CreatedBy NVARCHAR(100) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedDate DATETIME NULL,

    CONSTRAINT FK_Inventory_Supplier
    FOREIGN KEY (SupplierId)
    REFERENCES SupplierMaster(SupplierId),

    CONSTRAINT FK_Inventory_Warehouse
    FOREIGN KEY (WarehouseId)
    REFERENCES WarehouseMaster(WarehouseId),

    CONSTRAINT CK_RemainingCones
    CHECK (RemainingCones >= 0),

    CONSTRAINT CK_TotalPurchasedCones
    CHECK (TotalPurchasedCones >= 0)
);
GO


/* =========================================================
   MATERIAL ISSUE
========================================================= */

CREATE TABLE MaterialIssue
(
    IssueId INT IDENTITY(1,1) PRIMARY KEY,

    IssueDate DATETIME NOT NULL DEFAULT GETDATE(),

    WorkerId INT NOT NULL,
    MachineId INT NOT NULL,
    InventoryId INT NOT NULL,

    IssueQty INT NOT NULL,

    DesignNo NVARCHAR(100) NOT NULL,

    Status NVARCHAR(50) NOT NULL DEFAULT 'Issued',

    CreatedBy NVARCHAR(100) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedDate DATETIME NULL,

    CONSTRAINT FK_Issue_Worker
    FOREIGN KEY (WorkerId)
    REFERENCES WorkerMaster(WorkerId),

    CONSTRAINT FK_Issue_Machine
    FOREIGN KEY (MachineId)
    REFERENCES MachineMaster(MachineId),

    CONSTRAINT FK_Issue_Inventory
    FOREIGN KEY (InventoryId)
    REFERENCES InventoryStockEntry(InventoryId)
);
GO


/* =========================================================
   MATERIAL RETURN
========================================================= */

CREATE TABLE MaterialReturn
(
    ReturnId INT IDENTITY(1,1) PRIMARY KEY,

    ReturnDate DATETIME NOT NULL DEFAULT GETDATE(),

    IssueId INT NOT NULL,

    ReturnQty INT NOT NULL,
    DamagedQty INT NOT NULL DEFAULT 0,

    ReturnType NVARCHAR(50) NOT NULL DEFAULT 'Normal',

    CreatedBy NVARCHAR(100) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedDate DATETIME NULL,

    CONSTRAINT FK_Return_Issue
    FOREIGN KEY (IssueId)
    REFERENCES MaterialIssue(IssueId)
);
GO


/* =========================================================
   STOCK ADJUSTMENT
========================================================= */

CREATE TABLE StockAdjustment
(
    AdjustmentId INT IDENTITY(1,1) PRIMARY KEY,

    AdjustmentDate DATETIME NOT NULL DEFAULT GETDATE(),

    InventoryId INT NOT NULL,

    AdjustmentType NVARCHAR(50) NOT NULL,
    Quantity INT NOT NULL,

    Reason NVARCHAR(500) NOT NULL,

    CreatedBy NVARCHAR(100) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedDate DATETIME NULL,

    CONSTRAINT FK_Adjustment_Inventory
    FOREIGN KEY (InventoryId)
    REFERENCES InventoryStockEntry(InventoryId)
);
GO


/* =========================================================
   AUDIT HISTORY
========================================================= */

CREATE TABLE InventoryAuditHistory
(
    AuditId INT IDENTITY(1,1) PRIMARY KEY,

    AuditDate DATETIME NOT NULL DEFAULT GETDATE(),

    InventoryId INT NOT NULL,

    ActionType NVARCHAR(50) NOT NULL,

    OldQty INT NULL,
    NewQty INT NULL,

    Description NVARCHAR(1000) NULL,

    [User] NVARCHAR(100) NULL
);
GO


/* =========================================================
   INDEXES
========================================================= */

CREATE INDEX IX_Inventory_Category_Item
ON InventoryStockEntry(Category, ItemId);
GO

CREATE INDEX IX_MaterialIssue_InventoryId
ON MaterialIssue(InventoryId);
GO

CREATE INDEX IX_MaterialReturn_IssueId
ON MaterialReturn(IssueId);
GO


/* =========================================================
   INVENTORY STORED PROCEDURE
========================================================= */

CREATE PROCEDURE sp_ManageInventory
(
    @Mode VARCHAR(10),
    @InventoryId INT = NULL,

    @Category NVARCHAR(50) = NULL,
    @ItemId INT = NULL,

    @SupplierId INT = NULL,
    @WarehouseId INT = NULL,

    @SKU NVARCHAR(100) = NULL,

    @PurchaseType NVARCHAR(50) = NULL,

    @ConesPerBox INT = NULL,
    @TotalBoxes INT = NULL,
    @DirectConeCount INT = NULL,

    @MinStockAlert INT = 5,

    @IsActive BIT = 1,

    @User NVARCHAR(100) = NULL
)
AS
BEGIN

    SET NOCOUNT ON;

    BEGIN TRANSACTION;

    BEGIN TRY

        DECLARE @TotalCones INT = 0;

        IF @PurchaseType = 'BOX'
        BEGIN
            SET @TotalCones = ISNULL(@TotalBoxes,0) * ISNULL(@ConesPerBox,0);
        END
        ELSE
        BEGIN
            SET @TotalCones = ISNULL(@DirectConeCount,0);
        END

        IF @TotalCones <= 0
        BEGIN

            ROLLBACK TRANSACTION;

            SELECT
                0 AS Id,
                'Total cones must be greater than zero.' AS Message,
                CAST(0 AS BIT) AS Status;

            RETURN;

        END


        IF @Mode = 'INSERT'
        BEGIN

            IF EXISTS
            (
                SELECT 1
                FROM InventoryStockEntry
                WHERE SKU = @SKU
                AND IsActive = 1
            )
            BEGIN

                ROLLBACK TRANSACTION;

                SELECT
                    0 AS Id,
                    'SKU already exists.' AS Message,
                    CAST(0 AS BIT) AS Status;

                RETURN;

            END

            INSERT INTO InventoryStockEntry
            (
                Category,
                ItemId,
                SupplierId,
                WarehouseId,
                SKU,
                PurchaseType,
                ConesPerBox,
                TotalBoxes,
                DirectConeCount,
                TotalPurchasedCones,
                IssuedCones,
                UsedCones,
                RemainingCones,
                MinStockAlert,
                IsActive,
                CreatedBy,
                CreatedDate
            )
            VALUES
            (
                @Category,
                @ItemId,
                @SupplierId,
                @WarehouseId,
                @SKU,
                @PurchaseType,
                @ConesPerBox,
                @TotalBoxes,
                @DirectConeCount,
                @TotalCones,
                0,
                0,
                @TotalCones,
                @MinStockAlert,
                @IsActive,
                @User,
                GETDATE()
            );

            DECLARE @NewInventoryId INT;

            SET @NewInventoryId = SCOPE_IDENTITY();

            INSERT INTO InventoryAuditHistory
            (
                InventoryId,
                ActionType,
                OldQty,
                NewQty,
                Description,
                [User]
            )
            VALUES
            (
                @NewInventoryId,
                'Purchase',
                0,
                @TotalCones,
                'Initial stock entry created',
                @User
            );

            COMMIT TRANSACTION;

            SELECT
                @NewInventoryId AS Id,
                'Inventory saved successfully.' AS Message,
                CAST(1 AS BIT) AS Status;

        END


        ELSE IF @Mode = 'UPDATE'
        BEGIN

            DECLARE @IssuedUsedTotal INT;

            SELECT
                @IssuedUsedTotal = IssuedCones + UsedCones
            FROM InventoryStockEntry
            WHERE InventoryId = @InventoryId;

            IF @TotalCones < @IssuedUsedTotal
            BEGIN

                ROLLBACK TRANSACTION;

                SELECT
                    0 AS Id,
                    'Cannot reduce stock below issued/used quantity.' AS Message,
                    CAST(0 AS BIT) AS Status;

                RETURN;

            END

            DECLARE @OldQty INT;

            SELECT
                @OldQty = RemainingCones
            FROM InventoryStockEntry
            WHERE InventoryId = @InventoryId;

            UPDATE InventoryStockEntry
            SET
                Category = @Category,
                ItemId = @ItemId,
                SupplierId = @SupplierId,
                WarehouseId = @WarehouseId,
                SKU = @SKU,
                PurchaseType = @PurchaseType,
                ConesPerBox = @ConesPerBox,
                TotalBoxes = @TotalBoxes,
                DirectConeCount = @DirectConeCount,
                TotalPurchasedCones = @TotalCones,
                RemainingCones = @TotalCones - IssuedCones - UsedCones,
                MinStockAlert = @MinStockAlert,
                ModifiedBy = @User,
                ModifiedDate = GETDATE()
            WHERE InventoryId = @InventoryId;

            INSERT INTO InventoryAuditHistory
            (
                InventoryId,
                ActionType,
                OldQty,
                NewQty,
                Description,
                [User]
            )
            VALUES
            (
                @InventoryId,
                'Edit',
                @OldQty,
                @TotalCones,
                'Inventory updated',
                @User
            );

            COMMIT TRANSACTION;

            SELECT
                @InventoryId AS Id,
                'Inventory updated successfully.' AS Message,
                CAST(1 AS BIT) AS Status;

        END


        ELSE IF @Mode = 'DELETE'
        BEGIN

            IF EXISTS
            (
                SELECT 1
                FROM MaterialIssue
                WHERE InventoryId = @InventoryId
                AND Status = 'Issued'
            )
            BEGIN

                ROLLBACK TRANSACTION;

                SELECT
                    0 AS Id,
                    'Cannot delete inventory because materials are issued.' AS Message,
                    CAST(0 AS BIT) AS Status;

                RETURN;

            END

            UPDATE InventoryStockEntry
            SET
                IsActive = 0,
                ModifiedBy = @User,
                ModifiedDate = GETDATE()
            WHERE InventoryId = @InventoryId;

            INSERT INTO InventoryAuditHistory
            (
                InventoryId,
                ActionType,
                Description,
                [User]
            )
            VALUES
            (
                @InventoryId,
                'Delete',
                'Inventory deleted',
                @User
            );

            COMMIT TRANSACTION;

            SELECT
                @InventoryId AS Id,
                'Inventory deleted successfully.' AS Message,
                CAST(1 AS BIT) AS Status;

        END

    END TRY

    BEGIN CATCH

        ROLLBACK TRANSACTION;

        SELECT
            0 AS Id,
            ERROR_MESSAGE() AS Message,
            CAST(0 AS BIT) AS Status;

    END CATCH

END
GO


/* =========================================================
   ADDITIONAL MASTER & TRANSACTION STORED PROCEDURES
========================================================= */

-- A. Thread Master Stored Procedure
CREATE PROCEDURE sp_ManageThread
    @Mode VARCHAR(10),
    @ThreadId INT = NULL,
    @BrandName NVARCHAR(100) = NULL,
    @ThreadSeries NVARCHAR(50) = NULL,
    @ShadeName NVARCHAR(100) = NULL,
    @ShadeCode NVARCHAR(50) = NULL,
    @ColourFamily NVARCHAR(50) = NULL,
    @ThreadType NVARCHAR(50) = NULL,
    @FinishType NVARCHAR(50) = NULL,
    @ConeSize NVARCHAR(50) = NULL,
    @Thickness NVARCHAR(50) = NULL,
    @SupplierId INT = NULL,
    @Barcode NVARCHAR(100) = NULL,
    @IsActive BIT = 1,
    @User NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Mode = 'INSERT'
    BEGIN
        IF EXISTS (SELECT 1 FROM ThreadMaster WHERE ShadeCode = @ShadeCode AND IsActive = 1)
        BEGIN
            SELECT 0 AS Id, 'Shade code already exists.' AS Message, CAST(0 AS BIT) AS Status;
            RETURN;
        END

        INSERT INTO ThreadMaster (BrandName, ThreadSeries, ShadeName, ShadeCode, ColourFamily, ThreadType, FinishType, ConeSize, Thickness, SupplierId, Barcode, IsActive, CreatedBy, CreatedDate)
        VALUES (@BrandName, @ThreadSeries, @ShadeName, @ShadeCode, @ColourFamily, @ThreadType, @FinishType, @ConeSize, @Thickness, @SupplierId, @Barcode, @IsActive, @User, GETDATE());

        SELECT SCOPE_IDENTITY() AS Id, 'Thread saved successfully.' AS Message, CAST(1 AS BIT) AS Status;
    END
    ELSE IF @Mode = 'UPDATE'
    BEGIN
        IF EXISTS (SELECT 1 FROM ThreadMaster WHERE ShadeCode = @ShadeCode AND ThreadId <> @ThreadId AND IsActive = 1)
        BEGIN
            SELECT 0 AS Id, 'Shade code already exists.' AS Message, CAST(0 AS BIT) AS Status;
            RETURN;
        END

        UPDATE ThreadMaster
        SET BrandName = @BrandName, ThreadSeries = @ThreadSeries, ShadeName = @ShadeName, ShadeCode = @ShadeCode,
            ColourFamily = @ColourFamily, ThreadType = @ThreadType, FinishType = @FinishType, ConeSize = @ConeSize,
            Thickness = @Thickness, SupplierId = @SupplierId, Barcode = @Barcode, IsActive = @IsActive,
            ModifiedBy = @User, ModifiedDate = GETDATE()
        WHERE ThreadId = @ThreadId;

        SELECT @ThreadId AS Id, 'Thread updated successfully.' AS Message, CAST(1 AS BIT) AS Status;
    END
    ELSE IF @Mode = 'DELETE'
    BEGIN
        IF EXISTS (SELECT 1 FROM InventoryStockEntry WHERE Category = 'Thread' AND ItemId = @ThreadId AND IsActive = 1)
        BEGIN
            SELECT 0 AS Id, 'Cannot delete thread as it has inventory history.' AS Message, CAST(0 AS BIT) AS Status;
            RETURN;
        END

        UPDATE ThreadMaster SET IsActive = 0, ModifiedBy = @User, ModifiedDate = GETDATE() WHERE ThreadId = @ThreadId;
        SELECT @ThreadId AS Id, 'Thread deleted successfully.' AS Message, CAST(1 AS BIT) AS Status;
    END
END
GO


-- B. Needle Master Stored Procedure
CREATE PROCEDURE sp_ManageNeedle
    @Mode VARCHAR(10),
    @NeedleId INT = NULL,
    @BrandName NVARCHAR(100) = NULL,
    @NeedleSystem NVARCHAR(100) = NULL,
    @NeedleSize NVARCHAR(50) = NULL,
    @PointType NVARCHAR(100) = NULL,
    @IsActive BIT = 1,
    @User NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Mode = 'INSERT'
    BEGIN
        IF EXISTS (SELECT 1 FROM NeedleMaster WHERE NeedleSystem = @NeedleSystem AND NeedleSize = @NeedleSize AND IsActive = 1)
        BEGIN
            SELECT 0 AS Id, 'Duplicate needle size and system exists.' AS Message, CAST(0 AS BIT) AS Status;
            RETURN;
        END

        INSERT INTO NeedleMaster (BrandName, NeedleSystem, NeedleSize, PointType, IsActive, CreatedBy, CreatedDate)
        VALUES (@BrandName, @NeedleSystem, @NeedleSize, @PointType, @IsActive, @User, GETDATE());

        SELECT SCOPE_IDENTITY() AS Id, 'Needle saved successfully.' AS Message, CAST(1 AS BIT) AS Status;
    END
    ELSE IF @Mode = 'UPDATE'
    BEGIN
        IF EXISTS (SELECT 1 FROM NeedleMaster WHERE NeedleSystem = @NeedleSystem AND NeedleSize = @NeedleSize AND NeedleId <> @NeedleId AND IsActive = 1)
        BEGIN
            SELECT 0 AS Id, 'Duplicate needle size and system exists.' AS Message, CAST(0 AS BIT) AS Status;
            RETURN;
        END

        UPDATE NeedleMaster
        SET BrandName = @BrandName, NeedleSystem = @NeedleSystem, NeedleSize = @NeedleSize, PointType = @PointType,
            IsActive = @IsActive, ModifiedBy = @User, ModifiedDate = GETDATE()
        WHERE NeedleId = @NeedleId;

        SELECT @NeedleId AS Id, 'Needle updated successfully.' AS Message, CAST(1 AS BIT) AS Status;
    END
    ELSE IF @Mode = 'DELETE'
    BEGIN
        IF EXISTS (SELECT 1 FROM InventoryStockEntry WHERE Category = 'Needle' AND ItemId = @NeedleId AND IsActive = 1)
        BEGIN
            SELECT 0 AS Id, 'Cannot delete needle as it has inventory history.' AS Message, CAST(0 AS BIT) AS Status;
            RETURN;
        END

        UPDATE NeedleMaster SET IsActive = 0, ModifiedBy = @User, ModifiedDate = GETDATE() WHERE NeedleId = @NeedleId;
        SELECT @NeedleId AS Id, 'Needle deleted successfully.' AS Message, CAST(1 AS BIT) AS Status;
    END
END
GO


-- C. Foam Master Stored Procedure
CREATE PROCEDURE sp_ManageFoam
    @Mode VARCHAR(10),
    @FoamId INT = NULL,
    @FoamType NVARCHAR(100) = NULL,
    @Thickness NVARCHAR(50) = NULL,
    @Colour NVARCHAR(50) = NULL,
    @Density NVARCHAR(50) = NULL,
    @IsActive BIT = 1,
    @User NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Mode = 'INSERT'
    BEGIN
        IF EXISTS (SELECT 1 FROM FoamMaster WHERE FoamType = @FoamType AND Thickness = @Thickness AND ISNULL(Colour, '') = ISNULL(@Colour, '') AND IsActive = 1)
        BEGIN
            SELECT 0 AS Id, 'Duplicate foam configuration exists.' AS Message, CAST(0 AS BIT) AS Status;
            RETURN;
        END

        INSERT INTO FoamMaster (FoamType, Thickness, Colour, Density, IsActive, CreatedBy, CreatedDate)
        VALUES (@FoamType, @Thickness, @Colour, @Density, @IsActive, @User, GETDATE());

        SELECT SCOPE_IDENTITY() AS Id, 'Foam saved successfully.' AS Message, CAST(1 AS BIT) AS Status;
    END
    ELSE IF @Mode = 'UPDATE'
    BEGIN
        IF EXISTS (SELECT 1 FROM FoamMaster WHERE FoamType = @FoamType AND Thickness = @Thickness AND ISNULL(Colour, '') = ISNULL(@Colour, '') AND FoamId <> @FoamId AND IsActive = 1)
        BEGIN
            SELECT 0 AS Id, 'Duplicate foam configuration exists.' AS Message, CAST(0 AS BIT) AS Status;
            RETURN;
        END

        UPDATE FoamMaster
        SET FoamType = @FoamType, Thickness = @Thickness, Colour = @Colour, Density = @Density, IsActive = @IsActive,
            ModifiedBy = @User, ModifiedDate = GETDATE()
        WHERE FoamId = @FoamId;

        SELECT @FoamId AS Id, 'Foam updated successfully.' AS Message, CAST(1 AS BIT) AS Status;
    END
    ELSE IF @Mode = 'DELETE'
    BEGIN
        IF EXISTS (SELECT 1 FROM InventoryStockEntry WHERE Category = 'Foam' AND ItemId = @FoamId AND IsActive = 1)
        BEGIN
            SELECT 0 AS Id, 'Cannot delete foam as it has inventory history.' AS Message, CAST(0 AS BIT) AS Status;
            RETURN;
        END

        UPDATE FoamMaster SET IsActive = 0, ModifiedBy = @User, ModifiedDate = GETDATE() WHERE FoamId = @FoamId;
        SELECT @FoamId AS Id, 'Foam deleted successfully.' AS Message, CAST(1 AS BIT) AS Status;
    END
END
GO


-- D. Material Issue Stored Procedure
CREATE PROCEDURE sp_SaveMaterialIssue
    @WorkerId INT,
    @MachineId INT,
    @InventoryId INT,
    @IssueQty INT,
    @DesignNo NVARCHAR(100),
    @User NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @RemainingCones INT;
        SELECT @RemainingCones = RemainingCones FROM InventoryStockEntry WHERE InventoryId = @InventoryId AND IsActive = 1;

        IF @RemainingCones IS NULL
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS Id, 'Inventory stock item not found.' AS Message, CAST(0 AS BIT) AS Status;
            RETURN;
        END

        IF @IssueQty > @RemainingCones
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS Id, 'Issue quantity exceeds available stock.' AS Message, CAST(0 AS BIT) AS Status;
            RETURN;
        END

        INSERT INTO MaterialIssue (WorkerId, MachineId, InventoryId, IssueQty, DesignNo, Status, CreatedBy, CreatedDate)
        VALUES (@WorkerId, @MachineId, @InventoryId, @IssueQty, @DesignNo, 'Issued', @User, GETDATE());

        DECLARE @IssueId INT = SCOPE_IDENTITY();

        UPDATE InventoryStockEntry
        SET IssuedCones = IssuedCones + @IssueQty,
            RemainingCones = RemainingCones - @IssueQty
        WHERE InventoryId = @InventoryId;

        INSERT INTO InventoryAuditHistory (InventoryId, ActionType, OldQty, NewQty, Description, [User])
        VALUES (@InventoryId, 'Issue', @RemainingCones, @RemainingCones - @IssueQty, 
                CONCAT('Issued ', @IssueQty, ' cones to Worker ID: ', @WorkerId, ' for Machine ID: ', @MachineId, ' (Design: ', @DesignNo, ')'), @User);

        COMMIT TRANSACTION;
        SELECT @IssueId AS Id, 'Material issued successfully.' AS Message, CAST(1 AS BIT) AS Status;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS Id, ERROR_MESSAGE() AS Message, CAST(0 AS BIT) AS Status;
    END CATCH
END
GO


-- E. Material Return Stored Procedure
CREATE PROCEDURE sp_SaveMaterialReturn
    @IssueId INT,
    @ReturnQty INT,
    @DamagedQty INT,
    @ReturnType NVARCHAR(50), -- Normal, Waste
    @User NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @IssueQty INT, @InventoryId INT, @CurrentStatus NVARCHAR(50);
        SELECT @IssueQty = IssueQty, @InventoryId = InventoryId, @CurrentStatus = Status 
        FROM MaterialIssue WHERE IssueId = @IssueId;

        IF @IssueQty IS NULL
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS Id, 'Material issue reference not found.' AS Message, CAST(0 AS BIT) AS Status;
            RETURN;
        END

        DECLARE @TotalReturnedSoFar INT = 0;
        SELECT @TotalReturnedSoFar = ISNULL(SUM(ReturnQty), 0) FROM MaterialReturn WHERE IssueId = @IssueId;

        IF (@TotalReturnedSoFar + @ReturnQty) > @IssueQty
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS Id, 'Return quantity cannot exceed issued quantity.' AS Message, CAST(0 AS BIT) AS Status;
            RETURN;
        END

        IF @DamagedQty > @ReturnQty
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS Id, 'Damaged quantity cannot exceed return quantity.' AS Message, CAST(0 AS BIT) AS Status;
            RETURN;
        END

        INSERT INTO MaterialReturn (IssueId, ReturnQty, DamagedQty, ReturnType, CreatedBy, CreatedDate)
        VALUES (@IssueId, @ReturnQty, @DamagedQty, @ReturnType, @User, GETDATE());

        DECLARE @ReturnId INT = SCOPE_IDENTITY();

        DECLARE @NetConesReturned INT = @ReturnQty - @DamagedQty;

        UPDATE InventoryStockEntry
        SET IssuedCones = IssuedCones - @ReturnQty,
            UsedCones = UsedCones + @DamagedQty,
            RemainingCones = RemainingCones + @NetConesReturned
        WHERE InventoryId = @InventoryId;

        DECLARE @NewStatus NVARCHAR(50) = 'Issued';
        IF (@TotalReturnedSoFar + @ReturnQty) = @IssueQty
            SET @NewStatus = 'Fully Returned';
        ELSE
            SET @NewStatus = 'Partially Returned';

        UPDATE MaterialIssue SET Status = @NewStatus, ModifiedBy = @User, ModifiedDate = GETDATE() WHERE IssueId = @IssueId;

        DECLARE @CurrentRemaining INT;
        SELECT @CurrentRemaining = RemainingCones FROM InventoryStockEntry WHERE InventoryId = @InventoryId;

        INSERT INTO InventoryAuditHistory (InventoryId, ActionType, OldQty, NewQty, Description, [User])
        VALUES (@InventoryId, 'Return', @CurrentRemaining - @NetConesReturned, @CurrentRemaining,
                CONCAT('Returned ', @ReturnQty, ' cones (Damaged/Wasted: ', @DamagedQty, ') from Issue ID: ', @IssueId), @User);

        COMMIT TRANSACTION;
        SELECT @ReturnId AS Id, 'Material returned successfully.' AS Message, CAST(1 AS BIT) AS Status;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS Id, ERROR_MESSAGE() AS Message, CAST(0 AS BIT) AS Status;
    END CATCH
END
GO


-- F. Stock Adjustment Stored Procedure
CREATE PROCEDURE sp_SaveStockAdjustment
    @InventoryId INT,
    @AdjustmentType NVARCHAR(50), -- Add, Deduct
    @Quantity INT,
    @Reason NVARCHAR(500),
    @User NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @CurrentRemaining INT;
        SELECT @CurrentRemaining = RemainingCones FROM InventoryStockEntry WHERE InventoryId = @InventoryId AND IsActive = 1;

        IF @CurrentRemaining IS NULL
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS Id, 'Inventory item not found.' AS Message, CAST(0 AS BIT) AS Status;
            RETURN;
        END

        IF @AdjustmentType = 'Deduct' AND @Quantity > @CurrentRemaining
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS Id, 'Invalid stock quantity. Deduction quantity exceeds available stock.' AS Message, CAST(0 AS BIT) AS Status;
            RETURN;
        END

        INSERT INTO StockAdjustment (InventoryId, AdjustmentType, Quantity, Reason, CreatedBy, CreatedDate)
        VALUES (@InventoryId, @AdjustmentType, @Quantity, @Reason, @User, GETDATE());

        DECLARE @AdjId INT = SCOPE_IDENTITY();

        DECLARE @NewRemaining INT = @CurrentRemaining;
        IF @AdjustmentType = 'Add'
        BEGIN
            UPDATE InventoryStockEntry 
            SET TotalPurchasedCones = TotalPurchasedCones + @Quantity,
                RemainingCones = RemainingCones + @Quantity 
            WHERE InventoryId = @InventoryId;
            SET @NewRemaining = @CurrentRemaining + @Quantity;
        END
        ELSE
        BEGIN
            UPDATE InventoryStockEntry 
            SET TotalPurchasedCones = TotalPurchasedCones - @Quantity,
                RemainingCones = RemainingCones - @Quantity 
            WHERE InventoryId = @InventoryId;
            SET @NewRemaining = @CurrentRemaining - @Quantity;
        END

        INSERT INTO InventoryAuditHistory (InventoryId, ActionType, OldQty, NewQty, Description, [User])
        VALUES (@InventoryId, 'Adjustment', @CurrentRemaining, @NewRemaining, 
                CONCAT('Manual Stock Adjustment (Type: ', @AdjustmentType, ', Qty: ', @Quantity, ') - Reason: ', @Reason), @User);

        COMMIT TRANSACTION;
        SELECT @AdjId AS Id, 'Stock adjusted successfully.' AS Message, CAST(1 AS BIT) AS Status;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS Id, ERROR_MESSAGE() AS Message, CAST(0 AS BIT) AS Status;
    END CATCH
END
GO