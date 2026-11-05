/**
 * Library Management Dashboard
 * Pure Vanilla JavaScript implementation
 * Features: Complete CRUD (Create, Read, Update, Delete) with localStorage
 */

// Key used for saving books array in browser localStorage
const STORAGE_KEY = 'library_dashboard_books';

// Initial sample catalog provided on first run
const DEFAULT_BOOKS = [
  {
    id: 'BK-101',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    category: 'Fiction'
  },
  {
    id: 'BK-102',
    title: 'Clean Code: A Handbook of Agile Software',
    author: 'Robert C. Martin',
    category: 'Technology'
  },
  {
    id: 'BK-103',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    category: 'Science'
  },
  {
    id: 'BK-104',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    category: 'History'
  },
  {
    id: 'BK-105',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    category: 'Philosophy'
  }
];

// Application State
let books = [];
let editingBookId = null; // null when in 'Add' mode, stores id string when in 'Edit' mode
let pendingDeleteId = null; // stores id string of book awaiting delete confirmation

// DOM Elements: Form & Add/Edit Modal
const bookModal = document.getElementById('bookModal');
const bookModalTitle = document.getElementById('bookModalTitle');
const bookModalTag = document.getElementById('bookModalTag');
const bookForm = document.getElementById('bookForm');
const bookIdInput = document.getElementById('bookId');
const bookTitleInput = document.getElementById('bookTitle');
const bookAuthorInput = document.getElementById('bookAuthor');
const bookCategorySelect = document.getElementById('bookCategory');
const submitBtn = document.getElementById('submitBtn');
const submitBtnText = document.getElementById('submitBtnText');
const closeBookModalBtn = document.getElementById('closeBookModalBtn');
const cancelBookModalBtn = document.getElementById('cancelBookModalBtn');

// Add Book Trigger Button (Single button on the table toolbar)
const openAddModalBtn = document.getElementById('openAddModalBtn');

// Table & Filter DOM Elements
const booksTableBody = document.getElementById('booksTableBody');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const emptyState = document.getElementById('emptyState');
const recordCountText = document.getElementById('recordCountText');
const resetDemoBtn = document.getElementById('resetDemoBtn');

// Stat DOM Elements
const statTotalBooks = document.getElementById('statTotalBooks');
const statTotalCategories = document.getElementById('statTotalCategories');

// View Modal Elements
const viewModal = document.getElementById('viewModal');
const closeViewModalBtn = document.getElementById('closeViewModalBtn');
const closeViewModalFooterBtn = document.getElementById('closeViewModalFooterBtn');
const modalEditBtn = document.getElementById('modalEditBtn');
const viewBookId = document.getElementById('viewBookId');
const viewModalTitle = document.getElementById('viewModalTitle');
const viewBookAuthor = document.getElementById('viewBookAuthor');
const viewBookCategory = document.getElementById('viewBookCategory');

// Delete Modal Elements
const deleteModal = document.getElementById('deleteModal');
const deleteBookTitle = document.getElementById('deleteBookTitle');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const toastContainer = document.getElementById('toastContainer');

// ============================================================================
// Initialization & LocalStorage Management
// ============================================================================

/**
 * Initializes the dashboard on page load
 */
function initDashboard() {
  loadBooks();
  setupEventListeners();
  renderBooks();
  updateStats();
}

/**
 * Loads books from localStorage or sets default seed data
 */
function loadBooks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      books = JSON.parse(stored);
    } else {
      // First time loading - populate with default sample books
      books = [...DEFAULT_BOOKS];
      saveBooks();
    }
  } catch (err) {
    console.error('Error reading from localStorage:', err);
    books = [...DEFAULT_BOOKS];
  }
}

/**
 * Persists the current books array to localStorage
 */
function saveBooks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (err) {
    console.error('Error writing to localStorage:', err);
    showToast('Failed to save to localStorage.', 'error');
  }
}

// ============================================================================
// Event Listeners Setup
// ============================================================================

