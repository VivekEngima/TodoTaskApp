using TodoTaskApp.IRepository;
using TodoTaskApp.IServices;
using TodoTaskApp.Models;

namespace TodoTaskApp.Services
{
    public class TodoTaskService : ITodoTaskService
    {
        private readonly ITodoTaskRepository _todoTaskRepository;
        private readonly ILogger<TodoTaskService> _logger;

        public TodoTaskService(ITodoTaskRepository todoTaskRepository, ILogger<TodoTaskService> logger)
        {
            _todoTaskRepository = todoTaskRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<TodoTask>> GetAllTasksAsync(int userId)
        {
            try
            {
                return await _todoTaskRepository.GetAllTasksAsync(userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all tasks for user {UserId}", userId);
                throw;
            }
        }

        public async Task<TodoTask?> GetTaskByIdAsync(int id, int userId)
        {
            try
            {
                return await _todoTaskRepository.GetTaskByIdAsync(id, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting task {TaskId} for user {UserId}", id, userId);
                throw;
            }
        }

        public async Task<int> CreateTaskAsync(TodoTaskViewModel task, int userId)
        {
            try
            {
                return await _todoTaskRepository.CreateTaskAsync(task, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating task for user {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> UpdateTaskAsync(TodoTaskViewModel task, int userId)
        {
            try
            {
                return await _todoTaskRepository.UpdateTaskAsync(task, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task {TaskId} for user {UserId}", task.Id, userId);
                throw;
            }
        }

        public async Task<bool> DeleteTaskAsync(int id, int userId)
        {
            try
            {
                return await _todoTaskRepository.DeleteTaskAsync(id, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task {TaskId} for user {UserId}", id, userId);
                throw;
            }
        }

        public async Task<bool> UpdateTaskStatusAsync(int id, string status, int userId)
        {
            try
            {
                return await _todoTaskRepository.UpdateTaskStatusAsync(id, status, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task status {TaskId} for user {UserId}", id, userId);
                throw;
            }
        }

        public async Task<IEnumerable<TodoTask>> FilterTasksAsync(FilterViewModel filter, int userId)
        {
            try
            {
                return await _todoTaskRepository.FilterTasksAsync(filter, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error filtering tasks for user {UserId}", userId);
                throw;
            }
        }

        public async Task<IEnumerable<TodoTask>> FilterTasksByDateRangeAsync(FilterViewModel filter, int userId)
        {
            try
            {
                return await _todoTaskRepository.FilterTasksByDateRangeAsync(filter, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error filtering tasks by date range for user {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> CheckDuplicateTaskAsync(string title, int? excludeId, int userId)
        {
            try
            {
                return await _todoTaskRepository.CheckDuplicateTaskAsync(title, excludeId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking duplicate task for user {UserId}", userId);
                throw;
            }
        }

        public FilterViewModel GetFilterOptions()
        {
            return new FilterViewModel
            {
                Priorities = new List<string> { "High", "Normal", "Low" },
                Statuses = new List<string> { "Pending", "Hold", "Completed" }
            };
        }
    }
}
