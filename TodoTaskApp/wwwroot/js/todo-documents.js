// Todo Documents Module - Document management functionality
(function() {
    'use strict';

    // Module variables
    let currentDocumentTaskId = 0;
    let currentReplaceDocumentId = 0;
    let currentReplaceDocumentName = "";

    // Expose to global scope
    window.TodoApp = window.TodoApp || {};
    window.TodoApp.Documents = window.TodoApp.Documents || {};

    // Initialize documents module
    window.TodoApp.Documents.initialize = function() {
        setupDocumentEventHandlers();
    };

    // Open document modal for a specific task
    window.openDocumentModal = function(taskId) {
        // Check if task ID is valid
        if (!taskId || taskId <= 0) {
            window.TodoApp.Utils.showAlert('Invalid task ID. Please try again.', 'danger');
            return;
        }
        
        // Remember which task we're working with
        currentDocumentTaskId = parseInt(taskId);
        $('#docTaskId').val(taskId);
        
        // Store the task ID as backup
        $('#documentModal').data('taskId', taskId);
        
        // Show the modal popup
        $('#documentModal').modal('show');
        
        // Load documents after modal opens
        setTimeout(() => {
            loadDocumentsForTask(currentDocumentTaskId);
        }, 100);
    };

    // Load documents for a specific task
    function loadDocumentsForTask(taskId) {
        $.ajax({
            url: '/Todo/GetDocuments',
            type: 'GET',
            data: { taskId: taskId },
            success: function(response) {
                if (response.success) {
                    displayDocuments(response.data);
                } else {
                    window.TodoApp.Utils.showAlert('Error loading documents: ' + (response.message || 'Unknown error'), 'danger');
                }
            },
            error: function(xhr, status, error) {
                window.TodoApp.Utils.showAlert('Error loading documents: ' + error, 'danger');
            }
        });
    }

    // Display documents in the modal
    function displayDocuments(documents) {
        const container = $('#documentsContainer');
        const countBadge = $('#documentCountBadge');
        
        // Update document count badge
        countBadge.text(`${documents.length}/5`);
        
        if (documents.length === 0) {
            container.html('<div class="text-center text-muted py-3"><small>No documents uploaded yet</small></div>');
            return;
        }

        let html = '';
        documents.forEach(doc => {
            // Fix property name casing - use DocumentName instead of documentName
            const documentName = doc.DocumentName || doc.documentName || 'Unknown Document';
            const fileSize = doc.FileSize || doc.fileSize || 0;
            const docId = doc.Id || doc.id;
            
            html += `
                <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-file me-2 text-primary"></i>
                        <div class="fw-medium">${window.TodoApp.Utils.escapeHtml(documentName)}</div>
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-sm" onclick="downloadDocument(${docId})" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-outline-warning btn-sm" onclick="replaceDocument(${docId}, '${window.TodoApp.Utils.escapeHtml(documentName)}')" title="Replace">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteDocument(${docId})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.html(html);
    }

    // Download document
    window.downloadDocument = function(documentId) {
        window.open(`/Todo/DownloadDocument?documentId=${documentId}`, '_blank');
    };

    // Replace document
    window.replaceDocument = function(documentId, documentName) {
        currentReplaceDocumentId = documentId;
        currentReplaceDocumentName = documentName;
        $('#currentDocumentName').text(documentName);
        $('#replaceDocumentId').val(documentId);
        $('#replaceDocumentModal').modal('show');
    };

    // Delete document
    window.deleteDocument = function(documentId) {
        if (!confirm('Are you sure you want to delete this document?')) return;

        $.ajax({
            url: '/Todo/DeleteDocument',
            type: 'POST',
            headers: {
                RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val(),
            },
            data: { documentId: documentId },
            success: function(response) {
                if (response.success) {
                    window.TodoApp.Utils.showAlert('Document deleted successfully', 'success');
                    loadDocumentsForTask(currentDocumentTaskId);
                    if (window.TodoApp.Core && window.TodoApp.Core.loadAllTodos) {
                        window.TodoApp.Core.loadAllTodos(); // Refresh task list to update document count
                    }
                } else {
                    window.TodoApp.Utils.showAlert(response.message || 'Error deleting document', 'danger');
                }
            },
            error: function() {
                window.TodoApp.Utils.showAlert('Error deleting document', 'danger');
            }
        });
    };

    // Setup document modal event handlers
    function setupDocumentEventHandlers() {
        // Remove any existing event handlers to prevent duplicates
        $('#documentUploadForm').off('submit');
        $('#replaceDocumentForm').off('submit');
        $('#documentModal').off('hidden.bs.modal');
        $('#replaceDocumentModal').off('hidden.bs.modal');
        
        // Document upload form
        $('#documentUploadForm').on('submit', function(e) {
            e.preventDefault();
            uploadDocuments();
        });

        // Replace document form
        $('#replaceDocumentForm').on('submit', function(e) {
            e.preventDefault();
            replaceDocumentFile();
        });

        // Document modal close
        $('#documentModal').on('hidden.bs.modal', function() {
            $('#documentFile').val('');
            $('#documentsContainer').html('');
            currentDocumentTaskId = 0; // Reset the current document task ID
            $('#documentModal').removeData('taskId'); // Clear backup task ID
        });

        // Replace modal close
        $('#replaceDocumentModal').on('hidden.bs.modal', function() {
            $('#replaceDocumentFile').val('');
        });
    }

    // Upload documents
    function uploadDocuments() {
        const fileInput = $('#documentFile')[0];
        const files = fileInput.files;
        
        if (files.length === 0) {
            window.TodoApp.Utils.showAlert('Please select files to upload', 'warning');
            return;
        }

        // Validate TaskId before proceeding - use backup if main is reset
        let taskIdToUse = currentDocumentTaskId;
        if (!taskIdToUse || taskIdToUse <= 0) {
            // Try to get from modal data attribute as backup
            taskIdToUse = $('#documentModal').data('taskId');
        }
        
        if (!taskIdToUse || taskIdToUse <= 0) {
            window.TodoApp.Utils.showAlert('Invalid task ID. Please close the modal and try again.', 'danger');
            return;
        }

        // Check if adding these files would exceed the 5 document limit
        const currentDocCount = $('#documentsContainer .d-flex').length;
        if (currentDocCount + files.length > 5) {
            window.TodoApp.Utils.showAlert('Maximum 5 documents allowed per task', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('TaskId', taskIdToUse);
        
        for (let i = 0; i < files.length; i++) {
            formData.append('Files', files[i]);
        }

        // Show loading state
        const uploadBtn = $('#uploadBtn');
        const originalHtml = uploadBtn.html();
        uploadBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Uploading...');

        // Store the task ID in a local variable to prevent it from being reset
        const taskIdForUpload = taskIdToUse;
        
        $.ajax({
            url: '/Todo/UploadDocuments',
            type: 'POST',
            headers: {
                RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val(),
            },
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    window.TodoApp.Utils.showAlert('Documents uploaded successfully', 'success');
                    // Use the stored task ID instead of currentDocumentTaskId
                    loadDocumentsForTask(taskIdForUpload);
                    if (window.TodoApp.Core && window.TodoApp.Core.loadAllTodos) {
                        window.TodoApp.Core.loadAllTodos(); // Refresh task list to update document count
                    }
                    $('#documentFile').val('');
                    // Do NOT close the modal - let user close it manually
                } else {
                    window.TodoApp.Utils.showAlert(response.message || 'Error uploading documents', 'danger');
                }
            },
            error: function(xhr, status, error) {
                window.TodoApp.Utils.showAlert('Error uploading documents: ' + error, 'danger');
            },
            complete: function() {
                uploadBtn.prop('disabled', false).html(originalHtml);
            }
        });
    }

    // Replace document file
    function replaceDocumentFile() {
        const fileInput = $('#replaceDocumentFile')[0];
        const file = fileInput.files[0];
        
        if (!file) {
            window.TodoApp.Utils.showAlert('Please select a file to replace', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('documentId', currentReplaceDocumentId);
        formData.append('newFile', file);

        // Show loading state
        const replaceBtn = $('#replaceDocumentModal .btn-primary');
        const originalHtml = replaceBtn.html();
        replaceBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Replacing...');

        $.ajax({
            url: '/Todo/ReplaceDocument',
            type: 'POST',
            headers: {
                RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val(),
            },
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    window.TodoApp.Utils.showAlert('Document replaced successfully', 'success');
                    loadDocumentsForTask(currentDocumentTaskId);
                    if (window.TodoApp.Core && window.TodoApp.Core.loadAllTodos) {
                        window.TodoApp.Core.loadAllTodos(); // Refresh task list to update document count
                    }
                    $('#replaceDocumentModal').modal('hide');
                    $('#replaceDocumentFile').val('');
                } else {
                    window.TodoApp.Utils.showAlert(response.message || 'Error replacing document', 'danger');
                }
            },
            error: function() {
                window.TodoApp.Utils.showAlert('Error replacing document', 'danger');
            },
            complete: function() {
                replaceBtn.prop('disabled', false).html(originalHtml);
            }
        });
    }

    // Expose functions for external use
    window.TodoApp.Documents.loadDocumentsForTask = loadDocumentsForTask;
    window.TodoApp.Documents.displayDocuments = displayDocuments;
    window.TodoApp.Documents.uploadDocuments = uploadDocuments;
    window.TodoApp.Documents.replaceDocumentFile = replaceDocumentFile;

})();
