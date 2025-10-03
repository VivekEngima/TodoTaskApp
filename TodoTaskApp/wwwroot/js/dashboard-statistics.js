// Dashboard Statistics Module - Statistics display functionality
(function() {
    'use strict';

    // Expose to global scope
    window.TodoApp = window.TodoApp || {};
    window.TodoApp.Dashboard = window.TodoApp.Dashboard || {};
    window.TodoApp.Dashboard.Statistics = window.TodoApp.Dashboard.Statistics || {};

    // Populate statistics cards with data
    window.TodoApp.Dashboard.Statistics.populateStatistics = function(data) {
        // Show total task counts
        $('#totalTasksCount').text(data.TotalTasks);
        $('#upcomingTasksCount').text(data.UpcomingTasks);

        // Show completion percentages
        $('#completedPercentage').text(data.CompletedPercentage + '%');
        $('#pendingPercentage').text(data.PendingPercentage + '%');

        // Make progress bars wider based on percentage
        $('#completedProgressBar').css('width', data.CompletedPercentage + '%');
        $('#pendingProgressBar').css('width', data.PendingPercentage + '%');

        // Show priority task counts
        $('#highPriorityCount').text(data.HighPriorityTasks);
        $('#normalPriorityCount').text(data.NormalPriorityTasks);
        $('#lowPriorityCount').text(data.LowPriorityTasks);

        // Show priority percentages
        $('#highPriorityPercentage').text(data.HighPriorityPercentage + '%');
        $('#normalPriorityPercentage').text(data.NormalPriorityPercentage + '%');
        $('#lowPriorityPercentage').text(data.LowPriorityPercentage + '%');

        // Show status counts
        $('#pendingTasksCount').text(data.PendingTasks);
        $('#holdTasksCount').text(data.OnHoldTasks);
        $('#completedTasksCount').text(data.CompletedTasks);

        // Show status percentages
        $('#pendingTasksPercentage').text(data.PendingPercentage + '%');
        $('#holdTasksPercentage').text(data.OnHoldPercentage + '%');
        $('#completedTasksPercentage').text(data.CompletedPercentage + '%');
    };

    // Show loading state
    window.TodoApp.Dashboard.Statistics.showLoading = function() {
        $('#loadingSpinner').removeClass('d-none'); // Show spinner
        $('#dashboardContent').addClass('d-none'); // Hide content
        $('#errorMessage').addClass('d-none'); // Hide errors
    };

    // Show error state
    window.TodoApp.Dashboard.Statistics.showError = function() {
        $('#loadingSpinner').addClass('d-none'); // Hide spinner
        $('#dashboardContent').addClass('d-none'); // Hide content
        $('#errorMessage').removeClass('d-none'); // Show error
    };

    // Show dashboard content
    window.TodoApp.Dashboard.Statistics.showDashboard = function() {
        $('#loadingSpinner').addClass('d-none');  // Hide loading spinner
        $('#errorMessage').addClass('d-none');    // Hide error message
        $('#dashboardContent').removeClass('d-none'); // Show dashboard content
    };

    // Load dashboard statistics via AJAX
    window.TodoApp.Dashboard.Statistics.loadDashboardStatistics = function() {
        return new Promise((resolve, reject) => {
            try {
                $.ajax({
                    url: '/Dashboard/GetStatistics',
                    type: 'GET',
                    cache: false
                })
                .done((response) => {
                    if (response.success) {
                        resolve(response.data);
                    } else {
                        reject(new Error(response.message));
                    }
                })
                .fail((error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    };

})();
