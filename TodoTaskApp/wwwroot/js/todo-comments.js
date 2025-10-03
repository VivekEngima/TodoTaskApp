/**
 * Todo Comments Module
 * Handles comment functionality for tasks
 */
(function () {
  "use strict";

  // Module variables
  let currentTaskId = 0;
  let currentTaskTitle = "";

  // Expose to global scope
  window.TodoApp = window.TodoApp || {};
  window.TodoApp.Comments = window.TodoApp.Comments || {};

  // Expose addComment function globally for testing
  window.testAddComment = function () {
    console.log("Testing addComment function directly...");
    addComment();
  };

  /**
   * Initialize comments module
   */
  window.TodoApp.Comments.initialize = function () {
    setupCommentEventHandlers();
  };

  /**
   * Setup comment event handlers
   */
  function setupCommentEventHandlers() {
    // Use event delegation for the add comment button (works even if button doesn't exist yet)
    $(document).on("click", "#addCommentBtn", function (e) {
      e.preventDefault();
      e.stopPropagation();
      addComment();
      return false;
    });

    // Character count for add comment textarea
    $(document).on("input", "#commentText", function () {
      // Character count removed as per user request
    });

    // File input change handler
    $(document).on("change", "#commentFile", function () {
      const file = this.files[0];
      const filePreview = $("#filePreview");
      const fileName = $("#fileName");

      if (file) {
        fileName.text(file.name);
        filePreview.show();
      } else {
        filePreview.hide();
      }

      // Update button state based on content
      updateAddButtonState();
    });

    // Text input change handler for real-time validation
    $(document).on("input", "#commentText", function () {
      updateAddButtonState();
    });

    // Clear forms when modals are hidden
    $("#commentsModal").on("hidden.bs.modal", function () {
      clearCommentForms();
    });
  }

  /**
   * Function to update add button state
   */
  function updateAddButtonState() {
    console.log("updateAddButtonState called");
    const commentText = $("#commentText").val().trim();
    const fileInput = document.getElementById("commentFile");
    const file = fileInput.files[0];
    const addButton = $("#addCommentBtn");

    console.log("Comment text:", commentText);
    console.log("File:", file);
    console.log("Add button found:", addButton.length);

    // Enable button if there's meaningful content or a file
    const hasContent = (commentText && commentText.length > 0) || file;

    if (hasContent) {
      addButton.prop("disabled", false).css("opacity", "1");
    } else {
      addButton.prop("disabled", true).css("opacity", "0.6");
    }
    console.log("updateAddButtonState completed");
  }

  /**
   * Open comments modal for a specific task
   */
  window.openCommentsModal = function (taskId) {
    console.log("openCommentsModal called with taskId:", taskId);

    currentTaskId = taskId;

    // Get task title from the table row
    const taskRow = $(`tr[data-task-id="${taskId}"]`);
    const taskTitle = taskRow.find("strong").first().text().trim();
    currentTaskTitle = taskTitle;

    console.log("Task title:", taskTitle);

    // Update modal title to include task name
    $("#commentsModalLabel").html(
      `<i class="fas fa-comments me-2"></i>Comments: ${taskTitle}`
    );

    // Clear forms
    clearCommentForms();

    // Load comments
    loadComments(taskId);

    // Show modal
    console.log("Showing modal...");
    new bootstrap.Modal(document.getElementById("commentsModal")).show();

    // Initialize button state
    setTimeout(() => {
      updateAddButtonState();
    }, 100);

    // Ensure button has correct attributes after modal is shown
    setTimeout(() => {
      const button = $("#addCommentBtn");
      if (button.length === 0) {
        // Find the submit button and fix it
        const submitButton = $("#commentsModal button[type='submit']");
        if (submitButton.length > 0) {
          submitButton.attr("type", "button");
          submitButton.attr("id", "addCommentBtn");
        }

        // Also look for any button with "Add Comment" text
        const addCommentButtons = $("button:contains('Add Comment')");
        addCommentButtons.each(function (i, btn) {
          if (!btn.id) {
            $(btn).attr("id", "addCommentBtn");
            $(btn).attr("type", "button");
          }
        });
      }
    }, 500);
  };

  /**
   * Load comments for a task
   */
  function loadComments(taskId) {
    $("#commentsList").html(`
            <div class="text-center text-muted py-4">
                <i class="fas fa-spinner fa-spin"></i> Loading comments...
            </div>
        `);

    $.ajax({
      url: `/Todo/GetTaskComments?taskId=${taskId}`,
      type: "GET",
      cache: false,
    })
      .done(function (response) {
        if (response.success) {
          displayComments(response.data);
        } else {
          $("#commentsList").html(`
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        ${response.message || "Error loading comments"}
                    </div>
                `);
        }
      })
      .fail(function (xhr, status, error) {
        $("#commentsList").html(`
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Error loading comments. Please try again.
                </div>
            `);
      });
  }

  /**
   * Display comments in the modal
   */
  function displayComments(comments) {
    if (!comments || comments.length === 0) {
      $("#commentsList").html(`
                <div class="text-center text-muted py-4">
                    <i class="fas fa-comment-slash fa-2x mb-2 d-block"></i>
                    No comments yet. Be the first to add a comment!
                </div>
            `);
      return;
    }

    let commentsHtml = "";
    comments.forEach(function (comment) {
      const createdDate = new Date(comment.CreatedDate);
      const updatedDate = comment.UpdatedDate
        ? new Date(comment.UpdatedDate)
        : null;

      commentsHtml += `
                <div class="comment-item" data-comment-id="${comment.Id}">
                    <div class="comment-meta">
                        <span style="font-weight: bold; color: #333;">${window.TodoApp.Utils.escapeHtml(
                          comment.Username
                        )}</span>
                        <span style="float: right; color: #666; font-size: 11px;">
                            ${window.TodoApp.Utils.formatDate(createdDate)}
                            ${
                              updatedDate
                                ? ` (edited ${window.TodoApp.Utils.formatDate(
                                    updatedDate
                                  )})`
                                : ""
                            }
                        </span>
                        <div style="clear: both;"></div>
                    </div>
                    <div class="comment-text">
                        ${window.TodoApp.Utils.escapeHtml(
                          comment.Comment
                        ).replace(/\n/g, "<br>")}
                    </div>
                    ${
                      comment.FileName
                        ? `
                        <div class="comment-file-attachment">
                            <div class="comment-file-info">
                                <i class="fas fa-paperclip" style="color: #007bff; font-size: 14px;"></i>
                                <div class="comment-file-details">
                                    <div class="comment-file-name">
                                        ${window.TodoApp.Utils.escapeHtml(
                                          getOriginalFileName(comment.FileName)
                                        )}
                                    </div>
                                    <div class="comment-file-type">
                                        ${getFileTypeIcon(
                                          comment.FileName
                                        )} ${getFileTypeName(comment.FileName)}
                                    </div>
                                </div>
                                <a href="/Todo/DownloadCommentFile?fileName=${encodeURIComponent(
                                  comment.FileName
                                )}" 
                                   download="${encodeURIComponent(
                                     getOriginalFileName(comment.FileName)
                                   )}"
                                   class="comment-file-download-btn">
                                    <i class="fas fa-download me-1"></i>Download
                                </a>
                            </div>
                        </div>
                    `
                        : ""
                    }
                </div>
            `;
    });

    $("#commentsList").html(commentsHtml);

    // Auto-scroll to bottom for chat-like experience
    const commentsContainer = document.getElementById("commentsList");
    commentsContainer.scrollTop = commentsContainer.scrollHeight;
  }

  /**
   * Add a new comment
   */
  function addComment() {
    const commentText = $("#commentText").val().trim();
    const fileInput = document.getElementById("commentFile");
    const file = fileInput.files[0];

    if (!commentText && !file) {
      window.TodoApp.Utils.showAlert(
        "Please enter a comment or select a file",
        "warning"
      );
      return;
    }

    // Additional validation: if there's only whitespace in comment text
    if (commentText && commentText.trim().length === 0 && !file) {
      window.TodoApp.Utils.showAlert(
        "Please enter a meaningful comment or select a file",
        "warning"
      );
      return;
    }

    if (commentText && commentText.length > 1000) {
      window.TodoApp.Utils.showAlert(
        "Comment cannot exceed 1000 characters",
        "warning"
      );
      return;
    }

    // Check file size (5MB limit)
    if (file && file.size > 5 * 1024 * 1024) {
      window.TodoApp.Utils.showAlert("File size cannot exceed 5MB", "warning");
      return;
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("TaskId", currentTaskId);
    formData.append("Comment", commentText || "");

    if (file) {
      formData.append("File", file);
    }

    $.ajax({
      url: "/Todo/CreateComment",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
    })
      .done(function (response) {
        if (response.success) {
          $("#commentText").val("");
          $("#commentFile").val("");
          $("#filePreview").hide();
          displayComments(response.data);
          window.TodoApp.Utils.showAlert(
            "Comment added successfully",
            "success"
          );
        } else {
          window.TodoApp.Utils.showAlert(
            response.message || "Failed to add comment",
            "danger"
          );
        }
      })
      .fail(function (xhr, status, error) {
        window.TodoApp.Utils.showAlert(
          "Error adding comment. Please try again.",
          "danger"
        );
      });
  }

  /**
   * Clear comment forms
   */
  function clearCommentForms() {
    console.log("clearCommentForms called");
    $("#commentText").val("");
    $("#commentFile").val("");
    $("#filePreview").hide();
    console.log("About to call updateAddButtonState");
    updateAddButtonState();
    console.log("updateAddButtonState completed");
  }

  /**
   * Get original filename by removing timestamp suffix
   */
  function getOriginalFileName(fileName) {
    if (!fileName) return fileName;

    // Remove the timestamp suffix that was added during upload
    // Format: originalname_yyyyMMdd_HHmmss.ext
    const lastUnderscoreIndex = fileName.lastIndexOf("_");
    if (lastUnderscoreIndex > 0) {
      const beforeLastUnderscore = fileName.substring(0, lastUnderscoreIndex);
      const afterLastUnderscore = fileName.substring(lastUnderscoreIndex + 1);

      // Check if the part after last underscore looks like a timestamp (yyyyMMdd_HHmmss)
      if (
        afterLastUnderscore.length >= 15 &&
        afterLastUnderscore.includes("_")
      ) {
        const parts = afterLastUnderscore.split("_");
        if (
          parts.length === 2 &&
          parts[0].length === 8 &&
          parts[1].length === 6
        ) {
          const extension = fileName.substring(fileName.lastIndexOf("."));
          return beforeLastUnderscore + extension;
        }
      }
    }

    return fileName; // Return as-is if we can't parse the timestamp
  }

  /**
   * Get file type icon based on file extension
   */
  function getFileTypeIcon(fileName) {
    if (!fileName) return "📄";

    const extension = fileName.toLowerCase().split(".").pop();
    switch (extension) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "txt":
        return "📄";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "🖼️";
      case "zip":
      case "rar":
        return "📦";
      case "xls":
      case "xlsx":
        return "📊";
      case "ppt":
      case "pptx":
        return "📊";
      default:
        return "📄";
    }
  }

  /**
   * Get file type name based on file extension
   */
  function getFileTypeName(fileName) {
    if (!fileName) return "File";

    const extension = fileName.toLowerCase().split(".").pop();
    switch (extension) {
      case "pdf":
        return "PDF Document";
      case "doc":
        return "Word Document";
      case "docx":
        return "Word Document";
      case "txt":
        return "Text File";
      case "jpg":
      case "jpeg":
        return "JPEG Image";
      case "png":
        return "PNG Image";
      case "gif":
        return "GIF Image";
      case "zip":
        return "ZIP Archive";
      case "rar":
        return "RAR Archive";
      case "xls":
        return "Excel Spreadsheet";
      case "xlsx":
        return "Excel Spreadsheet";
      case "ppt":
        return "PowerPoint Presentation";
      case "pptx":
        return "PowerPoint Presentation";
      default:
        return "File";
    }
  }
})();
