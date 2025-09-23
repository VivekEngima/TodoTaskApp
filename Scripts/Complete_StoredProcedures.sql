-- =====================================================
-- COMPLETE STORED PROCEDURES FOR TODOTASKAPP
-- =====================================================
-- This script contains ALL stored procedures required for the TodoTaskApp project
-- Run this entire script in SQL Server Management Studio
-- =====================================================

-- =====================================================
-- 1. USER MANAGEMENT STORED PROCEDURES
-- =====================================================

-- Create Users table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Username NVARCHAR(50) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Users table created successfully!';
END
ELSE
BEGIN
    PRINT 'Users table already exists.';
END
GO

-- Drop existing user procedures
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetUserByUsername')
    DROP PROCEDURE sp_GetUserByUsername;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_CreateUser')
    DROP PROCEDURE sp_CreateUser;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_CheckUsernameExists')
    DROP PROCEDURE sp_CheckUsernameExists;
GO

-- Get user by username
CREATE PROCEDURE sp_GetUserByUsername
    @Username NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Id, Username, PasswordHash, CreatedDate
    FROM Users
    WHERE Username = @Username;
END
GO

-- Create new user
CREATE PROCEDURE sp_CreateUser
    @Username NVARCHAR(50),
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Users (Username, PasswordHash, CreatedDate)
    VALUES (@Username, @PasswordHash, GETDATE());
    
    SELECT SCOPE_IDENTITY() AS Id;
END
GO

-- Check if username exists
CREATE PROCEDURE sp_CheckUsernameExists
    @Username NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT CASE WHEN EXISTS (SELECT 1 FROM Users WHERE Username = @Username) THEN 1 ELSE 0 END AS Exists;
END
GO

-- =====================================================
-- 2. TODO TASK MANAGEMENT STORED PROCEDURES
-- =====================================================

-- Create TodoTasks table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TodoTasks' AND xtype='U')
BEGIN
    CREATE TABLE TodoTasks (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500),
        Priority NVARCHAR(20) NOT NULL DEFAULT 'Normal',
        Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        DueDate DATETIME NOT NULL,
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedDate DATETIME,
        CompletedDate DATETIME,
        UserId INT NOT NULL,
        
        CONSTRAINT FK_TodoTasks_Users 
            FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
    );
    
    -- Create indexes
    CREATE INDEX IX_TodoTasks_UserId ON TodoTasks(UserId);
    CREATE INDEX IX_TodoTasks_Status ON TodoTasks(Status);
    CREATE INDEX IX_TodoTasks_Priority ON TodoTasks(Priority);
    CREATE INDEX IX_TodoTasks_DueDate ON TodoTasks(DueDate);
    
    PRINT 'TodoTasks table created successfully!';
END
ELSE
BEGIN
    PRINT 'TodoTasks table already exists.';
END
GO

-- Drop existing todo task procedures
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetAllTasks')
    DROP PROCEDURE sp_GetAllTasks;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetTaskById')
    DROP PROCEDURE sp_GetTaskById;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_CreateTask')
    DROP PROCEDURE sp_CreateTask;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_UpdateTask')
    DROP PROCEDURE sp_UpdateTask;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_DeleteTask')
    DROP PROCEDURE sp_DeleteTask;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_UpdateTaskStatus')
    DROP PROCEDURE sp_UpdateTaskStatus;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_CheckDuplicateTask')
    DROP PROCEDURE sp_CheckDuplicateTask;
GO

-- Get all tasks for a user
CREATE PROCEDURE sp_GetAllTasks
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.Id,
        t.Title,
        t.Description,
        t.Priority,
        t.Status,
        t.DueDate,
        t.CreatedDate,
        t.UpdatedDate,
        t.CompletedDate,
        t.UserId,
        u.Username AS CreatedByUsername,
        0 AS IsAssigned,
        0 AS AssignmentCount,
        0 AS IsSharedTask
    FROM TodoTasks t
    INNER JOIN Users u ON t.UserId = u.Id
    WHERE t.UserId = @UserId
    ORDER BY t.CreatedDate DESC;
