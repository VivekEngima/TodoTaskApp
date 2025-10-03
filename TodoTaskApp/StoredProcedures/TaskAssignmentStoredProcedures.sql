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
