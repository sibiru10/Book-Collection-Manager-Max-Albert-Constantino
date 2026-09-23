import { useState, useEffect, useRef, useCallback, memo } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import '../styles/Book.css';

const API_URL = 'https://6ab37ff3217e4365883110e1.mockapi.io/api/v1/books';

const DEFAULT_FORM = {
  title: '',
  author: '',
  genre: 'Fiction',
  year: '',
  description: '',
  image: ''
};

const GENRE_OPTIONS = [
  'Fiction',
  'Political Allegory',
  'Absurdism',
  'Weird Fiction',
  'Dystopian Fiction',
  'Fantasy',
  'Mystery',
  'Non-Fiction',
  'Classic',
  'Sci-Fi'
];

const FALLBACK_COVER = 'https://via.placeholder.com/300x400?text=No+Cover';
const FALLBACK_THUMB = 'https://via.placeholder.com/60x80?text=Error';

const CARD_ANIMATION_DURATION = 0.4;

const BookCard = memo(function BookCard({ book, onView, onEdit, onDelete }) {
  return (
    <div className="book-card">
      <div className="card-image-wrapper">
        <span className="badge">{book.genre}</span>
        <img
          src={book.image}
          alt={book.title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_COVER;
          }}
        />
      </div>
      <div className="card-body">
        <p className="book-author">{book.author}</p>
        <p className="book-meta">{book.genre} • {book.year}</p>
        <div className="card-actions">
          <button className="btn btn-secondary" onClick={() => onView(book)}>
            View
          </button>
          <button className="btn btn-secondary" onClick={() => onEdit(book)}>
            Edit
          </button>
          <button className="btn btn-danger-outline" onClick={() => onDelete(book)}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

function ModalOverlay({ onClose, className = '', children }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' });
      gsap.fromTo(
        '.modal-content',
        { scale: 0.8, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.7)' }
      );
    }, overlayRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className={`modal-overlay ${className}`.trim()} ref={overlayRef} onClick={onClose}>
      {children}
    </div>
  );
}

