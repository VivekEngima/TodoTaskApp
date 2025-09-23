using System.ComponentModel.DataAnnotations;

namespace TodoTaskApp.Models
{
    public class User
    {
        public int Id { get; set; }

        // Username with validation
        [Required(ErrorMessage = "Username is required")]
        [StringLength(50, ErrorMessage = "Username cannot exceed 50 characters")]
        [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Username can only contain letters, numbers, and underscores")]
        public string Username { get; set; } = string.Empty;

        // Password (stored as hash)
        [Required(ErrorMessage = "Password is required")]
        [StringLength(255, ErrorMessage = "Password cannot exceed 255 characters")]
        public string Password { get; set; } = string.Empty;

        // When user account was created
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
