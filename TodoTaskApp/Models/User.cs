using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace TodoTaskApp.Models
{
    public class User : IdentityUser
    {
        // When user account was created
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
