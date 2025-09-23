// Todo Forms Module - Form handling and validation functionality
(function() {
    'use strict';

    // Expose to global scope
    window.TodoApp = window.TodoApp || {};
    window.TodoApp.Forms = window.TodoApp.Forms || {};

    // Initialize forms module
    window.TodoApp.Forms.initialize = function() {
        setupFormDefaults();
    };

    // Set up page defaults
    function setupFormDefaults() {
        // Set default due date to one week from today
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 7);
        $("#taskDueDate").val(defaultDueDate.toISOString().split("T")[0]);
    }

    // Populate task form with data
    window.TodoApp.Forms.populateForm = function(task) {
        // Fill form fields with task data
        $("#taskId").val(task.Id);
        $("#taskTitle").val(task.Title);
        $("#taskDescription").val(task.Description);
        $("#taskPriority").val(task.Priority);
        $("#taskStatus").val(task.Status);
        $("#taskDueDate").val(task.DueDate.split("T")[0]);
    };

    // Reset task form
    window.TodoApp.Forms.resetForm = function() {
        // Clear all form fields
        $("#taskForm")[0].reset();
        $("#taskId").val(0);
        // Remove error styling
        $(".is-invalid").removeClass("is-invalid");
        $(".invalid-feedback").hide();
        $("#taskAlert").addClass("d-none");
        $("#currentAssignments").addClass("d-none");
        
        // Clear user assignments
        if (window.TodoApp.Assignments) {
            window.TodoApp.Assignments.populateUserAssignmentList([]);
        }
        
        // Set default values
        setupFormDefaults();
    };

    // Validate task form
    window.TodoApp.Forms.validateForm = function(model) {
        let isValid = true;
        $(".is-invalid").removeClass("is-invalid");
        $(".invalid-feedback").hide();

        const title = model.Title || "";
        if (title.trim() === "") {
            $("#taskTitle").addClass("is-invalid");
            $("#titleError").text("Title is required").show();
            isValid = false;
        } else if (title.length > 100) {
            $("#taskTitle").addClass("is-invalid");
            $("#titleError").text("Title cannot exceed 100 characters").show();
            isValid = false;
        } else {
            const invalidChars = title.match(/[^a-zA-Z0-9 ]/g);
            if (invalidChars) {
                const unique = [...new Set(invalidChars)].join(", ");
                $("#taskTitle").addClass("is-invalid");
                $("#titleError")
                    .text(`Invalid character${invalidChars.length > 1 ? "s" : ""}: ${unique}`)
                    .show();
                isValid = false;
            }
        }

        if (model.Description) {
            const desc = model.Description;
            if (desc.length > 500) {
                $("#taskDescription").addClass("is-invalid");
                $("#descriptionError")
                    .text("Description cannot exceed 500 characters")
                    .show();
                isValid = false;
            }
        }

        if (!model.DueDate) {
            $("#taskDueDate").addClass("is-invalid");
            $("#dueDateError").text("Due date is required").show();
            isValid = false;
        }

        return isValid;
    };

    // Show form errors
    window.TodoApp.Forms.showFormErrors = function(errors) {
        let html = "Please fix the following errors:<br>";
        errors.forEach((error) => (html += "• " + error + "<br>"));
        $("#taskAlert")
            .removeClass("d-none alert-info")
            .addClass("alert-danger")
            .html(html);
    };

    // Expose functions for external use
    window.TodoApp.Forms.setupFormDefaults = setupFormDefaults;

})();