function setupEventListeners() {
  // Single Add Book Button click (Opens modal in Add Mode)
  if (openAddModalBtn) {
    openAddModalBtn.addEventListener('click', openAddModal);
  }

  // Close Add/Edit Modal controls
  closeBookModalBtn.addEventListener('click', closeBookModal);
  cancelBookModalBtn.addEventListener('click', closeBookModal);
  bookModal.addEventListener('click', (e) => {
    if (e.target === bookModal) closeBookModal();
  });

  // Form submission (Add or Update)
  bookForm.addEventListener('submit', handleFormSubmit);

  // Real-time search and filter
  searchInput.addEventListener('input', () => renderBooks());
  categoryFilter.addEventListener('change', () => renderBooks());

  // Reset sample data button
  resetDemoBtn.addEventListener('click', handleResetDefaultData);

  // View modal controls
  closeViewModalBtn.addEventListener('click', closeViewModal);
  closeViewModalFooterBtn.addEventListener('click', closeViewModal);
  viewModal.addEventListener('click', (e) => {
    if (e.target === viewModal) closeViewModal();
  });

  // Delete modal controls
  confirmDeleteBtn.addEventListener('click', confirmDelete);
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });

  // Keyboard navigation: Escape key closes any active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBookModal();
      closeViewModal();
      closeDeleteModal();
    }
  });
}

// ============================================================================
// Add / Edit Modal Controls
// ============================================================================

/**
 * Opens modal configured for adding a new book
 */
function openAddModal() {
  editingBookId = null;
  resetForm();

  bookModalTag.textContent = 'Catalog Management';
  bookModalTitle.textContent = 'Add New Book';
  submitBtnText.textContent = 'Add Book';

  bookModal.classList.add('active');
  bookModal.setAttribute('aria-hidden', 'false');

  // Focus the first input after modal displays
  setTimeout(() => {
    bookIdInput.focus();
  }, 100);
}

/**
 * Opens modal configured for editing an existing book
 */
function startEditBook(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;

  editingBookId = book.id;

  // Fill in form values
  bookIdInput.value = book.id;
  bookTitleInput.value = book.title;
  bookAuthorInput.value = book.author;
  bookCategorySelect.value = book.category;

  // Update modal titles
  bookModalTag.textContent = 'Update Book Information';
  bookModalTitle.textContent = 'Edit Book';
  submitBtnText.textContent = 'Update Book';

  clearErrors();

  bookModal.classList.add('active');
  bookModal.setAttribute('aria-hidden', 'false');

  setTimeout(() => {
    bookTitleInput.focus();
  }, 100);
}

/**
 * Closes the Add/Edit modal dialog
 */
function closeBookModal() {
  bookModal.classList.remove('active');
  bookModal.setAttribute('aria-hidden', 'true');
  editingBookId = null;
  resetForm();
}

/**
 * Validates form fields and handles both Add and Update actions
 */