END
GO

-- Get task by ID
CREATE PROCEDURE sp_GetTaskById
    @Id INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.Id,
        t.Title,
        t.Description,
        t.Priority,
        t.Status,
        t.DueDate,
        t.CreatedDate,
        t.UpdatedDate,
        t.CompletedDate,
        t.UserId
    FROM TodoTasks t
    WHERE t.Id = @Id AND t.UserId = @UserId;
END
GO

-- Create new task
CREATE PROCEDURE sp_CreateTask
    @Title NVARCHAR(100),
    @Description NVARCHAR(500),
    @Priority NVARCHAR(20),
    @Status NVARCHAR(20),
    @DueDate DATETIME,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO TodoTasks (Title, Description, Priority, Status, DueDate, CreatedDate, UserId)
    VALUES (@Title, @Description, @Priority, @Status, @DueDate, GETDATE(), @UserId);
    
    SELECT SCOPE_IDENTITY() AS Id;
END
GO

-- Update task
CREATE PROCEDURE sp_UpdateTask
    @Id INT,
    @Title NVARCHAR(100),
    @Description NVARCHAR(500),
    @Priority NVARCHAR(20),
    @Status NVARCHAR(20),
    @DueDate DATETIME,
    @UserId INT
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
        UpdatedDate = GETDATE()
    WHERE Id = @Id AND UserId = @UserId;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Delete task
CREATE PROCEDURE sp_DeleteTask
    @Id INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM TodoTasks
    WHERE Id = @Id AND UserId = @UserId;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Update task status
CREATE PROCEDURE sp_UpdateTaskStatus
    @Id INT,
    @Status NVARCHAR(20),
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE TodoTasks
    SET 
        Status = @Status,
        UpdatedDate = GETDATE(),
        CompletedDate = CASE WHEN @Status = 'Completed' THEN GETDATE() ELSE CompletedDate END
    WHERE Id = @Id AND UserId = @UserId;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Check for duplicate task
CREATE PROCEDURE sp_CheckDuplicateTask
    @Title NVARCHAR(100),
    @ExcludeId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM TodoTasks 
        WHERE Title = @Title 
        AND UserId = @UserId 
        AND (@ExcludeId IS NULL OR Id != @ExcludeId)
    ) THEN 1 ELSE 0 END AS IsDuplicate;
END
GO

-- =====================================================
-- 3. TASK ASSIGNMENT STORED PROCEDURES
-- =====================================================

-- Create TaskAssignments table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TaskAssignments' AND xtype='U')
BEGIN
    CREATE TABLE TaskAssignments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TaskId INT NOT NULL,
        AssignedUserId INT NOT NULL,
        AssignedByUserId INT NOT NULL,
        AssignedDate DATETIME NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT FK_TaskAssignments_TodoTasks 
            FOREIGN KEY (TaskId) REFERENCES TodoTasks(Id) ON DELETE CASCADE,
        CONSTRAINT FK_TaskAssignments_AssignedUser 
            FOREIGN KEY (AssignedUserId) REFERENCES Users(Id) ON DELETE CASCADE,
        CONSTRAINT FK_TaskAssignments_AssignedByUser 
            FOREIGN KEY (AssignedByUserId) REFERENCES Users(Id) ON DELETE CASCADE
    );
    
    -- Create indexes
    CREATE INDEX IX_TaskAssignments_TaskId ON TaskAssignments(TaskId);
    CREATE INDEX IX_TaskAssignments_AssignedUserId ON TaskAssignments(AssignedUserId);
    CREATE INDEX IX_TaskAssignments_AssignedByUserId ON TaskAssignments(AssignedByUserId);
    
    PRINT 'TaskAssignments table created successfully!';
END
ELSE
BEGIN
    PRINT 'TaskAssignments table already exists.';
END
GO

