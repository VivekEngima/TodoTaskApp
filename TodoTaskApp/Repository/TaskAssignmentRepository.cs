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
    }
}