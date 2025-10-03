using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using TodoTaskApp.Data;
using TodoTaskApp.Models;
using Dapper;

namespace TodoTaskApp.Extensions
{
    public static class AuthExtensions
    {
        // Get user ID from login session - maps Identity user to legacy integer ID
        public static int GetUserId(this ClaimsPrincipal user)
        {
            var username = user.GetUsername();
            if (string.IsNullOrEmpty(username))
                return 0;

            // Query the database to get the actual user ID from the legacy Users table
            return GetLegacyUserIdByUsername(username);
        }

        // Get username from login session
        public static string GetUsername(this ClaimsPrincipal user)
        {
            return user.FindFirst(ClaimTypes.Name)?.Value ?? string.Empty;
        }

        // Query database to get legacy user ID by username using stored procedure
        private static int GetLegacyUserIdByUsername(string username)
        {
            try
            {
                // Create a DapperContext to query the database
                var connectionString = GetConnectionString();
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                
                // Use stored procedure to get user ID by username
                var userId = connection.QueryFirstOrDefault<int?>(
                    "sp_GetUserByUsername",
                    new { Username = username },
                    commandType: System.Data.CommandType.StoredProcedure
                );
                
                // Return the user ID if found, otherwise return 0 (invalid user)
                return userId ?? 0;
            }
            catch (Exception)
            {
                // If database query fails, return 0 (invalid user)
                // This prevents the app from crashing but ensures no data leakage
                return 0;
            }
        }

        // Helper method to get connection string from configuration
        private static string GetConnectionString()
        {
            // This is a simplified approach - in a real application you might want to inject IConfiguration
            // For now, we'll use the default connection string pattern
            var builder = new Microsoft.Extensions.Configuration.ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile("appsettings.Development.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables();

            var configuration = builder.Build();
            return configuration.GetConnectionString("DefaultConnection") ?? "";
        }
    }
}