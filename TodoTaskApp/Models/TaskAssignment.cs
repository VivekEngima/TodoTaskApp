using System.ComponentModel.DataAnnotations;

namespace TodoTaskApp.Models
{
    // Task Assignment Models - Keep these separate from TodoTaskViewModel

    // Main assignment model
    public class TaskAssignment
    {
        public int Id { get; set; }

        [Required]
        public int TaskId { get; set; }

        [Required]
        public int AssignedUserId { get; set; }

        [Required]
        public int AssignedByUserId { get; set; }

        public DateTime AssignedDate { get; set; } = DateTime.Now;

        // Navigation properties
        public User? AssignedUser { get; set; }
        public User? AssignedByUser { get; set; }
    }

    // ViewModel for displaying task assignments
    public class TaskAssignmentViewModel
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int AssignedUserId { get; set; }
        public string AssignedUserName { get; set; } = string.Empty;
        public int AssignedByUserId { get; set; }
        public string AssignedByUserName { get; set; } = string.Empty;
        public DateTime AssignedDate { get; set; }
    }

    // ViewModel for assignment operations
    public class AssignTaskViewModel
    {
        [Required]
        public int TaskId { get; set; }

        [Required]
        public List<int> AssignedUserIds { get; set; } = new List<int>();
    }

    // ViewModel for user selection in dropdowns
    public class UserSelectionViewModel
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public bool IsSelected { get; set; } = false;
    }

    // Model for task assignment status
    public class TaskAssignmentStatus
    {
        public int TaskId { get; set; }
        public bool IsAssigned { get; set; }
        public int AssignmentCount { get; set; }
        public List<int> AssignedUserIds { get; set; } = new List<int>();
        public List<string> AssignedUserNames { get; set; } = new List<string>();
        public DateTime? FirstAssignmentDate { get; set; }
        public bool CanBeReassigned { get; set; } = true;
    }
}