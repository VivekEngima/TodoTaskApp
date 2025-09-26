// Todo Forms Module - Form handling and validation functionality
(function() {
    'use strict';

    // Expose to global scope
    window.TodoApp = window.TodoApp || {};
    window.TodoApp.Forms = window.TodoApp.Forms || {};

    // Initialize forms module
    window.TodoApp.Forms.initialize = function() {
        setupFormDefaults();
        injectPermissionStyles();
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

        // Apply role-based restrictions
        applyRoleBasedRestrictions(task);
    };

    // Apply role-based restrictions to the modal
    function applyRoleBasedRestrictions(task) {
        // All users can edit any task - no restrictions
        $('.task-field').prop('disabled', false);
        $('#saveTaskBtn').removeClass('d-none');
        $('#taskModalLabel').html('<i class="fas fa-edit me-2"></i>Edit Task');
        
        // Check if user can assign this task
        if (task.CanAssignTask) {
            $('#assignmentSection').removeClass('d-none');
            showOwnerFeatures();
        } else {
            $('#assignmentSection').addClass('d-none');
            showAssignmentRestrictedMessage(task);
        }
    };

    // Show assignment restricted message
    function showAssignmentRestrictedMessage(task) {
        // Clear any existing forms restriction messages first
        $('#assignmentSection').next('.alert.alert-warning').remove();
        
        // Add a message below the assignment section
        const restrictedMessage = `
            <div class="alert alert-warning mt-3" role="alert">
                <div class="d-flex align-items-center">
                    <i class="fas fa-lock fa-lg me-3 text-warning"></i>
                    <div>
                        <h6 class="alert-heading mb-1">
                            <i class="fas fa-exclamation-triangle me-1"></i>
                            Assignment Restricted
                        </h6>
                        <p class="mb-0">Only the original user who assigned this task can modify assignments.</p>
                    </div>
                </div>
            </div>
        `;
        
        // Insert the message after the assignment section
        $('#assignmentSection').after(restrictedMessage);
    }

    // Show features available to all users
    function showOwnerFeatures() {
        // Enable all form controls for all users
        $('.task-field').prop('disabled', false);
        $('.assignment-control').prop('disabled', false);
        
        // Show delete button in modal footer if not already present
        if (!$('#deleteTaskBtn').length) {
            const deleteBtn = `
                <button type="button" class="btn btn-danger" id="deleteTaskBtn" onclick="deleteTaskFromModal()">
                    <i class="fas fa-trash me-1"></i>Delete Task
                </button>
            `;
            $('#taskModal .modal-footer').prepend(deleteBtn);
        }
    }

    // Show features available to assigned users
    function showAssignedUserFeatures() {
        // Add assigned user badge to modal header
        if (!$('#assignedBadge').length) {
            $('#taskModalLabel').append(' <span id="assignedBadge" class="badge bg-info ms-2">Assigned Task</span>');
        }
        
        // Disable all form controls
        $('.task-field').prop('disabled', true);
        $('.assignment-control').prop('disabled', true);
        
        // Hide delete button if present
        $('#deleteTaskBtn').remove();
        
        // Add assigned user styling
        $('.task-field').addClass('assigned-field');
        $('.modal-header').addClass('assigned-header');
        
        // Show read-only indicators
        $('.task-field').each(function() {
            if (!$(this).siblings('.readonly-indicator').length) {
                $(this).after('<small class="text-muted readonly-indicator">Read-only</small>');
            }
        });
    }

    // Delete task from modal (owner only)
    function deleteTaskFromModal() {
        const taskId = $('#taskId').val();
        if (!taskId || taskId === '0') {
            window.TodoApp.Utils.showAlert('No task selected for deletion', 'warning');
            return;
        }

        if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
            // Call the existing delete function
            if (window.deleteTodoTask) {
                window.deleteTodoTask(taskId);
                // Close modal after deletion
                $('#taskModal').modal('hide');
            } else {
                window.TodoApp.Utils.showAlert('Delete function not available', 'error');
            }
        }
    }

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
        
        // Clear user assignments and reset assignment section
        if (window.TodoApp.Assignments) {
            window.TodoApp.Assignments.resetAssignmentSection();
        }
        
        // Clear permission-based styling and badges
        clearPermissionStyling();
        
        // Reset form for new tasks - all users can edit
        $('.task-field').prop('disabled', false);
        $('#assignmentSection').removeClass('d-none');
        $('#saveTaskBtn').removeClass('d-none');
        $('#taskModalLabel').html('<i class="fas fa-plus me-2"></i>Add New Task');
        
        // Set default values
        setupFormDefaults();
    };

    // Clear permission-based styling and badges
    function clearPermissionStyling() {
        // Remove badges
        $('#ownerBadge').remove();
        $('#assignedBadge').remove();
        
        // Remove styling classes
        $('.task-field').removeClass('owner-field assigned-field');
        $('.modal-header').removeClass('owner-header assigned-header');
        
        // Remove read-only indicators
        $('.readonly-indicator').remove();
        
        // Clear forms restriction messages
        $('#assignmentSection').next('.alert.alert-warning').remove();
        
        // Keep delete button for all users
        // $('#deleteTaskBtn').remove();
    }

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
            } else {
                const invalidChars = desc.match(/[^a-zA-Z0-9\s.,!?()-]/g);
                if (invalidChars) {
                    const unique = [...new Set(invalidChars)].join(", ");
                    $("#taskDescription").addClass("is-invalid");
                    $("#descriptionError")
                        .text(`Invalid character${invalidChars.length > 1 ? "s" : ""}: ${unique}`)
                        .show();
                    isValid = false;
                }
            }
        }

        if (!model.DueDate) {
            $("#taskDueDate").addClass("is-invalid");
            $("#dueDateError").text("Due date is required").show();
            isValid = false;
        }

        // Validate status
        const validStatuses = ['Pending', 'Hold', 'Completed'];
        if (model.Status && !validStatuses.includes(model.Status)) {
            $("#taskStatus").addClass("is-invalid");
            $("#statusError").text(`Invalid status: ${model.Status}. Valid values are: ${validStatuses.join(', ')}`).show();
            isValid = false;
        }

        // Validate priority
        const validPriorities = ['High', 'Normal', 'Low'];
        if (model.Priority && !validPriorities.includes(model.Priority)) {
            $("#taskPriority").addClass("is-invalid");
            $("#priorityError").text(`Invalid priority: ${model.Priority}. Valid values are: ${validPriorities.join(', ')}`).show();
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

    // Inject CSS styles for permission-based features
    function injectPermissionStyles() {
        const styles = `
            <style id="permission-styles">
                /* Delete button styling */
                #deleteTaskBtn {
                    margin-right: auto;
                }
                
                /* Disabled field styling */
                .task-field:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
            </style>
        `;
        
        // Only inject if not already present
        if (!$('#permission-styles').length) {
            $('head').append(styles);
        }
    }

    // Expose functions for external use
    window.TodoApp.Forms.setupFormDefaults = setupFormDefaults;
    window.TodoApp.Forms.deleteTaskFromModal = deleteTaskFromModal;
    window.TodoApp.Forms.clearPermissionStyling = clearPermissionStyling;

})();
