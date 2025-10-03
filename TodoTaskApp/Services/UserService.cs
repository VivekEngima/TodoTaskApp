using Microsoft.AspNetCore.Identity;
using TodoTaskApp.IServices;
using TodoTaskApp.Models;

namespace TodoTaskApp.Services
{
    public class UserService : IUserService
    {
        private readonly UserManager<User> _userManager;
        private readonly ILogger<UserService> _logger;

        public UserService(UserManager<User> userManager, ILogger<UserService> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            try
            {
                return await _userManager.FindByNameAsync(username);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by username");
                return null;
            }
        }

        public async Task<bool> UsernameExistsAsync(string username)
        {
            try
            {
                var user = await _userManager.FindByNameAsync(username);
                return user != null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking username existence");
                return false;
            }
        }

        public async Task<List<User>> GetAllUsersAsync()
        {
            try
            {
                return _userManager.Users.ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all users");
                return new List<User>();
            }
        }

        public async Task<bool> UpdateUserPasswordAsync(string userId, string hashedPassword)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null) return false;

                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var result = await _userManager.ResetPasswordAsync(user, token, hashedPassword);
                return result.Succeeded;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user password");
                return false;
            }
        }
    }
}
