-- =============================================
-- TodoTask Stored Procedures
-- =============================================

-- Check if task title already exists for user
CREATE OR ALTER PROCEDURE sp_CheckDuplicateTask
    @Title NVARCHAR(255),
    @ExcludeId INT = NULL,
    @UserId INT
AS
BEGIN
    SELECT COUNT(1) 
    FROM TodoTasks 
    WHERE UserId = @UserId 
    AND Title = @Title 
    AND (@ExcludeId IS NULL OR Id != @ExcludeId)
END
GO

-- Filter tasks with various criteria
CREATE OR ALTER PROCEDURE sp_FilterTasks
    @UserId INT,
    @Priority NVARCHAR(50) = NULL,
    @Status NVARCHAR(50) = NULL,
    @SearchTerm NVARCHAR(255) = NULL
AS
BEGIN
    SELECT Id, Title, Description, Priority, Status, DueDate, CreatedDate, UpdatedDate, CompletedDate, UserId
    FROM TodoTasks 
    WHERE UserId = @UserId
    AND (@Priority IS NULL OR Priority = @Priority)
    AND (@Status IS NULL OR Status = @Status)
    AND (@SearchTerm IS NULL OR Title LIKE '%' + @SearchTerm + '%' OR Description LIKE '%' + @SearchTerm + '%')
    ORDER BY CreatedDate DESC
END
GO

-- Filter tasks by date range
CREATE OR ALTER PROCEDURE sp_FilterTasksByDateRange
    @UserId INT,
    @StartDate DATETIME = NULL,
    @EndDate DATETIME = NULL
AS
BEGIN
    SELECT Id, Title, Description, Priority, Status, DueDate, CreatedDate, UpdatedDate, CompletedDate, UserId
    FROM TodoTasks 
    WHERE UserId = @UserId
    AND (@StartDate IS NULL OR DueDate >= @StartDate)
    AND (@EndDate IS NULL OR DueDate <= @EndDate)
    ORDER BY DueDate ASC
END
GO

