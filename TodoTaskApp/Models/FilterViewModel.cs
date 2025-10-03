// Models/FilterViewModel.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TodoTaskApp.Models
{
    public class FilterViewModel
    {
        [Display(Name = "Status")]
        public string? Status { get; set; }

        [Display(Name = "Priority")]
        public string? Priority { get; set; }

        [Display(Name = "Search Term")]
        [StringLength(100)]
        public string? SearchTerm { get; set; }

        // Add these two properties:
        [Display(Name = "Start Date")]
        [DataType(DataType.Date)]
        public DateTime? StartDate { get; set; }

        [Display(Name = "End Date")]
        [DataType(DataType.Date)]
        public DateTime? EndDate { get; set; }

        // Helper lists for dropdowns
        public List<string> StatusOptions { get; set; } = new() { "Pending", "Hold", "Completed" };
        public List<string> PriorityOptions { get; set; } = new() { "High", "Normal", "Low" };

        public IEnumerable<string> Priorities { get; set; } = new List<string>();
        public IEnumerable<string> Statuses { get; set; } = new List<string>();
    }
}