-- Drop existing task assignment procedures
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetAllUsers')
    DROP PROCEDURE sp_GetAllUsers;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetTaskAssignments')
    DROP PROCEDURE sp_GetTaskAssignments;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_AssignTaskToUser')
    DROP PROCEDURE sp_AssignTaskToUser;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_RemoveTaskAssignment')
    DROP PROCEDURE sp_RemoveTaskAssignment;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_CanUserAccessTask')
    DROP PROCEDURE sp_CanUserAccessTask;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetAssignedUserIds')
    DROP PROCEDURE sp_GetAssignedUserIds;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetAllAccessibleTasks')
    DROP PROCEDURE sp_GetAllAccessibleTasks;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetTasksAssignedToUser')
    DROP PROCEDURE sp_GetTasksAssignedToUser;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetTaskAssignmentDatesForUser')
    DROP PROCEDURE sp_GetTaskAssignmentDatesForUser;
GO

-- Get all users
CREATE PROCEDURE sp_GetAllUsers
    @ExcludeUserId INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Id, Username
    FROM Users
    WHERE Id != @ExcludeUserId
    ORDER BY Username;
END
GO

-- Get task assignments
CREATE PROCEDURE sp_GetTaskAssignments
    @TaskId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ta.Id,
        ta.TaskId,
        ta.AssignedUserId,
        u1.Username AS AssignedUserName,
        ta.AssignedByUserId,
        u2.Username AS AssignedByUserName,
        ta.AssignedDate
    FROM TaskAssignments ta
    INNER JOIN Users u1 ON ta.AssignedUserId = u1.Id
    INNER JOIN Users u2 ON ta.AssignedByUserId = u2.Id
    WHERE ta.TaskId = @TaskId
    ORDER BY ta.AssignedDate DESC;
END
GO

-- Assign task to user
CREATE PROCEDURE sp_AssignTaskToUser
    @TaskId INT,
    @AssignedUserId INT,
    @AssignedByUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if assignment already exists
    IF NOT EXISTS (SELECT 1 FROM TaskAssignments WHERE TaskId = @TaskId AND AssignedUserId = @AssignedUserId)
    BEGIN
        INSERT INTO TaskAssignments (TaskId, AssignedUserId, AssignedByUserId, AssignedDate)
        VALUES (@TaskId, @AssignedUserId, @AssignedByUserId, GETDATE());
    END
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Remove task assignment
CREATE PROCEDURE sp_RemoveTaskAssignment
    @TaskId INT,
    @AssignedUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM TaskAssignments
    WHERE TaskId = @TaskId AND AssignedUserId = @AssignedUserId;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Check if user can access task
CREATE PROCEDURE sp_CanUserAccessTask
    @TaskId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM TodoTasks WHERE Id = @TaskId AND UserId = @UserId
        UNION
        SELECT 1 FROM TaskAssignments WHERE TaskId = @TaskId AND AssignedUserId = @UserId
    ) THEN 1 ELSE 0 END AS CanAccess;
END
GO

-- Get assigned user IDs for a task
CREATE PROCEDURE sp_GetAssignedUserIds
    @TaskId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT AssignedUserId
    FROM TaskAssignments
    WHERE TaskId = @TaskId;
END
GO

-- Get all accessible tasks for a user (owned + assigned)
CREATE PROCEDURE sp_GetAllAccessibleTasks
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.Id,
        t.Title,
        t.Description,
        t.Priority,
        t.Status,
        t.DueDate,
        t.CreatedDate,
        t.UpdatedDate,
        t.CompletedDate,
        t.UserId,
        u.Username AS CreatedByUsername,
        CASE WHEN ta.TaskId IS NOT NULL THEN 1 ELSE 0 END AS IsAssigned,
        ISNULL(assignment_counts.AssignmentCount, 0) AS AssignmentCount,
        CASE WHEN t.UserId != @UserId THEN 1 ELSE 0 END AS IsSharedTask
    FROM TodoTasks t
    INNER JOIN Users u ON t.UserId = u.Id
    LEFT JOIN TaskAssignments ta ON t.Id = ta.TaskId AND ta.AssignedUserId = @UserId
    LEFT JOIN (
        SELECT 
            TaskId, 
            COUNT(*) AS AssignmentCount
        FROM TaskAssignments 
        GROUP BY TaskId
    ) assignment_counts ON t.Id = assignment_counts.TaskId
    WHERE t.UserId = @UserId OR EXISTS (
        SELECT 1 FROM TaskAssignments ta2 
        WHERE ta2.TaskId = t.Id AND ta2.AssignedUserId = @UserId
    )
    ORDER BY t.CreatedDate DESC;
