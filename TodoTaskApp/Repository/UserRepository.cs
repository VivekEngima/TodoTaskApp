using Dapper;
using Microsoft.AspNetCore.Identity;
using System.Data;
using TodoTaskApp.Data;
using TodoTaskApp.IRepository;
using TodoTaskApp.Models;

namespace TodoTaskApp.Repository
{
    public class UserRepository : IUserRepository
    {
        private readonly DapperContext _context;
        private readonly IPasswordHasher<User> _passwordHasher;

        public UserRepository(DapperContext context, IPasswordHasher<User> passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }
        public async Task<int> CreateUserAsync(User user)
        {
            // Hash the password before storing
            user.Password = _passwordHasher.HashPassword(user, user.Password);

            var query = "CreateUser";

            using var connection = _context.CreateConnection();
            var result = await connection.QuerySingleAsync<int>(
                query,
                new
                {
                    Username = user.Username,
                    Password = user.Password
                },
                commandType: CommandType.StoredProcedure
            );

            return result;
        }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            var query = "GetUserByUsername";

            using var connection = _context.CreateConnection();
            var user = await connection.QueryFirstOrDefaultAsync<User>(
                query,
                new { Username = username },
                commandType: CommandType.StoredProcedure
            );

            return user;
        }

        public async Task<bool> UsernameExistsAsync(string username)
        {
            var user = await GetUserByUsernameAsync(username);
            return user != null;
        }

        public async Task<User?> ValidateUserLoginAsync(string username, string password)
        {
            // First get the user with hashed password
            var user = await GetUserByUsernameAsync(username);

            if (user == null)
                return null;

            // Verify the password against the hash
            var result = _passwordHasher.VerifyHashedPassword(user, user.Password, password);

            if (result == PasswordVerificationResult.Success)
            {
                return user;
            }

            return null;
        }
    }
}