function handleFormSubmit(e) {
  e.preventDefault();
  clearErrors();

  const id = bookIdInput.value.trim();
  const title = bookTitleInput.value.trim();
  const author = bookAuthorInput.value.trim();
  const category = bookCategorySelect.value;

  // Basic Validation
  let isValid = true;

  if (!id) {
    showFieldError('bookIdError', 'Please enter a Book ID.');
    isValid = false;
  }

  if (!title) {
    showFieldError('bookTitleError', 'Please enter the book title.');
    isValid = false;
  }

  if (!author) {
    showFieldError('bookAuthorError', 'Please enter the author name.');
    isValid = false;
  }

  if (!category) {
    showFieldError('bookCategoryError', 'Please select a category.');
    isValid = false;
  }

  if (!isValid) return;

  if (editingBookId) {
    // -------------------------------------------------------------
    // UPDATE OPERATION
    // -------------------------------------------------------------
    const bookIndex = books.findIndex(b => b.id.toLowerCase() === editingBookId.toLowerCase());
    
    if (bookIndex === -1) {
      showToast('Book to edit was not found.', 'error');
      closeBookModal();
      return;
    }

    // Check if new ID collides with another book
    const duplicateId = books.some(
      (b, idx) => idx !== bookIndex && b.id.toLowerCase() === id.toLowerCase()
    );

    if (duplicateId) {
      showFieldError('bookIdError', `Book ID "${id}" is already assigned to another book.`);
      return;
    }

    // Update the book entry
    books[bookIndex] = {
      id: id,
      title: title,
      author: author,
      category: category
    };

    saveBooks();
    renderBooks();
    updateStats();
    closeBookModal();
    showToast(`Book "${title}" was updated successfully!`, 'success');

  } else {
    // -------------------------------------------------------------
    // CREATE OPERATION (ADD NEW BOOK)
    // -------------------------------------------------------------
    // Check if Book ID is already used
    const idExists = books.some(b => b.id.toLowerCase() === id.toLowerCase());
    if (idExists) {
      showFieldError('bookIdError', `Book ID "${id}" already exists. Please choose a unique ID.`);
      return;
    }

    const newBook = {
      id: id,
      title: title,
      author: author,
      category: category
    };

    // Add to top of the catalog
    books.unshift(newBook);
    saveBooks();
    renderBooks();
    updateStats();
    closeBookModal();
    showToast(`Book "${title}" has been added to the library!`, 'success');
  }
}

/**
 * Clears form fields
 */
function resetForm() {
  bookForm.reset();
  bookCategorySelect.value = '';
  clearErrors();
}

/**
 * Clears any validation error messages
 */
function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-group input, .form-group select').forEach(el => {
    el.classList.remove('input-error');
  });
}

/**
 * Highlights a specific field with an error message
 */
function showFieldError(elementId, message) {
  const errorElem = document.getElementById(elementId);
  if (errorElem) {
    errorElem.textContent = message;
    const parentGroup = errorElem.closest('.form-group');
    if (parentGroup) {
      const input = parentGroup.querySelector('input, select');
      if (input) input.classList.add('input-error');
    }
  }
}

// ============================================================================
// View Book Modal (Read / View)
// ============================================================================

/**
 * Opens View Details Modal for a book
 */
function viewBookDetails(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;

  viewBookId.textContent = book.id;
  viewModalTitle.textContent = book.title;
  viewBookAuthor.textContent = book.author;
  viewBookCategory.textContent = book.category;
  viewBookCategory.className = `badge ${getCategoryBadgeClass(book.category)}`;

  // Connect "Edit Book" button inside View modal
  modalEditBtn.onclick = () => {
    closeViewModal();
    startEditBook(book.id);
  };

  viewModal.classList.add('active');
  viewModal.setAttribute('aria-hidden', 'false');
}

function closeViewModal() {
  viewModal.classList.remove('active');
  viewModal.setAttribute('aria-hidden', 'true');
}

// ============================================================================
// Delete Book Confirmation & Removal (Delete)
// ============================================================================

/**
 * Prompts confirmation modal before deleting
 */
function promptDeleteBook(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;

  pendingDeleteId = id;
  deleteBookTitle.textContent = `"${book.title}" (${book.id})`;

  deleteModal.classList.add('active');
  deleteModal.setAttribute('aria-hidden', 'false');
}

/**
 * Executes the deletion after user confirms
 */
function confirmDelete() {
  if (!pendingDeleteId) return;

  const bookToDelete = books.find(b => b.id === pendingDeleteId);
  const deletedTitle = bookToDelete ? bookToDelete.title : 'Book';

  // If user was currently editing this book, close edit modal
  if (editingBookId === pendingDeleteId) {
    closeBookModal();
  }

  // Remove from array
  books = books.filter(b => b.id !== pendingDeleteId);
  saveBooks();
  renderBooks();
  updateStats();

  closeDeleteModal();
  showToast(`"${deletedTitle}" was removed from the library catalog.`, 'success');
  pendingDeleteId = null;
}

function closeDeleteModal() {
  deleteModal.classList.remove('active');
  deleteModal.setAttribute('aria-hidden', 'true');
  pendingDeleteId = null;
}