END
GO

-- Get tasks assigned TO a specific user
CREATE PROCEDURE sp_GetTasksAssignedToUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.Id,
        t.Title,
        t.Description,
        t.Priority,
        t.Status,
        t.DueDate,
        t.CreatedDate,
        t.UpdatedDate,
        t.CompletedDate,
        t.UserId,
        u.Username AS CreatedByUsername,
        CASE 
            WHEN ta.TaskId IS NOT NULL THEN 1 
            ELSE 0 
        END AS IsAssigned,
        ISNULL(assignment_counts.AssignmentCount, 0) AS AssignmentCount
    FROM TodoTasks t
    INNER JOIN TaskAssignments ta ON t.Id = ta.TaskId
    INNER JOIN Users u ON t.UserId = u.Id
    LEFT JOIN (
        SELECT 
            TaskId, 
            COUNT(*) AS AssignmentCount
        FROM TaskAssignments 
        GROUP BY TaskId
    ) assignment_counts ON t.Id = assignment_counts.TaskId
    WHERE ta.AssignedUserId = @UserId
    ORDER BY t.CreatedDate DESC;
END
GO

-- Get task assignment dates for a user
CREATE PROCEDURE sp_GetTaskAssignmentDatesForUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT AssignedDate 
    FROM TaskAssignments 
    WHERE AssignedUserId = @UserId;
END
GO

-- =====================================================
-- 4. DOCUMENT MANAGEMENT STORED PROCEDURES
-- =====================================================

-- Create TodoTaskDocuments table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TodoTaskDocuments' AND xtype='U')
BEGIN
    CREATE TABLE TodoTaskDocuments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TaskId INT NOT NULL,
        DocumentName NVARCHAR(255) NOT NULL,
        DocumentData VARBINARY(MAX) NOT NULL,
        FileSize BIGINT NOT NULL,
        ContentType NVARCHAR(100) NOT NULL,
        UploadDate DATETIME NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT FK_TodoTaskDocuments_TodoTasks 
            FOREIGN KEY (TaskId) REFERENCES TodoTasks(Id) ON DELETE CASCADE
    );
    
    -- Create indexes for better performance
    CREATE INDEX IX_TodoTaskDocuments_TaskId ON TodoTaskDocuments(TaskId);
    CREATE INDEX IX_TodoTaskDocuments_UploadDate ON TodoTaskDocuments(UploadDate);
    
    PRINT 'TodoTaskDocuments table created successfully!';
END
ELSE
BEGIN
    PRINT 'TodoTaskDocuments table already exists.';
END
GO

-- Drop existing document procedures
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetDocumentsByTaskId')
    DROP PROCEDURE sp_GetDocumentsByTaskId;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetDocumentById')
    DROP PROCEDURE sp_GetDocumentById;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_InsertDocument')
    DROP PROCEDURE sp_InsertDocument;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_DeleteDocument')
    DROP PROCEDURE sp_DeleteDocument;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetDocumentCountByTask')
    DROP PROCEDURE sp_GetDocumentCountByTask;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_UpdateDocument')
    DROP PROCEDURE sp_UpdateDocument;
GO

-- Get documents by task ID
CREATE PROCEDURE sp_GetDocumentsByTaskId
    @TaskId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate TaskId
    IF @TaskId IS NULL OR @TaskId <= 0
    BEGIN
        RAISERROR('Invalid TaskId provided', 16, 1);
        RETURN;
    END
    
    -- Check if task exists
    IF NOT EXISTS (SELECT 1 FROM TodoTasks WHERE Id = @TaskId)
    BEGIN
        RAISERROR('Task with ID %d does not exist', 16, 1, @TaskId);
        RETURN;
    END
    
    SELECT 
        Id,
        TaskId,
        DocumentName,
        FileSize,
        ContentType,
        UploadDate
    FROM TodoTaskDocuments
    WHERE TaskId = @TaskId
    ORDER BY UploadDate DESC;
