-- =============================================
-- All Stored Procedures for TodoTaskApp
-- =============================================

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

-- =============================================
-- TaskAssignment Stored Procedures
-- =============================================

-- Check if task is assigned to multiple users
CREATE OR ALTER PROCEDURE sp_IsTaskAssignedToMultipleUsers
    @TaskId INT
AS
BEGIN
    SELECT COUNT(*) FROM TaskAssignments WHERE TaskId = @TaskId
END
GO

-- Get assigned user IDs for a task
CREATE OR ALTER PROCEDURE sp_GetAssignedUserIds
    @TaskId INT
AS
BEGIN
    SELECT AssignedUserId FROM TaskAssignments WHERE TaskId = @TaskId
END
GO

-- Get tasks assigned TO a specific user (not created by them)
CREATE OR ALTER PROCEDURE sp_GetTasksAssignedToUser
    @UserId INT
AS
BEGIN
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
        CASE WHEN ta.AssignedUserId IS NOT NULL THEN 1 ELSE 0 END AS IsAssigned,
        (SELECT COUNT(*) FROM TaskAssignments WHERE TaskId = t.Id) AS AssignmentCount,
        assignedBy.Username AS AssignedByUsername,
        ta.AssignedDate
    FROM TodoTasks t
    INNER JOIN Users u ON t.UserId = u.Id
    INNER JOIN TaskAssignments ta ON t.Id = ta.TaskId
    INNER JOIN Users assignedBy ON ta.AssignedByUserId = assignedBy.Id
    WHERE ta.AssignedUserId = @UserId
    ORDER BY ta.AssignedDate DESC
END
GO

-- Get task assignment dates for a user
CREATE OR ALTER PROCEDURE sp_GetTaskAssignmentDatesForUser
    @UserId INT
AS
BEGIN
    SELECT AssignedDate FROM TaskAssignments WHERE AssignedUserId = @UserId
END
GO

-- Check if task is already assigned
CREATE OR ALTER PROCEDURE sp_IsTaskAlreadyAssigned
    @TaskId INT
AS
BEGIN
    SELECT COUNT(*) FROM TaskAssignments WHERE TaskId = @TaskId
END
GO

-- Get assignment status for a task
CREATE OR ALTER PROCEDURE sp_GetTaskAssignmentStatus
    @TaskId INT
AS
BEGIN
    -- First check if there are any assignments
    DECLARE @AssignmentCount INT
    SELECT @AssignmentCount = COUNT(*) FROM TaskAssignments WHERE TaskId = @TaskId

    IF @AssignmentCount = 0
    BEGIN
        SELECT 
            @TaskId AS TaskId,
            0 AS IsAssigned,
            0 AS AssignmentCount,
            1 AS CanBeReassigned,
            NULL AS FirstAssignmentDate
    END
    ELSE
    BEGIN
        SELECT 
            @TaskId AS TaskId,
            1 AS IsAssigned,
            @AssignmentCount AS AssignmentCount,
            0 AS CanBeReassigned,
            MIN(ta.AssignedDate) AS FirstAssignmentDate
        FROM TaskAssignments ta
        WHERE ta.TaskId = @TaskId
    END
END
GO

-- Get assignment details for a task (separate procedure for detailed info)
CREATE OR ALTER PROCEDURE sp_GetTaskAssignmentDetails
    @TaskId INT
AS
BEGIN
    SELECT 
        ta.AssignedUserId,
        u.Username,
        ta.AssignedDate
    FROM TaskAssignments ta
    INNER JOIN Users u ON ta.AssignedUserId = u.Id
    WHERE ta.TaskId = @TaskId
    ORDER BY ta.AssignedDate
END
GO

-- Get original assigner for a task
CREATE OR ALTER PROCEDURE sp_GetOriginalAssigner
    @TaskId INT
AS
BEGIN
    SELECT TOP 1 AssignedByUserId 
    FROM TaskAssignments 
    WHERE TaskId = @TaskId 
    ORDER BY AssignedDate ASC
END
GO

-- =============================================
-- TaskComment Stored Procedures
-- =============================================

-- Get comments by task ID with user information
CREATE OR ALTER PROCEDURE sp_GetCommentsByTaskId
    @TaskId INT
AS
BEGIN
    SELECT 
        tc.Id,
        tc.TaskId,
        tc.UserId,
        u.Username,
        tc.CommentText as Comment,
        tc.FileName,
        tc.CreatedDate,
        tc.UpdatedDate
    FROM TaskComments tc
    INNER JOIN Users u ON tc.UserId = u.Id
    WHERE tc.TaskId = @TaskId
    ORDER BY tc.CreatedDate ASC
END
GO

-- Get comment by ID
CREATE OR ALTER PROCEDURE sp_GetCommentById
    @CommentId INT
AS
BEGIN
    SELECT 
        tc.Id,
        tc.TaskId,
        tc.UserId,
        tc.CommentText as Comment,
        tc.FileName,
        tc.CreatedDate,
        tc.UpdatedDate
    FROM TaskComments tc
    WHERE tc.Id = @CommentId
END
GO

-- Create new comment
CREATE OR ALTER PROCEDURE sp_CreateComment
    @TaskId INT,
    @UserId INT,
    @Comment NVARCHAR(MAX),
    @FileName NVARCHAR(255) = NULL,
    @CreatedDate DATETIME
AS
BEGIN
    INSERT INTO TaskComments (TaskId, UserId, CommentText, FileName, CreatedDate)
    VALUES (@TaskId, @UserId, @Comment, @FileName, @CreatedDate);
    SELECT CAST(SCOPE_IDENTITY() as int);
END
GO

-- Check if user can access comment
CREATE OR ALTER PROCEDURE sp_CanUserAccessComment
    @CommentId INT,
    @UserId INT
AS
BEGIN
    SELECT COUNT(1)
    FROM TaskComments tc
    INNER JOIN TodoTasks t ON tc.TaskId = t.Id
    LEFT JOIN TaskAssignments ta ON t.Id = ta.TaskId
    WHERE tc.Id = @CommentId 
    AND (
        t.UserId = @UserId OR  -- Task owner
        tc.UserId = @UserId OR  -- Comment author
        ta.AssignedUserId = @UserId OR  -- Assigned user
        ta.AssignedByUserId = @UserId   -- User who assigned the task
    )
END
GO

-- Get comment count by task ID
CREATE OR ALTER PROCEDURE sp_GetCommentCountByTaskId
    @TaskId INT
AS
BEGIN
    SELECT COUNT(1) FROM TaskComments WHERE TaskId = @TaskId
END
GO

-- =============================================
-- Authentication Stored Procedures
-- =============================================

-- Check if user exists by username
CREATE OR ALTER PROCEDURE sp_CheckUserExists
    @Username NVARCHAR(255)
AS
BEGIN
    SELECT Id FROM Users WHERE Username = @Username
END
GO

-- Create legacy user entry
CREATE OR ALTER PROCEDURE sp_CreateLegacyUser
    @Username NVARCHAR(255),
    @Password NVARCHAR(255),
    @CreatedDate DATETIME
AS
BEGIN
    INSERT INTO Users (Username, Password, CreatedDate) 
    VALUES (@Username, @Password, @CreatedDate)
END
GO

