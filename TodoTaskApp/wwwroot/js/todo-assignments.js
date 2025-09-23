// Todo Assignments Module - Task assignment functionality
(function() {
    'use strict';

    // Module variables
    let allUsers = [];

    // Expose to global scope
    window.TodoApp = window.TodoApp || {};
    window.TodoApp.Assignments = window.TodoApp.Assignments || {};

    // Initialize assignments module
    window.TodoApp.Assignments.initialize = function() {
        loadUsersForAssignment();
    };

    // Load users for assignment
    function loadUsersForAssignment() {
        // Show loading spinner
        $("#assignmentLoading").removeClass("d-none");
        $("#userAssignmentList").html('<i class="fas fa-spinner fa-spin"></i> Loading users...');

        // Get list of users from server
        $.ajax({
            url: "/Todo/GetUsersForAssignment",
            type: "GET",
            cache: false,
        })
            .done((response) => {
                allUsers = response.success ? response.data || [] : [];
                populateUserAssignmentList();
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

    // Populate user assignment list
    function populateUserAssignmentList(selectedUserIds = []) {
        const container = $("#userAssignmentList");
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
    window.TodoApp.Assignments.loadTaskAssignments = function(taskId) {
        console.log('TodoApp: Loading task assignments for task:', taskId);
        $("#assignmentLoading").removeClass("d-none");

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
                    populateUserAssignmentList(assignedUserIds);

                    // Show current assignments
                    displayCurrentAssignments(assignments);
                } else {
                    console.error('TodoApp: Failed to load task assignments:', response.message);
                }
            })
            .fail(() => {
                console.error('TodoApp: Error loading task assignments');
                populateUserAssignmentList([]);
            })
            .always(() => $("#assignmentLoading").addClass("d-none"));
    };

    // Expose functions for external use
    window.TodoApp.Assignments.loadUsersForAssignment = loadUsersForAssignment;
    window.TodoApp.Assignments.populateUserAssignmentList = populateUserAssignmentList;
    window.TodoApp.Assignments.displayCurrentAssignments = displayCurrentAssignments;

})();