// ============================================================================
// Rendering & Filtering
// ============================================================================

/**
 * Renders the filtered books table rows
 */
function renderBooks() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;

  // Filter books based on search input and selected category
  const filtered = books.filter(book => {
    const matchesSearch =
      book.id.toLowerCase().includes(query) ||
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.category.toLowerCase().includes(query);

    const matchesCategory =
      selectedCategory === 'ALL' || book.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Clear existing table content
  booksTableBody.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
    recordCountText.textContent = 'Showing 0 books';
    return;
  }

  emptyState.style.display = 'none';
  recordCountText.textContent = `Showing ${filtered.length} of ${books.length} book${books.length === 1 ? '' : 's'}`;

  // Populate rows
  filtered.forEach(book => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td><span class="id-badge">${escapeHtml(book.id)}</span></td>
      <td class="book-title-cell">${escapeHtml(book.title)}</td>
      <td class="book-author-cell">${escapeHtml(book.author)}</td>
      <td>
        <span class="badge ${getCategoryBadgeClass(book.category)}">
          ${escapeHtml(book.category)}
        </span>
      </td>
      <td>
        <div class="action-btn-group">
          <button 
            type="button" 
            class="btn-action btn-action-view" 
            onclick="viewBookDetails('${escapeHtml(book.id)}')" 
            title="View details"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            View
          </button>
          
          <button 
            type="button" 
            class="btn-action btn-action-edit" 
            onclick="startEditBook('${escapeHtml(book.id)}')" 
            title="Edit book"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Edit
          </button>

          <button 
            type="button" 
            class="btn-action btn-action-delete" 
            onclick="promptDeleteBook('${escapeHtml(book.id)}')" 
            title="Delete book"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Delete
          </button>
        </div>
      </td>
    `;

    booksTableBody.appendChild(tr);
  });
}

/**
 * Updates quick dashboard statistics
 */
function updateStats() {
  statTotalBooks.textContent = books.length;
  
  // Count unique categories currently in the catalog
  const uniqueCategories = new Set(books.map(b => b.category.trim()));
  statTotalCategories.textContent = uniqueCategories.size;
}

/**
 * Resets data to initial sample books
 */
function handleResetDefaultData() {
  if (confirm('Reload the default sample library books? Any custom additions will be replaced.')) {
    books = [...DEFAULT_BOOKS];
    saveBooks();
    closeBookModal();
    searchInput.value = '';
    categoryFilter.value = 'ALL';
    renderBooks();
    updateStats();
    showToast('Sample library catalog reloaded successfully!', 'success');
  }
}

// ============================================================================
// Utilities & Toast Notifications
// ============================================================================

/**
 * Returns the CSS class for styling category badges
 */
function getCategoryBadgeClass(category) {
  const normalized = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
  switch (normalized) {
    case 'fiction': return 'badge-fiction';
    case 'non-fiction': return 'badge-non-fiction';
    case 'science': return 'badge-science';
    case 'technology': return 'badge-technology';
    case 'history': return 'badge-history';
    case 'biography': return 'badge-biography';
    case 'philosophy': return 'badge-philosophy';
    case 'literature': return 'badge-literature';
    default: return 'badge-default';
  }
}

/**
 * Displays a styled temporary toast alert
 */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMarkup = type === 'success' 
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  toast.innerHTML = `
    <span class="toast-icon">${iconMarkup}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
    <button class="toast-close" aria-label="Close notification">&times;</button>
  `;

  // Close on click
  toast.querySelector('.toast-close').addEventListener('click', () => {
    dismissToast(toast);
  });

  toastContainer.appendChild(toast);

  // Auto dismiss after 3.8 seconds
  setTimeout(() => {
    dismissToast(toast);
  }, 3800);
}

function dismissToast(toast) {
  if (!toast || !toast.parentElement) return;
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(20px)';
  setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
  }, 250);
}

/**
 * Helper to escape HTML characters to prevent XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', initDashboard);
