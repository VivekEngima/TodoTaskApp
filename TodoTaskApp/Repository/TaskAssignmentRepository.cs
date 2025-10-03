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
            using var connection = _context.CreateConnection();
            var count = await connection.QuerySingleAsync<int>(
                "sp_IsTaskAssignedToMultipleUsers",
                new { TaskId = taskId },
                commandType: CommandType.StoredProcedure
            );

            return count > 0;
        }

        public async Task<IEnumerable<int>> GetAssignedUserIdsAsync(int taskId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<int>(
                "sp_GetAssignedUserIds",
                new { TaskId = taskId },
                commandType: CommandType.StoredProcedure
            );
        }

        // Get tasks assigned TO a specific user (not created by them)
        public async Task<IEnumerable<TodoTaskWithAssignmentInfo>> GetTasksAssignedToUserAsync(int userId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<TodoTaskWithAssignmentInfo>(
                "sp_GetTasksAssignedToUser",
                new { UserId = userId },
                commandType: CommandType.StoredProcedure
            );
        }

        // Get task assignment dates for a user (when tasks were assigned to them)
        public async Task<IEnumerable<DateTime>> GetTaskAssignmentDatesForUserAsync(int userId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<DateTime>(
                "sp_GetTaskAssignmentDatesForUser",
                new { UserId = userId },
                commandType: CommandType.StoredProcedure
            );
        }

        // Check if task is already assigned to prevent reassignment
        public async Task<bool> IsTaskAlreadyAssignedAsync(int taskId)
        {
            using var connection = _context.CreateConnection();
            var count = await connection.QuerySingleAsync<int>(
                "sp_IsTaskAlreadyAssigned",
                new { TaskId = taskId },
                commandType: CommandType.StoredProcedure
            );

            return count > 0;
        }

        // Get assignment status for a task
        public async Task<TaskAssignmentStatus> GetTaskAssignmentStatusAsync(int taskId)
        {
            using var connection = _context.CreateConnection();
            
            // Get basic status
            var status = await connection.QuerySingleAsync<dynamic>(
                "sp_GetTaskAssignmentStatus",
                new { TaskId = taskId },
                commandType: CommandType.StoredProcedure
            );

            var taskAssignmentStatus = new TaskAssignmentStatus
            {
                TaskId = taskId,
                IsAssigned = status.IsAssigned,
                AssignmentCount = status.AssignmentCount,
                CanBeReassigned = status.CanBeReassigned,
                FirstAssignmentDate = status.FirstAssignmentDate
            };

            // If assigned, get detailed assignment information
            if (status.IsAssigned)
            {
                var assignments = await connection.QueryAsync<dynamic>(
                    "sp_GetTaskAssignmentDetails",
                    new { TaskId = taskId },
                    commandType: CommandType.StoredProcedure
                );

                taskAssignmentStatus.AssignedUserIds = assignments.Select(a => (int)a.AssignedUserId).ToList();
                taskAssignmentStatus.AssignedUserNames = assignments.Select(a => (string)a.Username).ToList();
            }

            return taskAssignmentStatus;
        }

        public async Task<int?> GetOriginalAssignerAsync(int taskId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<int?>(
                "sp_GetOriginalAssigner",
                new { TaskId = taskId },
                commandType: CommandType.StoredProcedure
            );
        }
    }
}