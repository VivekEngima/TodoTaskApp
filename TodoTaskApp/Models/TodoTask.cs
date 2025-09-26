using System.ComponentModel.DataAnnotations;

namespace TodoTaskApp.Models
{
    public class TodoTask
    {
        public int Id { get; set; }

        // Task title with validation
        [Required(ErrorMessage = "Title is required")]
        [StringLength(100, ErrorMessage = "Title cannot exceed 100 characters")]
        [RegularExpression(@"^[a-zA-Z0-9\s]*$", ErrorMessage = "Title cannot contain special characters")]
        public string Title { get; set; } = string.Empty;

        // Optional task description
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        [RegularExpression(@"^[a-zA-Z0-9\s.,!?()-]*$", ErrorMessage = "Description cannot contain special characters")]
        public string? Description { get; set; }

        // Task priority level
        [Required]
        public string Priority { get; set; } = "Normal";

        // Current task status
        [Required]
        public string Status { get; set; } = "Pending";

        // When task is due
        [Required]
        public DateTime DueDate { get; set; } = DateTime.Now.AddDays(7);

        // When task was created
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        // When task was last updated
        public DateTime? UpdatedDate { get; set; }

        // When task was completed
        public DateTime? CompletedDate { get; set; }

        // Who created this task
        [Required]
        public int UserId { get; set; }
        public User? User { get; set; }
    }
    // Task with assignment information
    public class TodoTaskWithAssignmentInfo
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Priority { get; set; } = "Normal";
        public string Status { get; set; } = "Pending";
        public DateTime DueDate { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public int UserId { get; set; }

        // Assignment info
        public string CreatedByUsername { get; set; } = string.Empty;
        public bool IsAssigned { get; set; } = false;
        public int AssignmentCount { get; set; } = 0;
        
        // Assignment details for "Assigned to Me" section
        public string AssignedByUsername { get; set; } = string.Empty;
        public DateTime? AssignedDate { get; set; }
    }
}