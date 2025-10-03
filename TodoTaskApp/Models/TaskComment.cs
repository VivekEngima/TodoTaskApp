using System.ComponentModel.DataAnnotations;

namespace TodoTaskApp.Models
{
    public class TaskComment
    {
        public int Id { get; set; }

        [Required]
        public int TaskId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(1000, ErrorMessage = "Comment cannot exceed 1000 characters")]
        public string Comment { get; set; } = string.Empty;

        public string? FileName { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }

        // Navigation properties
        public User? User { get; set; }
        public TodoTask? Task { get; set; }
    }

    // ViewModel for displaying comments
    public class TaskCommentViewModel
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
        public string? FileName { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public bool CanEdit { get; set; } = false;
        public bool CanDelete { get; set; } = false;
    }

    // ViewModel for creating comments
    public class CreateCommentViewModel
    {
        [Required]
        public int TaskId { get; set; }

        [Required]
        [StringLength(1000, ErrorMessage = "Comment cannot exceed 1000 characters")]
        public string Comment { get; set; } = string.Empty;

        public string? FileName { get; set; }
    }
}