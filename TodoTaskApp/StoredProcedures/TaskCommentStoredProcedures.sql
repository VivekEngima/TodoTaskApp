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

