using System.Data;
using Microsoft.Data.SqlClient;

namespace TodoTaskApp.Data
{
    public class DapperContext
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        // Constructor - gets database connection string
        public DapperContext(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ??
                throw new ArgumentNullException(nameof(configuration), "Connection string 'DefaultConnection' not found.");
        }

        // Create database connection
        public IDbConnection CreateConnection()
            => new SqlConnection(_connectionString);
    }
}