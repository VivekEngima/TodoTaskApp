using TodoTaskApp.Models;

namespace TodoTaskApp.IServices
{
    public interface IUserService
    {
        Task<User?> GetUserByUsernameAsync(string username);
        Task<bool> UsernameExistsAsync(string username);
        Task<List<User>> GetAllUsersAsync();
        Task<bool> UpdateUserPasswordAsync(string userId, string hashedPassword);
    }
}