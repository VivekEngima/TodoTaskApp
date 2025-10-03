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

    // Clear forms when modals are hidden
    $("#commentsModal").on("hidden.bs.modal", function () {
      clearCommentForms();
    });
  }

  /**
   * Open comments modal for a specific task
   */
  window.openCommentsModal = function (taskId) {
    currentTaskId = taskId;

    // Get task title from the table row
    const taskRow = $(`tr[data-task-id="${taskId}"]`);
    const taskTitle = taskRow.find("strong").first().text().trim();
    currentTaskTitle = taskTitle;

    // Update modal title to include task name
    $("#commentsModalLabel").html(
      `<i class="fas fa-comments me-2"></i>Comments: ${taskTitle}`
    );

    // Clear forms
    clearCommentForms();

    // Load comments
    loadComments(taskId);

    // Show modal
    new bootstrap.Modal(document.getElementById("commentsModal")).show();

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
                        <div style="margin-top: 5px;">
                            <a href="/uploads/comments/${
                              comment.FileName
                            }" target="_blank" style="color: #007bff; text-decoration: none; font-size: 12px;">
                                📎 ${window.TodoApp.Utils.escapeHtml(
                                  comment.FileName
                                )}
                            </a>
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

    if (commentText && commentText.length > 1000) {
      window.TodoApp.Utils.showAlert(
        "Comment cannot exceed 1000 characters",
        "warning"
      );
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
    $("#commentText").val("");
    $("#commentFile").val("");
  }
})();
