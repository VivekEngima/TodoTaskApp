using Microsoft.AspNetCore.Mvc;
using TodoTaskApp.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using TodoTaskApp.Data;
using Dapper;
using System.Security.Claims;

namespace TodoTaskApp.Controllers
{
    public class AuthController : Controller
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly ILogger<AuthController> _logger;
        private readonly DapperContext _dapperContext;

        // Constructor - gets Identity services for login/signup
        public AuthController(UserManager<User> userManager, SignInManager<User> signInManager, ILogger<AuthController> logger, DapperContext dapperContext)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _logger = logger;
            _dapperContext = dapperContext;
        }

        // Show unified auth page (login and signup side by side)
        [HttpGet]
        public IActionResult Index(string? returnUrl = null)
        {
            ViewBag.ReturnUrl = returnUrl;
            
            // Clear TempData to prevent persistence on page reload
            TempData.Remove("SuccessMessage");
            TempData.Remove("ErrorMessage");
            TempData.Remove("InfoMessage");
            
            var authViewModel = new AuthViewModel();
            return View(authViewModel);
        }

        // Process login form
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
        {
            ViewBag.ReturnUrl = returnUrl;
            
            if (!ModelState.IsValid)
            {
                // Always return to the unified auth page
                var authViewModel = new AuthViewModel { Login = model };
                return View("Index", authViewModel);
            }

            try
            {
                var result = await _signInManager.PasswordSignInAsync(model.Username, model.Password, false, lockoutOnFailure: false);

                if (!result.Succeeded)
                {
                    // Check if user doesn't exist and suggest signup
                    var user = await _userManager.FindByNameAsync(model.Username);
                    if (user == null)
                    {
                        TempData["InfoMessage"] = $"Username '{model.Username}' does not exist. Please create a new account.";
                    }
                    else
                    {
                        TempData["ErrorMessage"] = "Invalid password. Please check your password and try again.";
                    }

                    // Always return to the unified auth page
                    var authViewModel = new AuthViewModel { Login = model };
                    return View("Index", authViewModel);
                }

                // Redirect to return URL or dashboard
                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                {
                    return Redirect(returnUrl);
                }

                return RedirectToAction("Index", "Dashboard");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login");
                // Always return to the unified auth page
                TempData["ErrorMessage"] = "An unexpected error occurred. Please try again.";
                var authViewModel = new AuthViewModel { Login = model };
                return View("Index", authViewModel);
            }
        }

        // Process signup form
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Signup(SignupViewModel model)
        {
            if (!ModelState.IsValid)
            {
                // Always return to the unified auth page
                var authViewModel = new AuthViewModel { Signup = model };
                return View("Index", authViewModel);
            }

            try
            {
                // Check if username already exists
                var existingUser = await _userManager.FindByNameAsync(model.Username);
                if (existingUser != null)
                {
                    TempData["ErrorMessage"] = "Username is already taken. Please choose a different username.";
                    var authViewModel = new AuthViewModel { Signup = model };
                    return View("Index", authViewModel);
                }

                // Create new user
                var user = new User
                {
                    UserName = model.Username,
                    CreatedDate = DateTime.Now
                };

                var result = await _userManager.CreateAsync(user, model.Password);

                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    TempData["ErrorMessage"] = $"Account creation failed: {errors}";
                    var authViewModel = new AuthViewModel { Signup = model };
                    return View("Index", authViewModel);
                }

                // Create legacy user entry for compatibility with existing database
                await CreateLegacyUserAsync(model.Username, model.Password);

                // After successful signup, automatically log in the user
                await _signInManager.SignInAsync(user, isPersistent: false);

                TempData["SuccessMessage"] = "Account created successfully! Welcome to TodoTaskApp!";
                return RedirectToAction("Index", "Dashboard");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during signup");
                // Always return to the unified auth page
                TempData["ErrorMessage"] = "An unexpected error occurred. Please try again.";
                var authViewModel = new AuthViewModel { Signup = model };
                return View("Index", authViewModel);
            }
        }

        // POST: Auth/Logout
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            try
            {
                await _signInManager.SignOutAsync();
                return RedirectToAction("Index", "Auth");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
                return RedirectToAction("Index", "Auth");
            }
        }

        // AJAX: Check username availability
        [HttpPost]
        public async Task<IActionResult> CheckUsername(string username)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(username))
                {
                    return Json(new { available = false, message = "Username is required" });
                }

                var user = await _userManager.FindByNameAsync(username);
                var exists = user != null;

                return Json(new
                {
                    available = !exists,
                    message = exists ? "Username is already taken" : "Username is available"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking username");
                return Json(new { available = false, message = "Error checking username" });
            }
        }

        // GET: Auth/AccessDenied
        [HttpGet]
        public IActionResult AccessDenied()
        {
            return View();
        }

        // Google Sign-In Challenge
        [HttpGet]
        public IActionResult GoogleSignIn(string? returnUrl = null)
        {
            var redirectUrl = Url.Action("GoogleCallback", "Auth", new { ReturnUrl = returnUrl });
            var properties = _signInManager.ConfigureExternalAuthenticationProperties("Google", redirectUrl);
            return Challenge(properties, "Google");
        }

        // Google Sign-In Callback
        [HttpGet]
        public async Task<IActionResult> GoogleCallback(string? returnUrl = null, string? remoteError = null)
        {
            if (remoteError != null)
            {
                TempData["ErrorMessage"] = $"Error from external provider: {remoteError}";
                return RedirectToAction("Index");
            }

            var info = await _signInManager.GetExternalLoginInfoAsync();
            if (info == null)
            {
                TempData["ErrorMessage"] = "Error loading external login information.";
                return RedirectToAction("Index");
            }

            // Sign in the user with this external login provider if the user already has a login
            var result = await _signInManager.ExternalLoginSignInAsync(info.LoginProvider, info.ProviderKey, isPersistent: false, bypassTwoFactor: true);
            
            if (result.Succeeded)
            {
                // User successfully signed in, redirect to dashboard
                return RedirectToAction("Index", "Dashboard");
            }
            
            if (result.IsLockedOut)
            {
                TempData["ErrorMessage"] = "Your account has been locked out.";
                return RedirectToAction("Index");
            }
            else
            {
                // If the user does not have an account, create one automatically
                var email = info.Principal.FindFirstValue(ClaimTypes.Email);
                var name = info.Principal.FindFirstValue(ClaimTypes.Name);
                
                if (string.IsNullOrEmpty(email))
                {
                    TempData["ErrorMessage"] = "Unable to retrieve email from Google account.";
                    return RedirectToAction("Index");
                }

                // Create new user automatically
                var user = new User
                {
                    UserName = email, // Use email as username
                    Email = email,
                    CreatedDate = DateTime.Now
                };

                var createResult = await _userManager.CreateAsync(user);
                if (createResult.Succeeded)
                {
                    var addLoginResult = await _userManager.AddLoginAsync(user, info);
                    if (addLoginResult.Succeeded)
                    {
                        await _signInManager.SignInAsync(user, isPersistent: false, info.LoginProvider);
                        
                        // Create legacy user entry for compatibility
                        await CreateLegacyUserAsync(email, "GoogleAuth");
                        
                        TempData["SuccessMessage"] = "Welcome to TodoTaskApp! Your Google account has been linked successfully.";
                        return RedirectToAction("Index", "Dashboard");
                    }
                }
                
                // If account creation failed, show error
                var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                TempData["ErrorMessage"] = $"Account creation failed: {errors}";
                return RedirectToAction("Index");
            }
        }


        // Helper method to create legacy user entry for database compatibility
        private async Task CreateLegacyUserAsync(string username, string password)
        {
            try
            {
                using var connection = _dapperContext.CreateConnection();
                
                // Check if user already exists in legacy table
                var existingUser = await connection.QueryFirstOrDefaultAsync<int>(
                    "sp_CheckUserExists",
                    new { Username = username },
                    commandType: System.Data.CommandType.StoredProcedure
                );

                if (existingUser == 0)
                {
                    // Create new legacy user entry
                    await connection.ExecuteAsync(
                        "sp_CreateLegacyUser",
                        new { Username = username, Password = password, CreatedDate = DateTime.Now },
                        commandType: System.Data.CommandType.StoredProcedure
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating legacy user entry for {Username}", username);
                // Don't throw here - we don't want to break the signup process
            }
        }
    }
}
