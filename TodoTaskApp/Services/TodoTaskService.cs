using TodoTaskApp.IRepository;
using TodoTaskApp.IServices;
using TodoTaskApp.Models;

namespace TodoTaskApp.Services
{
    public class TodoTaskService : ITodoTaskService
    {
        private readonly ITodoTaskRepository _todoTaskRepository;
        private readonly ITaskAssignmentRepository _taskAssignmentRepository;
        private readonly ITaskAssignmentService _taskAssignmentService;
        private readonly ILogger<TodoTaskService> _logger;

        // Constructor - gets repositories for data access
        public TodoTaskService(
            ITodoTaskRepository todoTaskRepository,
            ITaskAssignmentRepository taskAssignmentRepository,
            ITaskAssignmentService taskAssignmentService,
            ILogger<TodoTaskService> logger
            )
        {
            _todoTaskRepository = todoTaskRepository;
            _taskAssignmentRepository = taskAssignmentRepository;
            _taskAssignmentService = taskAssignmentService;
            _logger = logger;
        }

        // Get all tasks user can see (owned + assigned)
        public async Task<IEnumerable<TodoTaskWithAssignmentInfo>> GetAllTasksAsync(int userId)
        {
            try
            {
                return await _taskAssignmentRepository.GetAllAccessibleTasksAsync(userId);
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        // Get single task by ID (check access first)
        public async Task<TodoTask?> GetTaskByIdAsync(int id, int userId)
        {
            try
            {
                // Check if user can access this task
                var canAccess = await _taskAssignmentRepository.CanUserAccessTaskAsync(id, userId);
                if (!canAccess)
                {
                    return null;
                }

                return await _todoTaskRepository.GetTaskByIdAsync(id, userId);
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        // Create new task and assign to users
        public async Task<int> CreateTaskAsync(TodoTaskViewModel task, int userId)
        {
            try
            {
                var taskId = await _todoTaskRepository.CreateTaskAsync(task, userId);

                // Assign task to other users if specified
                if (taskId > 0 && task.AssignedUserIds.Any())
                {
                    foreach (var assignedUserId in task.AssignedUserIds)
                    {
                        if (assignedUserId != userId) // Don't assign to self
                        {
                            await _taskAssignmentRepository.AssignTaskToUserAsync(taskId, assignedUserId, userId);
                        }
                    }
                }

                return taskId;
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
                // Check if user can EDIT this task (only owners can edit)
                var canEdit = await _taskAssignmentRepository.CanUserEditTaskAsync(task.Id, userId);
                if (!canEdit)
                {
                    return false;
                }

                var success = await _todoTaskRepository.UpdateTaskAsync(task, userId);

                // Handle assignment updates if task update was successful
                if (success)
                {
                    // Check if user can assign/reassign tasks (only owners can do this)
                    var canAssign = await _taskAssignmentRepository.CanUserAssignTaskAsync(task.Id, userId);
                    if (canAssign)
                    {
                        // Validate if task can be reassigned
                        var canReassign = await _taskAssignmentService.CanAssignTaskAsync(task.Id, task.AssignedUserIds, userId);
                        if (!canReassign)
                        {
                            _logger.LogWarning("Attempt to reassign already assigned task {TaskId} by user {UserId}", task.Id, userId);
                            return false; // Prevent reassignment
                        }

                        // Update assignments - get current assignments first
                        var currentAssignedUserIds = await _taskAssignmentRepository.GetAssignedUserIdsAsync(task.Id);
                        var currentSet = new HashSet<int>(currentAssignedUserIds);
                        var newSet = new HashSet<int>(task.AssignedUserIds.Where(id => id != userId)); // Exclude task owner

                        // Remove users that are no longer assigned
                        var usersToRemove = currentSet.Except(newSet);
                        foreach (var assignedUserId in usersToRemove)
                        {
                            await _taskAssignmentRepository.RemoveTaskAssignmentAsync(task.Id, assignedUserId);
                        }

                        // Add new assignments
                        var usersToAdd = newSet.Except(currentSet);
                        foreach (var assignedUserId in usersToAdd)
                        {
                            await _taskAssignmentRepository.AssignTaskToUserAsync(task.Id, assignedUserId, userId);
                        }
                    }
                }

                return success;
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
                // Check if user can DELETE this task (only owners can delete)
                var canDelete = await _taskAssignmentRepository.CanUserEditTaskAsync(id, userId);
                
                if (!canDelete)
                {
                    return false;
                }

                var result = await _todoTaskRepository.DeleteTaskAsync(id, userId);
                return result;
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
                // Check if user can access this task using TaskAssignmentRepository
                var canAccess = await _taskAssignmentRepository.CanUserAccessTaskAsync(id, userId);
                if (!canAccess)
                {
                    return false;
                }

                return await _todoTaskRepository.UpdateTaskStatusAsync(id, status, userId);
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        // Updated to return TodoTaskWithAssignmentInfo
        public async Task<IEnumerable<TodoTaskWithAssignmentInfo>> FilterTasksAsync(FilterViewModel filter, int userId)
        {
            try
            {
                // For filtering, we need to get all accessible tasks first, then apply filters
                var allTasks = await _taskAssignmentRepository.GetAllAccessibleTasksAsync(userId);

                // Apply filters in memory (or create new stored procedures for complex filtering with assignments)
                var filteredTasks = allTasks.AsEnumerable();

                if (!string.IsNullOrEmpty(filter.Priority))
                {
                    filteredTasks = filteredTasks.Where(t => t.Priority == filter.Priority);
                }

                if (!string.IsNullOrEmpty(filter.Status))
                {
                    filteredTasks = filteredTasks.Where(t => t.Status == filter.Status);
                }

                if (!string.IsNullOrEmpty(filter.SearchTerm))
                {
                    var searchTerm = filter.SearchTerm.ToLower();
                    filteredTasks = filteredTasks.Where(t =>
                        (t.Title?.ToLower().Contains(searchTerm) ?? false) ||
                        (t.Description?.ToLower().Contains(searchTerm) ?? false));
                }

                return filteredTasks.OrderByDescending(t => t.CreatedDate);
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        // Updated to return TodoTaskWithAssignmentInfo
        public async Task<IEnumerable<TodoTaskWithAssignmentInfo>> FilterTasksByDateRangeAsync(FilterViewModel filter, int userId)
        {
            try
            {
                // Similar to above - get accessible tasks first, then filter
                var allTasks = await _taskAssignmentRepository.GetAllAccessibleTasksAsync(userId);

                var filteredTasks = allTasks.AsEnumerable();

                if (filter.StartDate.HasValue)
                {
                    filteredTasks = filteredTasks.Where(t => t.DueDate >= filter.StartDate.Value);
                }

                if (filter.EndDate.HasValue)
                {
                    filteredTasks = filteredTasks.Where(t => t.DueDate <= filter.EndDate.Value);
                }

                return filteredTasks.OrderBy(t => t.DueDate);
            }
            catch (Exception ex)
            {
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