END
GO

-- Get document by ID
CREATE PROCEDURE sp_GetDocumentById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate Id
    IF @Id IS NULL OR @Id <= 0
    BEGIN
        RAISERROR('Invalid Document Id provided', 16, 1);
        RETURN;
    END
    
    SELECT 
        Id,
        TaskId,
        DocumentName,
        DocumentData,
        FileSize,
        ContentType,
        UploadDate
    FROM TodoTaskDocuments
    WHERE Id = @Id;
END
GO

-- Insert new document
CREATE PROCEDURE sp_InsertDocument
    @TaskId INT,
    @DocumentName NVARCHAR(255),
    @DocumentData VARBINARY(MAX),
    @FileSize BIGINT,
    @ContentType NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate inputs
    IF @TaskId IS NULL OR @TaskId <= 0
    BEGIN
        RAISERROR('Invalid TaskId provided', 16, 1);
        RETURN;
    END
    
    IF @DocumentName IS NULL OR LEN(TRIM(@DocumentName)) = 0
    BEGIN
        RAISERROR('Document name is required', 16, 1);
        RETURN;
    END
    
    IF @DocumentData IS NULL OR DATALENGTH(@DocumentData) = 0
    BEGIN
        RAISERROR('Document data is required', 16, 1);
        RETURN;
    END
    
    IF @FileSize IS NULL OR @FileSize <= 0
    BEGIN
        RAISERROR('Invalid file size', 16, 1);
        RETURN;
    END
    
    IF @ContentType IS NULL OR LEN(TRIM(@ContentType)) = 0
    BEGIN
        RAISERROR('Content type is required', 16, 1);
        RETURN;
    END
    
    -- Check if task exists
    IF NOT EXISTS (SELECT 1 FROM TodoTasks WHERE Id = @TaskId)
    BEGIN
        RAISERROR('Task with ID %d does not exist', 16, 1, @TaskId);
        RETURN;
    END
    
    -- Check document count limit (max 5 per task)
    DECLARE @DocumentCount INT;
    SELECT @DocumentCount = COUNT(*) FROM TodoTaskDocuments WHERE TaskId = @TaskId;
    
    IF @DocumentCount >= 5
    BEGIN
        RAISERROR('Maximum 5 documents allowed per task', 16, 1);
        RETURN;
    END
    
    -- Insert the document
    INSERT INTO TodoTaskDocuments (TaskId, DocumentName, DocumentData, FileSize, ContentType, UploadDate)
    VALUES (@TaskId, @DocumentName, @DocumentData, @FileSize, @ContentType, GETDATE());
    
    -- Return the new document ID
    SELECT SCOPE_IDENTITY() AS Id;
END
GO

-- Delete document
CREATE PROCEDURE sp_DeleteDocument
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate Id
    IF @Id IS NULL OR @Id <= 0
    BEGIN
        RAISERROR('Invalid Document Id provided', 16, 1);
        RETURN;
    END
    
    -- Check if document exists
    IF NOT EXISTS (SELECT 1 FROM TodoTaskDocuments WHERE Id = @Id)
    BEGIN
        RAISERROR('Document with ID %d does not exist', 16, 1, @Id);
        RETURN;
    END
    
    -- Delete the document
    DELETE FROM TodoTaskDocuments WHERE Id = @Id;
    
    -- Return number of rows affected
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Get document count by task
CREATE PROCEDURE sp_GetDocumentCountByTask
    @TaskId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate TaskId
    IF @TaskId IS NULL OR @TaskId <= 0
    BEGIN
        RAISERROR('Invalid TaskId provided', 16, 1);
        RETURN;
    END
    
    -- Check if task exists
    IF NOT EXISTS (SELECT 1 FROM TodoTasks WHERE Id = @TaskId)
    BEGIN
        RAISERROR('Task with ID %d does not exist', 16, 1, @TaskId);
        RETURN;
    END
    
    SELECT COUNT(*) AS DocumentCount
    FROM TodoTaskDocuments
    WHERE TaskId = @TaskId;
