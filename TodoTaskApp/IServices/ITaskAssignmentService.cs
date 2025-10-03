using TodoTaskApp.Models;

namespace TodoTaskApp.IServices
{
    public interface ITaskAssignmentService
    {
        Task<IEnumerable<UserSelectionViewModel>> GetAllUsersForAssignmentAsync(string excludeUserId = "");
        Task<IEnumerable<TaskAssignmentViewModel>> GetTaskAssignmentsAsync(int taskId);
        Task<bool> AssignTaskToUsersAsync(int taskId, List<int> assignedUserIds, int assignedByUserId);
        Task<bool> RemoveTaskAssignmentAsync(int taskId, int assignedUserId);
        Task<bool> CanUserAccessTaskAsync(int taskId, int userId);
        Task<bool> CanUserEditTaskAsync(int taskId, int userId);
        Task<bool> UpdateTaskAssignmentsAsync(int taskId, List<int> assignedUserIds, int currentUserId);
        Task<IEnumerable<int>> GetAssignedUserIdsAsync(int taskId);
        
        // Get tasks assigned TO a specific user (not created by them)
        Task<IEnumerable<TodoTaskWithAssignmentInfo>> GetTasksAssignedToUserAsync(int userId);
        
        // Get task assignment dates for a user (when tasks were assigned to them)
        Task<IEnumerable<DateTime>> GetTaskAssignmentDatesForUserAsync(int userId);
        
        // Check if task is already assigned to prevent reassignment
        Task<bool> IsTaskAlreadyAssignedAsync(int taskId);
        
        // Get assignment status for a task
        Task<TaskAssignmentStatus> GetTaskAssignmentStatusAsync(int taskId);
        
        // Validate assignment before allowing reassignment
        Task<bool> CanAssignTaskAsync(int taskId, List<int> assignedUserIds, int currentUserId);
        
        // Get the original assigner of a task
        Task<int?> GetOriginalAssignerAsync(int taskId);
    }
}