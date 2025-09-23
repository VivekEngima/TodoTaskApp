(function () {
    // Global variables
    let monthlyChart = null;
    let priorityChart = null;
    let statusChart = null;

    // Initialize dashboard when DOM is ready
    $(document).ready(function () {
        console.log('Document ready, initializing dashboard...');
        initializeDashboard();
        setupAntiForgeryToken();
    });

    // Dashboard initialization
    async function initializeDashboard() {
        try {
            showLoading();
            await loadDashboardStatistics();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            showError();
        }
    }

    // Show loading state
    function showLoading() {
        $('#loadingSpinner').removeClass('d-none');
        $('#dashboardContent').addClass('d-none');
        $('#errorMessage').addClass('d-none');
    }

    // Show error state
    function showError() {
        $('#loadingSpinner').addClass('d-none');
        $('#dashboardContent').addClass('d-none');
        $('#errorMessage').removeClass('d-none');
    }

    // Show dashboard content
    function showDashboard() {
        $('#loadingSpinner').addClass('d-none');  // Hide loading spinner
        $('#errorMessage').addClass('d-none');    // Hide error message
        $('#dashboardContent').removeClass('d-none'); // Show dashboard content
    }

    // Load dashboard statistics via AJAX
    async function loadDashboardStatistics() {
        try {
            console.log('Loading dashboard statistics...');
            const response = await $.ajax({
                url: '/Dashboard/GetStatistics',
                type: 'GET',
                cache: false
            });

            console.log('Response received:', response);

            if (response.success) {
                console.log('Response successful, calling populateStatistics...');
                populateStatistics(response.data);
                
                console.log('Calling createCharts...');
                createCharts(response.data);
                
                console.log('Calling populateTaskLists...');
                populateTaskLists(response.data);
                
                console.log('Calling showDashboard...');
                showDashboard();
            } else {
                console.error('Error from server:', response.message);
                showError();
            }
        } catch (error) {
            console.error('AJAX error:', error);
            showError();
        }
    }

    // Populate task lists (Recent, Assigned, and Upcoming)
    function populateTaskLists(data) {
        console.log('=== POPULATING TASK LISTS ===');
        console.log('Full data object:', data);
        console.log('RecentTasks:', data.RecentTasks);
        console.log('AssignedTasks:', data.AssignedTasks);
        console.log('UpcomingTasksList:', data.UpcomingTasksList);
        
        populateRecentTasks(data.RecentTasks || []);
        populateAssignedTasks(data.AssignedTasks || []);
        populateUpcomingTasks(data.UpcomingTasksList || []);
        
        // Update task counts in sidebar headers
        updateTaskCounts(data);
    }

    // Update task counts in sidebar headers
    function updateTaskCounts(data) {
        const recentCount = (data.RecentTasks || []).length;
        const assignedCount = (data.AssignedTasks || []).length;
        const upcomingCount = (data.UpcomingTasksList || []).length;
        
        console.log('Updating task counts:', { recentCount, assignedCount, upcomingCount });
        
        // Count badges removed from sidebar
        // $('#recentTasksCount').text(recentCount);
        // $('#assignedTasksCount').text(assignedCount);
        // $('#upcomingTasksCount').text(upcomingCount);
    }

    // Populate recent tasks - Show title and due date side by side
    function populateRecentTasks(tasks) {
        console.log('=== POPULATING RECENT TASKS ===');
        console.log('Tasks array:', tasks);
        console.log('Tasks length:', tasks.length);
        
        const container = document.getElementById('recentTasksList');
        console.log('Container found:', container);
        
        if (!container) {
            console.error('Recent tasks container not found!');
            return;
        }
        
        if (tasks.length === 0) {
            console.log('No recent tasks, showing empty message');
            container.innerHTML = '<div class="text-center text-muted py-3"><small>No recent tasks</small></div>';
            return;
        }

        console.log('Rendering recent tasks...');
        const html = tasks.map(task => {
            console.log('Processing task:', task);
            return `
                <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded task-item" data-task-id="${task.Id}">
                    <div class="fw-medium small">${escapeHtml(task.Title)}</div>
                    <small class="text-muted">${formatDate(task.DueDate)}</small>
                </div>
            `;
        }).join('');
        
        console.log('Generated HTML:', html);
        container.innerHTML = html;
    }

    // Populate assigned tasks - Show title and who assigned it
    function populateAssignedTasks(tasks) {
        console.log('=== POPULATING ASSIGNED TASKS ===');
        console.log('Tasks array:', tasks);
        console.log('Tasks length:', tasks.length);
        
        const container = document.getElementById('assignedTasksList');
        console.log('Container found:', container);
        
        if (!container) {
            console.error('Assigned tasks container not found!');
            return;
        }
        
        if (tasks.length === 0) {
            console.log('No assigned tasks, showing empty message');
            container.innerHTML = '<div class="text-center text-muted py-3"><small>No tasks assigned to you</small></div>';
            return;
        }

        console.log('Rendering assigned tasks...');
        const html = tasks.map(task => {
            console.log('Processing task:', task);
            return `
                <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded task-item" data-task-id="${task.Id}">
                    <div class="fw-medium small">${escapeHtml(task.Title)}</div>
                </div>
            `;
        }).join('');
        
        console.log('Generated HTML:', html);
        container.innerHTML = html;
    }

    // Populate upcoming tasks - Show title and due date side by side
    function populateUpcomingTasks(tasks) {
        console.log('=== POPULATING UPCOMING TASKS ===');
        console.log('Tasks array:', tasks);
        console.log('Tasks length:', tasks.length);
        
        const container = document.getElementById('upcomingTasksList');
        console.log('Container found:', container);
        
        if (!container) {
            console.error('Upcoming tasks container not found!');
            return;
        }
        
        if (tasks.length === 0) {
            console.log('No upcoming tasks, showing empty message');
            container.innerHTML = '<div class="text-center text-muted py-3"><small>No upcoming tasks</small></div>';
            return;
        }

        console.log('Rendering upcoming tasks...');
        const html = tasks.map(task => {
            console.log('Processing task:', task);
            const creatorInfo = task.CreatedByUsername ? `by ${escapeHtml(task.CreatedByUsername)}` : '';
            return `
                <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded task-item" data-task-id="${task.Id}">
                    <div class="fw-medium small">${escapeHtml(task.Title)}</div>
                    <div class="text-end">
                        <small class="text-muted d-block">${formatDate(task.DueDate)}</small>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('Generated HTML:', html);
        container.innerHTML = html;
    }

    // Helper functions
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    }

    function getPriorityBadgeClass(priority) {
        switch (priority) {
            case 'High': return 'bg-danger';
            case 'Normal': return 'bg-secondary';
            case 'Low': return 'bg-info';
            default: return 'bg-secondary';
        }
    }

    function getStatusBadgeClass(status) {
        switch (status) {
            case 'Pending': return 'bg-primary';
            case 'Hold': return 'bg-warning text-dark';
            case 'Completed': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    // Populate statistics cards with data
    function populateStatistics(data) {
        // Set numbers
        $('#totalTasksCount').text(data.TotalTasks);
        $('#upcomingTasksCount').text(data.UpcomingTasks);

        // Update percentages
        $('#completedPercentage').text(data.CompletedPercentage + '%');
        $('#pendingPercentage').text(data.PendingPercentage + '%');

        // Update progress bars 
        $('#completedProgressBar').css('width', data.CompletedPercentage + '%');
        $('#pendingProgressBar').css('width', data.PendingPercentage + '%');

        // Update priority counts and percentages
        $('#highPriorityCount').text(data.HighPriorityTasks);
        $('#normalPriorityCount').text(data.NormalPriorityTasks);
        $('#lowPriorityCount').text(data.LowPriorityTasks);

        $('#highPriorityPercentage').text(data.HighPriorityPercentage + '%');
        $('#normalPriorityPercentage').text(data.NormalPriorityPercentage + '%');
        $('#lowPriorityPercentage').text(data.LowPriorityPercentage + '%');

        // Update status counts and percentages
        $('#pendingTasksCount').text(data.PendingTasks);
        $('#holdTasksCount').text(data.OnHoldTasks);
        $('#completedTasksCount').text(data.CompletedTasks);

        $('#pendingTasksPercentage').text(data.PendingPercentage + '%');
        $('#holdTasksPercentage').text(data.OnHoldPercentage + '%');
        $('#completedTasksPercentage').text(data.CompletedPercentage + '%');
    }

    // Create all charts
    function createCharts(data) {
        createMonthlyChart(data.MonthlyTaskCreation);
        createPriorityChart(data);
        createStatusPieChart(data);
    }

    // Create monthly task creation line chart (15 days before and after today)
    function createMonthlyChart(monthlyData) {
        const ctx = document.getElementById('monthlyChart').getContext('2d');

        // Destroy existing chart if exists
        if (monthlyChart) {
            monthlyChart.destroy();
        }

        monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.map(d => d.DateLabel),
                datasets: [{
                    label: 'Task Activity',
                    data: monthlyData.map(d => d.TasksCreated),
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0d6efd',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, 
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#0d6efd',
                        borderWidth: 1,
                        cornerRadius: 6,
                        displayColors: false,
                        callbacks: {
                            title: function (context) {
                                return context[0].label;
                            },
                            label: function (context) {
                                return `Task Activity: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            stepSize: 1,
                            color: '#6c757d',
                            font: { size: 10 }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6c757d',
                            font: { size: 10 },
                            maxRotation: 45
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Create priority distribution donut chart
    function createPriorityChart(data) {
        const ctx = document.getElementById('priorityChart').getContext('2d');

        // Destroy existing chart if exists
        if (priorityChart) {
            priorityChart.destroy();
        }

        priorityChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['High', 'Normal', 'Low'],
                datasets: [{
                    data: [data.HighPriorityTasks, data.NormalPriorityTasks, data.LowPriorityTasks],
                    backgroundColor: ['#dc3545', '#6c757d', '#0dcaf0'],
                    borderWidth: 0,
                    hoverBorderWidth: 2,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, 
                cutout: '60%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#0d6efd',
                        borderWidth: 1,
                        cornerRadius: 6,
                        displayColors: false,
                        callbacks: {
                            label: function (context) {
                                const percentage = data.TotalTasks > 0 ?
                                    Math.round((context.parsed / data.TotalTasks) * 100) : 0;
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Create status distribution pie chart
    function createStatusPieChart(data) {
        const ctx = document.getElementById('statusChart').getContext('2d');

        // Destroy existing chart if exists
        if (statusChart) {
            statusChart.destroy();
        }

        statusChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Pending', 'Hold', 'Completed'],
                datasets: [{
                    data: [data.PendingTasks, data.OnHoldTasks, data.CompletedTasks],
                    backgroundColor: [
                        'rgba(13, 110, 253, 0.7)',  // Blue for Pending
                        'rgba(255, 193, 7, 0.7)',   // Yellow for Hold
                        'rgba(25, 135, 84, 0.7)'    // Green for Completed
                    ],
                    borderColor: [
                        '#0d6efd',
                        '#ffc107',
                        '#198754'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#ffffff',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 12
                        },
                        padding: 12,
                        caretPadding: 8,
                        callbacks: {
                            title: function (context) {
                                return context[0].label; // Show status name
                            },
                            label: function (context) {
                                const value = context.parsed;
                                const total = data.TotalTasks;
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `Tasks: ${value} (${percentage}%)`;
                            },
                            labelColor: function (context) {
                                return {
                                    borderColor: context.dataset.borderColor[context.dataIndex],
                                    backgroundColor: context.dataset.backgroundColor[context.dataIndex]
                                };
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                hover: {
                    mode: 'nearest',
                    intersect: false
                }
            }
        });
    }

    // Setup anti-forgery token for AJAX requests
    function setupAntiForgeryToken() {
        const token = $('input[name="__RequestVerificationToken"]').val();
        if (token) {
            $.ajaxSetup({
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('RequestVerificationToken', token);
                }
            });
        }
    }

    // Expose refresh function globally if needed
    window.refreshDashboard = function () {
        initializeDashboard();
    };

})();
