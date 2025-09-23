using Dapper;
using System.Data;
using TodoTaskApp.Data;
using TodoTaskApp.IRepository;
using TodoTaskApp.Models;

namespace TodoTaskApp.Repository
{
    public class TodoTaskRepository : ITodoTaskRepository
    {
        private readonly DapperContext _context;

        // Constructor - gets database connection
        public TodoTaskRepository(DapperContext context)
        {
            _context = context;
        }

        // Check if task title already exists for user
        public async Task<bool> CheckDuplicateTaskAsync(string title, int? excludeId, int userId)
        {
            var query = @"
                SELECT COUNT(1) 
                FROM TodoTasks 
                WHERE UserId = @UserId 
                AND Title = @Title 
                AND (@ExcludeId IS NULL OR Id != @ExcludeId)";

            using var connection = _context.CreateConnection();
            var count = await connection.QuerySingleAsync<int>(
                query,
                new { Title = title, ExcludeId = excludeId, UserId = userId }
            );

            return count > 0;
        }

        // Create new task using stored procedure
        public async Task<int> CreateTaskAsync(TodoTaskViewModel task, int userId)
        {
            var query = "CreateTodoTask";

            using var connection = _context.CreateConnection();
            var taskId = await connection.QuerySingleAsync<int>(
                query,
                new
                {
                    Title = task.Title,
                    Description = task.Description,
                    Priority = task.Priority,
                    Status = task.Status,
                    DueDate = task.DueDate,
                    UserId = userId
                },
                commandType: CommandType.StoredProcedure
            );

            return taskId;
        }

        public async Task<bool> DeleteTaskAsync(int id, int userId)
        {
            var query = "DeleteTodoTask";

            using var connection = _context.CreateConnection();
            var affectedRows = await connection.ExecuteAsync(
                query,
                new { Id = id, UserId = userId },
                commandType: CommandType.StoredProcedure
            );

            return affectedRows > 0;
        }

        public async Task<IEnumerable<TodoTask>> FilterTasksAsync(FilterViewModel filter, int userId)
        {
            var query = @"
                SELECT Id, Title, Description, Priority, Status, DueDate, CreatedDate, UpdatedDate, CompletedDate, UserId
                FROM TodoTasks 
                WHERE UserId = @UserId
                AND (@Priority IS NULL OR Priority = @Priority)
                AND (@Status IS NULL OR Status = @Status)
                AND (@SearchTerm IS NULL OR Title LIKE '%' + @SearchTerm + '%' OR Description LIKE '%' + @SearchTerm + '%')
                ORDER BY CreatedDate DESC";

            using var connection = _context.CreateConnection();
            var tasks = await connection.QueryAsync<TodoTask>(
                query,
                new
                {
                    UserId = userId,
                    Priority = string.IsNullOrEmpty(filter.Priority) ? null : filter.Priority,
                    Status = string.IsNullOrEmpty(filter.Status) ? null : filter.Status,
                    SearchTerm = string.IsNullOrEmpty(filter.SearchTerm) ? null : filter.SearchTerm
                }
            );

            return tasks;
        }

        public async Task<IEnumerable<TodoTask>> FilterTasksByDateRangeAsync(FilterViewModel filter, int userId)
        {
            var query = @"
                SELECT Id, Title, Description, Priority, Status, DueDate, CreatedDate, UpdatedDate, CompletedDate, UserId
                FROM TodoTasks 
                WHERE UserId = @UserId
                AND (@StartDate IS NULL OR DueDate >= @StartDate)
                AND (@EndDate IS NULL OR DueDate <= @EndDate)
                ORDER BY DueDate ASC";

            using var connection = _context.CreateConnection();
            var tasks = await connection.QueryAsync<TodoTask>(
                query,
                new
                {
                    UserId = userId,
                    StartDate = filter.StartDate,
                    EndDate = filter.EndDate
                }
            );

            return tasks;
        }

        public async Task<IEnumerable<TodoTask>> GetAllTasksAsync(int userId)
        {
            var query = "GetAllTodoTasks";

            using var connection = _context.CreateConnection();
            var tasks = await connection.QueryAsync<TodoTask>(
                query,
                new { UserId = userId },
                commandType: CommandType.StoredProcedure
            );

            return tasks;
        }

        public async Task<TodoTask?> GetTaskByIdAsync(int id, int userId)
        {
            var query = "GetTodoTaskById";

            using var connection = _context.CreateConnection();
            var task = await connection.QueryFirstOrDefaultAsync<TodoTask>(
                query,
                new { Id = id, UserId = userId },
                commandType: CommandType.StoredProcedure
            );

            return task;
        }

        public async Task<bool> UpdateTaskAsync(TodoTaskViewModel task, int userId)
        {
            var query = "UpdateTodoTask";

            using var connection = _context.CreateConnection();
            var affectedRows = await connection.ExecuteAsync(
                query,
                new
                {
                    Id = task.Id,
                    Title = task.Title,
                    Description = task.Description,
                    Priority = task.Priority,
                    Status = task.Status,
                    DueDate = task.DueDate,
                    UserId = userId
                },
                commandType: CommandType.StoredProcedure
            );

            return affectedRows > 0;
        }

        public async Task<bool> UpdateTaskStatusAsync(int id, string status, int userId)
        {
            var query = "UpdateTodoTaskStatus";

            using var connection = _context.CreateConnection();
            var affectedRows = await connection.ExecuteAsync(
                query,
                new { Id = id, Status = status, UserId = userId },
                commandType: CommandType.StoredProcedure
            );

            return affectedRows > 0;
        }
    }
}