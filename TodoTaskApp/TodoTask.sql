-- Create Table
CREATE TABLE TodoTasks (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500) NULL,
        Priority NVARCHAR(20) NOT NULL DEFAULT 'Normal',
        Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        DueDate DATETIME NOT NULL,
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedDate DATETIME NULL,
        CompletedDate DATETIME NULL
);
ALTER TABLE TodoTasks
ADD AssignedToUserId INT NULL;

-- Insert sample data
IF NOT EXISTS (SELECT * FROM TodoTasks)
BEGIN
    INSERT INTO TodoTasks (Title, Description, Priority, Status, DueDate, CreatedDate, UpdatedDate, CompletedDate)
VALUES 
('Social Media Plan', 'Plan Social Content, Promotion and Distribution', 'High', 'Pending', DATEADD(DAY, 1, GETDATE()), GETDATE(), NULL, NULL),
('Content Strategy', 'Need time to get insights and brainstorming on tooling', 'High', 'Hold', DATEADD(DAY, 15, GETDATE()), GETDATE(), NULL, NULL),
('Email A/B Test', 'Subject, Sender, Body etc.', 'Low', 'Completed', DATEADD(DAY, 10, GETDATE()), DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, -3, GETDATE()), DATEADD(DAY, -3, GETDATE())),
('Banner Ads', 'Sizing, image, landing page', 'Low', 'Completed', DATEADD(DAY, 5, GETDATE()), DATEADD(DAY, -10, GETDATE()), DATEADD(DAY, -8, GETDATE()), DATEADD(DAY, -8, GETDATE())),
('Website Redesign', 'Update homepage layout and improve user experience', 'High', 'Pending', DATEADD(DAY, 7, GETDATE()), GETDATE(), NULL, NULL),
('Database Backup', 'Setup automated daily backup system for production database', 'Normal', 'Hold', DATEADD(DAY, 3, GETDATE()), DATEADD(DAY, -1, GETDATE()), DATEADD(DAY, -1, GETDATE()), NULL);
END
GO

-- Stored Procedure: Get All Tasks
CREATE OR ALTER PROCEDURE sp_GetAllTasks
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        Id,
        Title,
        Description,
        Priority,
        Status,
        DueDate,
        CreatedDate,
        UpdatedDate,
        CompletedDate
    FROM TodoTasks
    ORDER BY CreatedDate DESC;
END
GO

-- Stored Procedure: Get Task by ID
CREATE OR ALTER PROCEDURE sp_GetTaskById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        Id,
        Title,
        Description,
        Priority,
        Status,
        DueDate,
        CreatedDate,
        UpdatedDate,
        CompletedDate
    FROM TodoTasks
    WHERE Id = @Id;
END
GO

-- Stored Procedure: Insert Task
CREATE OR ALTER PROCEDURE sp_InsertTask
    @Title NVARCHAR(100),
    @Description NVARCHAR(500) = NULL,
    @Priority NVARCHAR(20) = 'Normal',
    @Status NVARCHAR(20) = 'Pending',
    @DueDate DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO TodoTasks (Title, Description, Priority, Status, DueDate, CreatedDate)
    VALUES (@Title, @Description, @Priority, @Status, @DueDate, GETDATE());

    SELECT SCOPE_IDENTITY() AS Id;
END
GO

-- Stored Procedure: Update Task
CREATE OR ALTER PROCEDURE sp_UpdateTask
    @Id INT,
    @Title NVARCHAR(100),
    @Description NVARCHAR(500) = NULL,
    @Priority NVARCHAR(20),
    @Status NVARCHAR(20),
    @DueDate DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE TodoTasks 
    SET 
        Title = @Title,
        Description = @Description,
        Priority = @Priority,
        Status = @Status,
        DueDate = @DueDate,
        UpdatedDate = GETDATE(),
        CompletedDate = CASE WHEN @Status = 'Completed' AND CompletedDate IS NULL THEN GETDATE() ELSE CompletedDate END
    WHERE Id = @Id;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Stored Procedure: Delete Task
CREATE OR ALTER PROCEDURE sp_DeleteTask
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM TodoTasks WHERE Id = @Id;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Stored Procedure: Update Task Status
CREATE OR ALTER PROCEDURE sp_UpdateTaskStatus
    @Id INT,
    @Status NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE TodoTasks 
    SET 
        Status = @Status,
        UpdatedDate = GETDATE(),
        CompletedDate = CASE WHEN @Status = 'Completed' THEN GETDATE() ELSE NULL END
    WHERE Id = @Id;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Stored Procedure: Filter Tasks
CREATE OR ALTER PROCEDURE sp_FilterTasks
    @Status NVARCHAR(20) = NULL,
    @Priority NVARCHAR(20) = NULL,
    @SearchTerm NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        Id,
        Title,
        Description,
        Priority,
        Status,
        DueDate,
        CreatedDate,
        UpdatedDate,
        CompletedDate
    FROM TodoTasks
    WHERE 
        (@Status IS NULL OR Status = @Status)
        AND (@Priority IS NULL OR Priority = @Priority)
        AND (@SearchTerm IS NULL OR Title LIKE '%' + @SearchTerm + '%' OR Description LIKE '%' + @SearchTerm + '%')
    ORDER BY CreatedDate DESC;
END
GO