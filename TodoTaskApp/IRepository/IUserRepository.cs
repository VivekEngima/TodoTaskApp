using TodoTaskApp.Models;

namespace TodoTaskApp.IRepository
{
    public interface IUserRepository
    {
        Task<User?> GetUserByUsernameAsync(string username);
        Task<int> CreateUserAsync(User user);
        Task<User?> ValidateUserLoginAsync(string username, string password);
        Task<bool> UsernameExistsAsync(string username);
    }
}