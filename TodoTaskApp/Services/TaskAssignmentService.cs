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

        public async Task<IEnumerable<UserSelectionViewModel>> GetAllUsersForAssignmentAsync(string excludeUserId = "")
        {
            try
            {
                var users = await _taskAssignmentRepository.GetAllUsersAsync();
                
                return users
                    .Where(u => string.IsNullOrEmpty(excludeUserId) || u.Id != excludeUserId)
                    .Select(u => new UserSelectionViewModel
                    {
                        Id = u.Id,
                        Username = u.UserName,
                        IsSelected = false
                    })
                    .OrderBy(u => u.Username);
            }
            catch (Exception ex)
            {
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
                return false;
            }
        }

        public async Task<bool> CanUserAccessTaskAsync(int taskId, int userId)
        {
            try
            {
                var result = await _taskAssignmentRepository.CanUserAccessTaskAsync(taskId, userId);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking access for task {TaskId} for user {UserId}", taskId, userId);
                return false;
            }
        }

        public async Task<bool> CanUserEditTaskAsync(int taskId, int userId)
        {
            try
            {
                var result = await _taskAssignmentRepository.CanUserEditTaskAsync(taskId, userId);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking edit access for task {TaskId} for user {UserId}", taskId, userId);
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
                return Enumerable.Empty<int>();
            }
        }

        public async Task<IEnumerable<TodoTaskWithAssignmentInfo>> GetTasksAssignedToUserAsync(int userId)
        {
            try
            {
                return await _taskAssignmentRepository.GetTasksAssignedToUserAsync(userId);
            }
            catch (Exception ex)
            {
                return Enumerable.Empty<TodoTaskWithAssignmentInfo>();
            }
        }

        public async Task<IEnumerable<DateTime>> GetTaskAssignmentDatesForUserAsync(int userId)
        {
            try
            {
                return await _taskAssignmentRepository.GetTaskAssignmentDatesForUserAsync(userId);
            }
            catch (Exception ex)
            {
                return Enumerable.Empty<DateTime>();
            }
        }

        // Check if task is already assigned to prevent reassignment
        public async Task<bool> IsTaskAlreadyAssignedAsync(int taskId)
        {
            try
            {
                return await _taskAssignmentRepository.IsTaskAlreadyAssignedAsync(taskId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if task {TaskId} is already assigned", taskId);
                return false;
            }
        }

        // Get assignment status for a task
        public async Task<TaskAssignmentStatus> GetTaskAssignmentStatusAsync(int taskId)
        {
            try
            {
                return await _taskAssignmentRepository.GetTaskAssignmentStatusAsync(taskId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assignment status for task {TaskId}", taskId);
                return new TaskAssignmentStatus
                {
                    TaskId = taskId,
                    IsAssigned = false,
                    AssignmentCount = 0,
                    CanBeReassigned = true
                };
            }
        }

        // Validate assignment before allowing reassignment
        public async Task<bool> CanAssignTaskAsync(int taskId, List<int> assignedUserIds, int currentUserId)
        {
            try
            {
                // Check if task is already assigned
                var isAlreadyAssigned = await IsTaskAlreadyAssignedAsync(taskId);
                
                if (isAlreadyAssigned)
                {
                    // Task is already assigned, check if current user is the original assigner
                    var originalAssigner = await GetOriginalAssignerAsync(taskId);
                    
                    if (originalAssigner == null || originalAssigner != currentUserId)
                    {
                        // Only the original assigner can reassign
                        return false;
                    }
                    
                    // Original assigner can reassign - check if we're trying to assign to the same users
                    var currentAssignments = await GetAssignedUserIdsAsync(taskId);
                    var currentSet = new HashSet<int>(currentAssignments);
                    var newSet = new HashSet<int>(assignedUserIds);
                    
                    // If the assignment sets are identical, allow the operation (no change)
                    if (currentSet.SetEquals(newSet))
                    {
                        return true;
                    }
                    
                    // Original assigner can change assignments
                    return true;
                }
                
                // Task is not assigned yet, allow assignment
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating assignment for task {TaskId}", taskId);
                return false;
            }
        }

        public async Task<int?> GetOriginalAssignerAsync(int taskId)
        {
            try
            {
                return await _taskAssignmentRepository.GetOriginalAssignerAsync(taskId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting original assigner for task {TaskId}", taskId);
                return null;
            }
        }
    }
}