using Dapper;
using System.Data;
using TodoTaskApp.Data;
using TodoTaskApp.IRepository;
using TodoTaskApp.Models;

namespace TodoTaskApp.Repository
{
    public class TaskAssignmentRepository : ITaskAssignmentRepository
    {
        private readonly DapperContext _context;

        public TaskAssignmentRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync()
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<User>(
                "sp_GetAllUsers",
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<TaskAssignmentViewModel>> GetTaskAssignmentsAsync(int taskId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<TaskAssignmentViewModel>(
                "sp_GetTaskAssignments",
                new { TaskId = taskId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> AssignTaskToUserAsync(int taskId, int assignedUserId, int assignedByUserId)
        {
            using var connection = _context.CreateConnection();
            var result = await connection.QuerySingleOrDefaultAsync<int>(
                "sp_AssignTaskToUser",
                new { TaskId = taskId, AssignedUserId = assignedUserId, AssignedByUserId = assignedByUserId },
                commandType: CommandType.StoredProcedure);

            return result;
        }

        public async Task<bool> RemoveTaskAssignmentAsync(int taskId, int assignedUserId)
        {
            using var connection = _context.CreateConnection();
            var result = await connection.QuerySingleOrDefaultAsync<int>(
                "sp_RemoveTaskAssignment",
                new { TaskId = taskId, AssignedUserId = assignedUserId },
                commandType: CommandType.StoredProcedure);

            return result > 0;
        }

        public async Task<bool> CanUserAccessTaskAsync(int taskId, int userId)
        {
            using var connection = _context.CreateConnection();
            var result = await connection.QuerySingleOrDefaultAsync<int>(
                "sp_CanUserAccessTask",
                new { TaskId = taskId, UserId = userId },
                commandType: CommandType.StoredProcedure);

            return result > 0;
        }

        public async Task<bool> CanUserEditTaskAsync(int taskId, int userId)
        {
            using var connection = _context.CreateConnection();
            var result = await connection.QuerySingleOrDefaultAsync<int>(
                "sp_CanUserEditTask",
                new { TaskId = taskId, UserId = userId },
                commandType: CommandType.StoredProcedure);

            return result > 0;
        }

        public async Task<bool> CanUserAssignTaskAsync(int taskId, int userId)
        {
            using var connection = _context.CreateConnection();
            var result = await connection.QuerySingleOrDefaultAsync<int>(
                "sp_CanUserAssignTask",
                new { TaskId = taskId, UserId = userId },
                commandType: CommandType.StoredProcedure);

            return result > 0;
        }

        // Updated to return TodoTaskWithAssignmentInfo
        public async Task<IEnumerable<TodoTaskWithAssignmentInfo>> GetAllAccessibleTasksAsync(int userId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<TodoTaskWithAssignmentInfo>(
                "sp_GetAllAccessibleTasks",
                new { UserId = userId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> IsTaskAssignedToMultipleUsersAsync(int taskId)
        {
            var query = @"SELECT COUNT(*) FROM TaskAssignments WHERE TaskId = @TaskId";

            using var connection = _context.CreateConnection();
            var count = await connection.QuerySingleAsync<int>(query, new { TaskId = taskId });

            return count > 0;
        }

        public async Task<IEnumerable<int>> GetAssignedUserIdsAsync(int taskId)
        {
            var query = @"SELECT AssignedUserId FROM TaskAssignments WHERE TaskId = @TaskId";

            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<int>(query, new { TaskId = taskId });
        }

        // Get tasks assigned TO a specific user (not created by them)
        public async Task<IEnumerable<TodoTaskWithAssignmentInfo>> GetTasksAssignedToUserAsync(int userId)
        {
            var query = @"
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
                ORDER BY ta.AssignedDate DESC";

            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<TodoTaskWithAssignmentInfo>(query, new { UserId = userId });
        }

        // Get task assignment dates for a user (when tasks were assigned to them)
        public async Task<IEnumerable<DateTime>> GetTaskAssignmentDatesForUserAsync(int userId)
        {
            var query = @"SELECT AssignedDate FROM TaskAssignments WHERE AssignedUserId = @UserId";

            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<DateTime>(query, new { UserId = userId });
        }

        // Check if task is already assigned to prevent reassignment
        public async Task<bool> IsTaskAlreadyAssignedAsync(int taskId)
        {
            var query = @"SELECT COUNT(*) FROM TaskAssignments WHERE TaskId = @TaskId";

            using var connection = _context.CreateConnection();
            var count = await connection.QuerySingleAsync<int>(query, new { TaskId = taskId });

            return count > 0;
        }

        // Get assignment status for a task
        public async Task<TaskAssignmentStatus> GetTaskAssignmentStatusAsync(int taskId)
        {
            // First check if there are any assignments
            var countQuery = @"SELECT COUNT(*) FROM TaskAssignments WHERE TaskId = @TaskId";
            
            using var connection = _context.CreateConnection();
            var assignmentCount = await connection.QuerySingleAsync<int>(countQuery, new { TaskId = taskId });

            if (assignmentCount == 0)
            {
                return new TaskAssignmentStatus
                {
                    TaskId = taskId,
                    IsAssigned = false,
                    AssignmentCount = 0,
                    CanBeReassigned = true
                };
            }

            // Get assignment details
            var detailsQuery = @"
                SELECT 
                    ta.AssignedUserId,
                    u.Username,
                    ta.AssignedDate
                FROM TaskAssignments ta
                INNER JOIN Users u ON ta.AssignedUserId = u.Id
                WHERE ta.TaskId = @TaskId
                ORDER BY ta.AssignedDate";

            var assignments = await connection.QueryAsync(detailsQuery, new { TaskId = taskId });
            
            var assignedUserIds = assignments.Select(a => (int)a.AssignedUserId).ToList();
            var assignedUserNames = assignments.Select(a => (string)a.Username).ToList();
            var firstAssignmentDate = assignments.Select(a => (DateTime)a.AssignedDate).Min();

            return new TaskAssignmentStatus
            {
                TaskId = taskId,
                IsAssigned = true,
                AssignmentCount = assignmentCount,
                AssignedUserIds = assignedUserIds,
                AssignedUserNames = assignedUserNames,
                FirstAssignmentDate = firstAssignmentDate,
                CanBeReassigned = false // Once assigned, cannot be reassigned
            };
        }

        public async Task<int?> GetOriginalAssignerAsync(int taskId)
        {
            using var connection = _context.CreateConnection();
            var query = @"
                SELECT TOP 1 AssignedByUserId 
                FROM TaskAssignments 
                WHERE TaskId = @TaskId 
                ORDER BY AssignedDate ASC";
            
            return await connection.QuerySingleOrDefaultAsync<int?>(query, new { TaskId = taskId });
        }
    }
}