using System.Security.Claims;

namespace TodoTaskApp.Extensions
{
    public static class AuthExtensions
    {
        public static int GetUserId(this ClaimsPrincipal user)
        {
            var userIdClaim = user.FindFirst("UserId");
            return int.TryParse(userIdClaim?.Value, out var userId) ? userId : 0;
        }

        public static string GetUsername(this ClaimsPrincipal user)
        {
            return user.FindFirst(ClaimTypes.Name)?.Value ?? string.Empty;
        }
    }
}