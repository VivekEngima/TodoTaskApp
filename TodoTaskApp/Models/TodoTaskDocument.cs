using System.ComponentModel.DataAnnotations;

namespace TodoTaskApp.Models
{
    public class TodoTaskDocument
    {
        public int Id { get; set; }

        [Required]
        public int TaskId { get; set; }

        [Required]
        [StringLength(255)]
        public string DocumentName { get; set; } = string.Empty;

        [Required]
        public byte[] DocumentData { get; set; } = Array.Empty<byte>();

        [Required]
        public long FileSize { get; set; }

        [Required]
        [StringLength(100)]
        public string ContentType { get; set; } = string.Empty;

        public DateTime UploadDate { get; set; } = DateTime.Now;
    }

    public class DocumentUploadViewModel
    {
        public int TaskId { get; set; }
        public IFormFile File { get; set; } = null!;
    }

    public class DocumentViewModel
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public string DocumentName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string ContentType { get; set; } = string.Empty;
        public DateTime UploadDate { get; set; }
        public string FileSizeFormatted => FormatFileSize(FileSize);

        private static string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }
    }
}
