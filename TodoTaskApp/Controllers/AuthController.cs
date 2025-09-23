using Microsoft.AspNetCore.Mvc;
using TodoTaskApp.IServices;
using TodoTaskApp.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace TodoTaskApp.Controllers
{
    public class AuthController : Controller
    {
        private readonly IUserService _userService;
        private readonly ILogger<AuthController> _logger;

        // Constructor - gets user service for login/signup
        public AuthController(IUserService userService, ILogger<AuthController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        // Show unified auth page (login and signup side by side)
        [HttpGet]
        public IActionResult Index(string? returnUrl = null)
        {
            ViewBag.ReturnUrl = returnUrl;
            var authViewModel = new AuthViewModel();
            return View(authViewModel);
        }


        // Process login form
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
        {
            ViewBag.ReturnUrl = returnUrl;
            
            _logger.LogInformation("Login attempt for username: {Username}", model.Username);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Login failed - ModelState invalid. Errors: {Errors}", 
                    string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
                
                // Always return to the unified auth page
                var authViewModel = new AuthViewModel { Login = model };
                return View("Index", authViewModel);
            }

            try
            {
                var result = await _userService.LoginAsync(model);

                if (!result.Success)
                {
                    // Check if user doesn't exist and suggest signup
                    if (result.Message.Contains("Invalid username or password"))
                    {
                        var userExists = await _userService.UsernameExistsAsync(model.Username);
                        if (!userExists)
                        {
                            TempData["InfoMessage"] = $"Username '{model.Username}' does not exist. Please create a new account.";
                        }
                        else
                        {
                            TempData["ErrorMessage"] = "Invalid password. Please check your password and try again.";
                        }
                    }
                    else
                    {
                        TempData["ErrorMessage"] = result.Message;
                    }

                    // Always return to the unified auth page
                    var authViewModel = new AuthViewModel { Login = model };
                    return View("Index", authViewModel);
                }

                // Create user session
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, result.User!.Username),
                    new Claim(ClaimTypes.NameIdentifier, result.User.Id.ToString()),
                    new Claim("UserId", result.User.Id.ToString())
                };

                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

                var authProperties = new AuthenticationProperties
                {
                    IsPersistent = false,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddHours(24)
                };

                await HttpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(claimsIdentity),
                    authProperties);

                _logger.LogInformation("User {Username} logged in successfully", result.User.Username);

                // Redirect to return URL or dashboard
                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                {
                    return Redirect(returnUrl);
                }

                return RedirectToAction("Index", "Dashboard");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login process for user {Username}", model.Username);
                
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
            _logger.LogInformation("Signup attempt for username: {Username}", model.Username);
            
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Signup failed - ModelState invalid. Errors: {Errors}", 
                    string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
                
                // Always return to the unified auth page
                var authViewModel = new AuthViewModel { Signup = model };
                return View("Index", authViewModel);
            }

            try
            {
                var result = await _userService.SignupAsync(model);

                if (!result.Success)
                {
                    // Always return to the unified auth page
                    TempData["ErrorMessage"] = result.Message;
                    var authViewModel = new AuthViewModel { Signup = model };
                    return View("Index", authViewModel);
                }

                _logger.LogInformation("New user {Username} registered successfully", result.User!.Username);

                // after successful signup
                var loginModel = new LoginViewModel
                {
                    Username = model.Username,
                    Password = model.Password
                };

                var loginResult = await _userService.LoginAsync(loginModel);

                if (loginResult.Success)
                {
                    // Create authentication claims
                    var claims = new List<Claim>
                    {
                        new Claim(ClaimTypes.Name, loginResult.User!.Username),
                        new Claim(ClaimTypes.NameIdentifier, loginResult.User.Id.ToString()),
                        new Claim("UserId", loginResult.User.Id.ToString())
                    };

                    var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

                    await HttpContext.SignInAsync(
                        CookieAuthenticationDefaults.AuthenticationScheme,
                        new ClaimsPrincipal(claimsIdentity));
                }

                TempData["SuccessMessage"] = "Account created successfully! Welcome to TodoTaskApp!";
                return RedirectToAction("Index", "Dashboard");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during signup process for user {Username}", model.Username);
                
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
                var username = User.Identity?.Name;
                await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return RedirectToAction("Index", "Auth");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout process");
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

                var exists = await _userService.UsernameExistsAsync(username);

                return Json(new
                {
                    available = !exists,
                    message = exists ? "Username is already taken" : "Username is available"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking username availability for {Username}", username);
                return Json(new { available = false, message = "Error checking username" });
            }
        }

        // GET: Auth/AccessDenied
        [HttpGet]
        public IActionResult AccessDenied()
        {
            return View();
        }
    }
}
