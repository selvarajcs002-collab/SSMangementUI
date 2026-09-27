-- Machine production edit and delete.
-- Assumes table dbo.MachineProduction with the columns used by the add-production screen:
-- Id, CompanyId, EmployeeName, MachineName, Shift, StyleName, DesignName,
-- TotalProduction, TargetProduction, CostPerPiece, ProductionCost, Status, ModifiedDate

CREATE OR ALTER PROCEDURE dbo.sp_UpdateMachineProduction
    @Id INT,
    @CompanyId INT = NULL,
    @EmployeeName NVARCHAR(200) = NULL,
    @MachineName NVARCHAR(200) = NULL,
    @Shift NVARCHAR(100) = NULL,
    @StyleName NVARCHAR(200) = NULL,
    @DesignName NVARCHAR(200) = NULL,
    @TotalProduction DECIMAL(18, 2) = NULL,
    @TargetProduction DECIMAL(18, 2) = NULL,
    @CostPerPiece DECIMAL(18, 2) = NULL,
    @ProductionCost DECIMAL(18, 2) = NULL,
    @Status NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Id IS NULL OR @Id = 0 OR NOT EXISTS (SELECT 1 FROM dbo.MachineProduction WHERE Id = @Id)
    BEGIN
        SELECT 0 AS Id, 'Production record not found.' AS Message, CAST(0 AS BIT) AS Status;
        RETURN;
    END

    UPDATE dbo.MachineProduction
    SET CompanyId = @CompanyId,
        EmployeeName = @EmployeeName,
        MachineName = @MachineName,
        Shift = @Shift,
        StyleName = @StyleName,
        DesignName = @DesignName,
        TotalProduction = @TotalProduction,
        TargetProduction = @TargetProduction,
        CostPerPiece = @CostPerPiece,
        ProductionCost = @ProductionCost,
        Status = @Status,
        ModifiedDate = GETDATE()
    WHERE Id = @Id;

    SELECT @Id AS Id, 'Production updated successfully.' AS Message, CAST(1 AS BIT) AS Status;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_DeleteMachineProduction
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    IF @Id IS NULL OR @Id = 0 OR NOT EXISTS (SELECT 1 FROM dbo.MachineProduction WHERE Id = @Id)
    BEGIN
        SELECT 0 AS Id, 'Production record not found.' AS Message, CAST(0 AS BIT) AS Status;
        RETURN;
    END

    DELETE FROM dbo.MachineProduction
    WHERE Id = @Id;

    SELECT @Id AS Id, 'Production deleted successfully.' AS Message, CAST(1 AS BIT) AS Status;
END
GO
