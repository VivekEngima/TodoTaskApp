// Todo Assignments Module - Task assignment functionality
(function() {
    'use strict';

    // Module variables
    let allUsers = [];
    let isLoadingAssignments = false;

    // Expose to global scope
    window.TodoApp = window.TodoApp || {};
    window.TodoApp.Assignments = window.TodoApp.Assignments || {};

    // Initialize assignments module
    window.TodoApp.Assignments.initialize = function() {
        loadUsersForAssignment().then(() => {
            populateUserAssignmentList();
        });
    };

    // Load users for assignment
    function loadUsersForAssignment() {
        // Show loading spinner
        $("#assignmentLoading").removeClass("d-none");
        $("#userAssignmentList").html('<i class="fas fa-spinner fa-spin"></i> Loading users...');

        // Return a Promise for the AJAX call
        return $.ajax({
            url: "/Todo/GetUsersForAssignment",
            type: "GET",
            cache: false,
        })
            .done((response) => {
                allUsers = response.success ? response.data || [] : [];
                // Don't call populateUserAssignmentList here - let the caller handle it
            })
            .fail((xhr, status, error) => {
                window.TodoApp.Utils.showAlert("Error loading users for assignment", "warning");
                allUsers = [];
                $("#userAssignmentList").html('<i class="fas fa-exclamation-triangle"></i> Error loading users');
            })
            .always(() => {
                $("#assignmentLoading").addClass("d-none");
            });
    }

    // Populate user assignment list with conditional rendering
    function populateUserAssignmentList(selectedUserIds = [], assignmentStatus = null, canAssignTask = true) {
        const container = $("#userAssignmentList");
        
        // Clear any existing content and restriction elements
        container.empty();
        $('.restriction-badge').remove();
        $('.reassignment-blocked-container').remove();
        
        // Clear forms restriction messages (from todo-forms.js)
        $('#assignmentSection').next('.alert.alert-warning').remove();
        
        // Reset assignment section styling
        $("#assignmentSection").removeClass("assignment-restricted");
        
        // Reset assignment section title - only modify the main assignment section label
        const assignmentSection = $("#assignmentSection");
        const mainLabel = assignmentSection.find("> label"); // Only direct child label
        
        // Properly reset the label text by creating a fresh icon and setting clean text
        if (mainLabel.length > 0) {
            mainLabel.html('<i class="bi bi-people me-2 text-primary"></i> Assign to Users');
        }

        // Check if task assignment is restricted
        const isRestricted = !canAssignTask;

        if (isRestricted) {
            // Show "Re-assigning not allowed" message instead of user list
            showReassignmentNotAllowedMessage(assignmentStatus, selectedUserIds);
        } else {
            // Show normal user assignment list
            showUserAssignmentList(selectedUserIds);
        }
    }

    // Show the "Re-assigning not allowed" message
    function showReassignmentNotAllowedMessage(assignmentStatus, selectedUserIds) {
        const container = $("#userAssignmentList");
        
        // Get assigned user names
        const assignedUserNames = assignmentStatus.AssignedUserNames || [];
        const assignedUsersText = assignedUserNames.length > 0 
            ? assignedUserNames.join(', ') 
            : 'Unknown users';

        const reassignmentBlockedHtml = `
            <div class="reassignment-blocked-container">
                    <p class="mb-0 text-muted">
                        <strong>Re-assigning task not allowed</strong>
                    </p>
            </div>
        `;
        
        container.html(reassignmentBlockedHtml);
    }
    // Add new comments element in Action column in todo task beside edit and delete element. Where both task owner and assign task user can both write comments
    // Show normal user assignment list
    function showUserAssignmentList(selectedUserIds = []) {
        const container = $("#userAssignmentList");
        
        // Clear container first to prevent duplicates
        container.empty();

        if (!allUsers.length) {
            container.html('<small class="text-muted"><i class="fas fa-info-circle"></i> No other users available for assignment.</small>');
            return;
        }

        allUsers.forEach(user => {
            const isSelected = selectedUserIds.includes(user.Id);

            const itemHtml = `
                <div class="form-check">
                    <input class="form-check-input assignment-checkbox" type="checkbox" 
                           value="${user.Id}" ${isSelected ? 'checked' : ''}>
                    <label class="form-check-label">
                        ${window.TodoApp.Utils.escapeHtml(user.Username)}
                    </label>
                </div>
            `;
            container.append(itemHtml);
        });
    }

    // Get selected assignment user IDs
    window.TodoApp.Assignments.getSelectedAssignmentIds = function() {
        const selected = $(".assignment-checkbox:checked").map(function() {
            return parseInt($(this).val());
        }).get();
        return selected;
    };

    // Display current assignments (for edit mode)
    function displayCurrentAssignments(assignments) {
        const container = $("#currentAssignmentsList");
        const section = $("#currentAssignments");

        container.empty();

        if (!assignments || !assignments.length) {
            section.addClass("d-none");
            return;
        }

        section.removeClass("d-none");

        assignments.forEach(assignment => {
            const itemHtml = `
                <div class="assignment-item border rounded p-2 mb-2 bg-light">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong><i class="fas fa-user"></i> ${window.TodoApp.Utils.escapeHtml(assignment.AssignedUserName)}</strong>
                            <br>
                            <small class="text-muted">
                                Assigned by ${window.TodoApp.Utils.escapeHtml(assignment.AssignedByUserName)}
                                <br>
                                <i class="fas fa-calendar-alt"></i> ${new Date(assignment.AssignedDate).toLocaleDateString()}
                            </small>
                        </div>
                    </div>
                </div>
            `;
            container.append(itemHtml);
        });
    }

    // Load task assignments for editing
    window.TodoApp.Assignments.loadTaskAssignments = function(taskId, canAssignTask = true) {
        // Prevent multiple simultaneous calls
        if (isLoadingAssignments) {
            return;
        }
        
        isLoadingAssignments = true;
        $("#assignmentLoading").removeClass("d-none");

        // Ensure users are loaded first, then proceed with assignment loading
        if (!allUsers.length) {
            loadUsersForAssignment().then(() => {
                loadTaskAssignmentsInternal(taskId, canAssignTask);
            });
        } else {
            loadTaskAssignmentsInternal(taskId, canAssignTask);
        }
    };

    // Internal function to load task assignments (separated for reusability)
    function loadTaskAssignmentsInternal(taskId, canAssignTask = true) {
        // First get assignment status to check if task can be reassigned
        $.ajax({
            url: "/Todo/GetTaskAssignmentStatus",
            type: "GET",
            data: { taskId: taskId },
            cache: false,
        })
            .done((statusResponse) => {
                if (statusResponse.success) {
                    const status = statusResponse.data;
                    
                    // Then get detailed assignments
                    $.ajax({
                        url: "/Todo/GetTaskAssignments",
                        type: "GET",
                        data: { taskId: taskId },
                        cache: false,
                    })
                        .done((response) => {
                            if (response.success) {
                                const assignments = response.data || [];
                                const assignedUserIds = assignments.map(a => a.AssignedUserId);

                                // Populate assignment checkboxes with current assignments
                                populateUserAssignmentList(assignedUserIds, status, canAssignTask);

                                // Show current assignments
                                displayCurrentAssignments(assignments);
                                
                                // Show assignment restrictions if task is already assigned
                                if (!status.CanBeReassigned) {
                                    showAssignmentRestrictions(status);
                                }
                            }
                        })
                        .fail(() => {
                            populateUserAssignmentList([], null, canAssignTask);
                        })
                        .always(() => {
                            $("#assignmentLoading").addClass("d-none");
                            isLoadingAssignments = false;
                        });
                }
            })
            .fail(() => {
                // Fallback to original behavior if status check fails
                $.ajax({
                    url: "/Todo/GetTaskAssignments",
                    type: "GET",
                    data: { taskId: taskId },
                    cache: false,
                })
                    .done((response) => {
                        if (response.success) {
                            const assignments = response.data || [];
                            const assignedUserIds = assignments.map(a => a.AssignedUserId);

                            // Create a mock status object based on assignments
                            const mockStatus = {
                                TaskId: taskId,
                                IsAssigned: assignments.length > 0,
                                AssignmentCount: assignments.length,
                                AssignedUserIds: assignedUserIds,
                                AssignedUserNames: assignments.map(a => a.AssignedUserName),
                                FirstAssignmentDate: assignments.length > 0 ? assignments[0].AssignedDate : null,
                                CanBeReassigned: assignments.length === 0
                            };

                            // Populate assignment checkboxes with current assignments
                            populateUserAssignmentList(assignedUserIds, mockStatus);

                            // Show current assignments
                            displayCurrentAssignments(assignments);
                        }
                    })
                    .fail(() => {
                        populateUserAssignmentList([]);
                    })
                    .always(() => {
                        $("#assignmentLoading").addClass("d-none");
                        isLoadingAssignments = false;
                    });
            });
    };

    // Show assignment restrictions (updated for conditional rendering)
    function showAssignmentRestrictions(status) {
        // Add a visual indicator to the assignment section
        const assignmentSection = $("#assignmentSection");
        
        // Clear any existing restriction elements first
        $('.restriction-badge').remove();
        
        // Removed assignment locked badges - not needed
        
        // Add visual styling to indicate restriction
        assignmentSection.addClass("assignment-restricted");
        
        // Update the assignment section title to reflect the restriction
        // Only modify the main assignment section label, not the user assignment list labels
        const mainLabel = assignmentSection.find("> label"); // Only direct child label
        if (mainLabel.length > 0) {
            mainLabel.html('<i class="bi bi-people me-2 text-primary"></i> Assignment Status');
        }
    }

    // Reset assignment section for new tasks
    window.TodoApp.Assignments.resetAssignmentSection = function() {
        const assignmentSection = $("#assignmentSection");
        const label = assignmentSection.find("label");
        
        // Remove all restriction elements
        assignmentSection.removeClass("assignment-restricted");
        $('.restriction-badge').remove();
        $('.reassignment-blocked-container').remove();
        
        // Clear forms restriction messages (from todo-forms.js)
        $('#assignmentSection').next('.alert.alert-warning').remove();
        
        // Reset title - only modify the main assignment section label
        const mainLabel = assignmentSection.find("> label"); // Only direct child label
        if (mainLabel.length > 0) {
            mainLabel.html('<i class="bi bi-people me-2 text-primary"></i> Assign to Users');
        }
        
        // Show normal user list
        showUserAssignmentList([]);
    };

    // Expose functions for external use
    window.TodoApp.Assignments.loadUsersForAssignment = loadUsersForAssignment;
    window.TodoApp.Assignments.populateUserAssignmentList = populateUserAssignmentList;
    window.TodoApp.Assignments.displayCurrentAssignments = displayCurrentAssignments;
    window.TodoApp.Assignments.showAssignmentRestrictions = showAssignmentRestrictions;
    window.TodoApp.Assignments.showReassignmentNotAllowedMessage = showReassignmentNotAllowedMessage;
    window.TodoApp.Assignments.showUserAssignmentList = showUserAssignmentList;

})();
