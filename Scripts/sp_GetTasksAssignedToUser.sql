-- Stored Procedure: sp_GetTasksAssignedToUser
-- Description: Gets all tasks assigned TO a specific user (not created by them)
-- Parameters: @UserId (int) - The ID of the user to get assigned tasks for

CREATE OR ALTER PROCEDURE sp_GetTasksAssignedToUser
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
