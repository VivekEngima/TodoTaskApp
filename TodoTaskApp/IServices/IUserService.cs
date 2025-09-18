using TodoTaskApp.Models;

namespace TodoTaskApp.IServices
{
    public interface IUserService
    {
        Task<AuthResultViewModel> LoginAsync(LoginViewModel loginModel);
        Task<AuthResultViewModel> SignupAsync(SignupViewModel signupModel);
        Task<User?> GetUserByUsernameAsync(string username);
        Task<bool> UsernameExistsAsync(string username);
    }
}