function BookFormModal({ modalType, formData, formError, onChange, onSubmit, onClose }) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{modalType === 'ADD' ? 'Add a book' : 'Edit book'}</h2>
        {formError && <p className="error-text">{formError}</p>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="modal-title">Title</label>
            <input
              id="modal-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={onChange}
              placeholder="e.g. Secret Garden"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-2">
              <label htmlFor="modal-author">Author</label>
              <input
                id="modal-author"
                type="text"
                name="author"
                value={formData.author}
                onChange={onChange}
                placeholder="e.g. Frances Hodgson Burnett"
                required
              />
            </div>
            <div className="form-group flex-1">
              <label htmlFor="modal-year">Year</label>
              <input
                id="modal-year"
                type="number"
                name="year"
                value={formData.year}
                onChange={onChange}
                placeholder="1911"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="modal-genre">Genre</label>
            <select id="modal-genre" name="genre" value={formData.genre} onChange={onChange}>
              {GENRE_OPTIONS.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="modal-description">Description</label>
            <textarea
              id="modal-description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={onChange}
              placeholder="A short description of the book..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="modal-image">Image URL</label>
            <input
              id="modal-image"
              type="url"
              name="image"
              value={formData.image}
              onChange={onChange}
              placeholder="https://images.unsplash.com/..."
              required
            />
          </div>

          {formData.image && (
            <div className="image-preview-container">
              <img
                src={formData.image}
                alt="Preview"
                className="image-preview-thumb"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = FALLBACK_THUMB;
                }}
              />
              <p className="preview-note">
                If the link doesn't load, a plain cover is shown instead — so your shelf never has broken images.
              </p>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {modalType === 'ADD' ? 'Add book' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

function BookViewModal({ book, onClose }) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-content modal-view" onClick={(e) => e.stopPropagation()}>
        <div className="view-banner">
          <span className="badge">{book.genre}</span>
          <img
            src={book.image}
            alt={book.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = FALLBACK_COVER;
            }}
          />
        </div>
        <div className="view-body">
          <h2>{book.title}</h2>
          <p className="book-author">{book.author}</p>
          <p className="book-meta">{book.genre} • {book.year}</p>
          <p className="view-description">{book.description || 'No description available.'}</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

function BookDeleteModal({ book, onClose, onConfirm }) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-content modal-delete" onClick={(e) => e.stopPropagation()}>
        <h2>Remove this book?</h2>
        <p className="delete-warning">
          Are you sure you want to delete "<strong>{book.title}</strong>"? This can't be undone.
        </p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

export default function Book() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalType, setModalType] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [formError, setFormError] = useState('');

  const gridRef = useRef(null);

  const fetchBooks = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const response = await axios.get(API_URL);
      const sortedData = response.data.sort((a, b) => Number(a.id) - Number(b.id));
      setBooks(sortedData);
      setError(null);
    } catch (err) {
      setError('Failed to load books. Check your API URL.');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks(true);
  }, [fetchBooks]);

  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!loading && books.length > 0 && gridRef.current && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      const ctx = gsap.context(() => {
        const containerLeft = gridRef.current.getBoundingClientRect().left;
        const duration = CARD_ANIMATION_DURATION;

        gsap.fromTo(
          '.book-card',
          {
            x: (_, target) => {
              const rect = target.getBoundingClientRect();
              return -(rect.left - containerLeft + rect.width + 50);
            },
            opacity: 0
          },
          {
            x: 0,
            opacity: 1,
            duration: duration,
            stagger: duration,
            ease: 'power2.out',
            clearProps: 'all'
          }
        );
      }, gridRef);

      return () => ctx.revert();
    }
  }, [books, loading]);

  const handleOpenAdd = useCallback(() => {
    setFormData(DEFAULT_FORM);
    setFormError('');
    setModalType('ADD');
  }, []);

  const handleOpenEdit = useCallback((book) => {
    setSelectedBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      genre: book.genre,
      year: book.year,
      description: book.description,
      image: book.image
    });
    setFormError('');
    setModalType('EDIT');
  }, []);

  const handleOpenView = useCallback((book) => {
    setSelectedBook(book);
    setModalType('VIEW');
  }, []);

  const handleOpenDelete = useCallback((book) => {
    setSelectedBook(book);
    setModalType('DELETE');
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalType(null);
    setSelectedBook(null);
    setFormData(DEFAULT_FORM);
    setFormError('');
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmitForm = useCallback(
    async (e) => {
      e.preventDefault();
      setFormError('');

      if (!formData.title || !formData.author || !formData.year || !formData.image) {
        setFormError('Please fill in all required fields.');
        return;
      }

      const payload = {
        ...formData,
        year: Number(formData.year)
      };

      try {
        if (modalType === 'ADD') {
          await axios.post(API_URL, payload);
        } else if (modalType === 'EDIT') {
          await axios.put(`${API_URL}/${selectedBook.id}`, payload);
        }
        await fetchBooks();
        handleCloseModal();
      } catch (err) {
        setFormError('An error occurred while saving.');
      }
    },
    [formData, modalType, selectedBook, fetchBooks, handleCloseModal]
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axios.delete(`${API_URL}/${selectedBook.id}`);
      await fetchBooks();
      handleCloseModal();
    } catch (err) {
      alert('Failed to delete book.');
    }
  }, [selectedBook, fetchBooks, handleCloseModal]);

  return (
    <div className="book-manager-container">
      <header className="header">
        <div>
          <h1 className="title">Book Collection Manager</h1>
          <p className="subtitle">
            Every book you've read, borrowed, or want to brag about — kept on one shelf.{' '}
            <span className="highlight-text">{books.length} books on the shelf</span>
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          + Add a book
        </button>
      </header>

      <hr className="divider" />

      <main className="content">
        {loading ? (
          <div className="status-message">Loading collection...</div>
        ) : error ? (
          <div className="status-message error">{error}</div>
        ) : books.length === 0 ? (
          <div className="status-message">No books found. Click "+ Add a book" to start!</div>
        ) : (
          <div className="book-grid" ref={gridRef}>
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onView={handleOpenView}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            ))}
          </div>
        )}
      </main>

      {(modalType === 'ADD' || modalType === 'EDIT') && (
        <BookFormModal
          modalType={modalType}
          formData={formData}
          formError={formError}
          onChange={handleInputChange}
          onSubmit={handleSubmitForm}
          onClose={handleCloseModal}
        />
      )}

      {modalType === 'VIEW' && selectedBook && (
        <BookViewModal book={selectedBook} onClose={handleCloseModal} />
      )}

      {modalType === 'DELETE' && selectedBook && (
        <BookDeleteModal book={selectedBook} onClose={handleCloseModal} onConfirm={handleDeleteConfirm} />
      )}
    </div>
  );
}