END
GO

-- Update document
CREATE PROCEDURE sp_UpdateDocument
    @Id INT,
    @DocumentName NVARCHAR(255),
    @DocumentData VARBINARY(MAX),
    @FileSize BIGINT,
    @ContentType NVARCHAR(100),
    @UploadDate DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate inputs
    IF @Id IS NULL OR @Id <= 0
    BEGIN
        RAISERROR('Invalid Document Id provided', 16, 1);
        RETURN;
    END
    
    IF @DocumentName IS NULL OR LEN(TRIM(@DocumentName)) = 0
    BEGIN
        RAISERROR('Document name is required', 16, 1);
        RETURN;
    END
    
    IF @DocumentData IS NULL OR DATALENGTH(@DocumentData) = 0
    BEGIN
        RAISERROR('Document data is required', 16, 1);
        RETURN;
    END
    
    IF @FileSize IS NULL OR @FileSize <= 0
    BEGIN
        RAISERROR('Invalid file size', 16, 1);
        RETURN;
    END
    
    IF @ContentType IS NULL OR LEN(TRIM(@ContentType)) = 0
    BEGIN
        RAISERROR('Content type is required', 16, 1);
        RETURN;
    END
    
    -- Check if document exists
    IF NOT EXISTS (SELECT 1 FROM TodoTaskDocuments WHERE Id = @Id)
    BEGIN
        RAISERROR('Document with ID %d does not exist', 16, 1, @Id);
        RETURN;
    END
    
    -- Update the document
    UPDATE TodoTaskDocuments
    SET 
        DocumentName = @DocumentName,
        DocumentData = @DocumentData,
        FileSize = @FileSize,
        ContentType = @ContentType,
        UploadDate = @UploadDate
    WHERE Id = @Id;
    
    -- Return number of rows affected
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- =====================================================
-- 5. DASHBOARD STATISTICS STORED PROCEDURES
-- =====================================================

-- Drop existing dashboard procedures
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetDashboardStatistics')
    DROP PROCEDURE sp_GetDashboardStatistics;
GO

-- Get dashboard statistics
CREATE PROCEDURE sp_GetDashboardStatistics
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get basic task counts
    SELECT 
        COUNT(*) AS TotalTasks,
        SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END) AS CompletedTasks,
        SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) AS PendingTasks,
        SUM(CASE WHEN Status = 'OnHold' THEN 1 ELSE 0 END) AS OnHoldTasks,
        SUM(CASE WHEN DueDate >= CAST(GETDATE() AS DATE) AND Status != 'Completed' THEN 1 ELSE 0 END) AS UpcomingTasks,
        SUM(CASE WHEN Priority = 'High' THEN 1 ELSE 0 END) AS HighPriorityTasks,
        SUM(CASE WHEN Priority = 'Normal' THEN 1 ELSE 0 END) AS NormalPriorityTasks,
        SUM(CASE WHEN Priority = 'Low' THEN 1 ELSE 0 END) AS LowPriorityTasks
    FROM TodoTasks
    WHERE UserId = @UserId;
END
GO

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

PRINT '=====================================================';
PRINT 'ALL STORED PROCEDURES CREATED SUCCESSFULLY!';
PRINT '=====================================================';
PRINT 'The following components have been created:';
PRINT '1. Users table and procedures';
PRINT '2. TodoTasks table and procedures';
PRINT '3. TaskAssignments table and procedures';
PRINT '4. TodoTaskDocuments table and procedures';
PRINT '5. Dashboard statistics procedures';
PRINT '=====================================================';
PRINT 'You can now run the TodoTaskApp application!';
PRINT '=====================================================';
