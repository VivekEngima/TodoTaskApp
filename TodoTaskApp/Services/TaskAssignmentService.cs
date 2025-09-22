using TodoTaskApp.IRepository;
using TodoTaskApp.IServices;
using TodoTaskApp.Models;

namespace TodoTaskApp.Services
{
    public class TaskAssignmentService : ITaskAssignmentService
    {
        private readonly ITaskAssignmentRepository _taskAssignmentRepository;
        private readonly ILogger<TaskAssignmentService> _logger;

        public TaskAssignmentService(ITaskAssignmentRepository taskAssignmentRepository, ILogger<TaskAssignmentService> logger)
        {
            _taskAssignmentRepository = taskAssignmentRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<UserSelectionViewModel>> GetAllUsersForAssignmentAsync(int excludeUserId = 0)
        {
            try
            {
                var users = await _taskAssignmentRepository.GetAllUsersAsync();
                
                return users
                    .Where(u => excludeUserId == 0 || u.Id != excludeUserId)
                    .Select(u => new UserSelectionViewModel
                    {
                        Id = u.Id,
                        Username = u.Username,
                        IsSelected = false
                    })
                    .OrderBy(u => u.Username);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users for assignment");
                return Enumerable.Empty<UserSelectionViewModel>();
            }
        }

        public async Task<IEnumerable<TaskAssignmentViewModel>> GetTaskAssignmentsAsync(int taskId)
        {
            try
            {
                return await _taskAssignmentRepository.GetTaskAssignmentsAsync(taskId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting task assignments for task {TaskId}", taskId);
                return Enumerable.Empty<TaskAssignmentViewModel>();
            }
        }

        public async Task<bool> AssignTaskToUsersAsync(int taskId, List<int> assignedUserIds, int assignedByUserId)
        {
            try
            {
                // Get current assignments
                var currentAssignedUserIds = await GetAssignedUserIdsAsync(taskId);
                var currentSet = new HashSet<int>(currentAssignedUserIds);
                var newSet = new HashSet<int>(assignedUserIds);

                // Remove users that are no longer assigned
                var usersToRemove = currentSet.Except(newSet);
                foreach (var userId in usersToRemove)
                {
                    await _taskAssignmentRepository.RemoveTaskAssignmentAsync(taskId, userId);
                }

                // Add new assignments
                var usersToAdd = newSet.Except(currentSet);
                foreach (var userId in usersToAdd)
                {
                    await _taskAssignmentRepository.AssignTaskToUserAsync(taskId, userId, assignedByUserId);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning task {TaskId} to users", taskId);
                return false;
            }
        }

        public async Task<bool> RemoveTaskAssignmentAsync(int taskId, int assignedUserId)
        {
            try
            {
                return await _taskAssignmentRepository.RemoveTaskAssignmentAsync(taskId, assignedUserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing task assignment for task {TaskId} and user {UserId}", taskId, assignedUserId);
                return false;
            }
        }

        public async Task<bool> CanUserAccessTaskAsync(int taskId, int userId)
        {
            try
            {
                return await _taskAssignmentRepository.CanUserAccessTaskAsync(taskId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking task access for task {TaskId} and user {UserId}", taskId, userId);
                return false;
            }
        }

        public async Task<bool> UpdateTaskAssignmentsAsync(int taskId, List<int> assignedUserIds, int currentUserId)
        {
            return await AssignTaskToUsersAsync(taskId, assignedUserIds, currentUserId);
        }

        public async Task<IEnumerable<int>> GetAssignedUserIdsAsync(int taskId)
        {
            try
            {
                return await _taskAssignmentRepository.GetAssignedUserIdsAsync(taskId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assigned user IDs for task {TaskId}", taskId);
                return Enumerable.Empty<int>();
            }
        }
    }
}