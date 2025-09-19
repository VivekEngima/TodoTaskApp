using TodoTaskApp.IRepository;
using TodoTaskApp.IServices;
using TodoTaskApp.Models;

namespace TodoTaskApp.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly ILogger<UserService> _logger;

        public UserService(IUserRepository userRepository, ILogger<UserService> logger)
        {
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<AuthResultViewModel> LoginAsync(LoginViewModel loginModel)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(loginModel.Username) || string.IsNullOrWhiteSpace(loginModel.Password))
                {
                    return new AuthResultViewModel
                    {
                        Success = false,
                        Message = "Username and password are required"
                    };
                }

                var user = await _userRepository.ValidateUserLoginAsync(loginModel.Username, loginModel.Password);

                if (user == null)
                {
                    return new AuthResultViewModel
                    {
                        Success = false,
                        Message = "Invalid username or password"
                    };
                }

                return new AuthResultViewModel
                {
                    Success = true,
                    Message = "Login successful",
                    User = user
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user login for username: {Username}", loginModel.Username);
                return new AuthResultViewModel
                {
                    Success = false,
                    Message = "An error occurred during login"
                };
            }
        }

        public async Task<AuthResultViewModel> SignupAsync(SignupViewModel signupModel)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(signupModel.Username) || string.IsNullOrWhiteSpace(signupModel.Password))
                {
                    return new AuthResultViewModel
                    {
                        Success = false,
                        Message = "Username and password are required"
                    };
                }

                if (signupModel.Password != signupModel.ConfirmPassword)
                {
                    return new AuthResultViewModel
                    {
                        Success = false,
                        Message = "Password and confirm password do not match"
                    };
                }

                // Check if username already exists
                if (await _userRepository.UsernameExistsAsync(signupModel.Username))
                {
                    return new AuthResultViewModel
                    {
                        Success = false,
                        Message = "Username already exists"
                    };
                }

                // Create new user
                var user = new User
                {
                    Username = signupModel.Username,
                    Password = signupModel.Password,
                    CreatedDate = DateTime.Now
                };

                var userId = await _userRepository.CreateUserAsync(user);

                if (userId > 0)
                {
                    user.Id = userId;
                    return new AuthResultViewModel
                    {
                        Success = true,
                        Message = "Account created successfully",
                        User = user
                    };
                }

                return new AuthResultViewModel
                {
                    Success = false,
                    Message = "Failed to create account"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user signup for username: {Username}", signupModel.Username);
                return new AuthResultViewModel
                {
                    Success = false,
                    Message = "An error occurred during signup"
                };
            }
            }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            try
            {
                return await _userRepository.GetUserByUsernameAsync(username);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by username: {Username}", username);
                return null;
            }
        }

        public async Task<bool> UsernameExistsAsync(string username)
        {
            try
            {
                return await _userRepository.UsernameExistsAsync(username);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if username exists: {Username}", username);
                return false;
            }
        }
    }
}
