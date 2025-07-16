import React, { useState, useEffect, useMemo } from "react";
import "./App.css";

// Color palette from work item and template
const COLORS = {
  primary: "#1976d2",
  secondary: "#424242",
  accent: "#ffc107",
};

const DUMMY_TAGS = [
  "All",
  "Personal",
  "Work",
  "Ideas",
  "Important",
];

// PUBLIC_INTERFACE
function App() {
  // Notes state: structure [{id, title, body, tags (array), updatedAt}]
  const [notes, setNotes] = useState(() => {
    // Optionally load from localStorage, empty array if none
    const stored = window.localStorage.getItem("notes");
    return stored ? JSON.parse(stored) : [];
  });
  const [search, setSearch] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorNote, setEditorNote] = useState(null); // note object or null
  const [selectedTag, setSelectedTag] = useState("All");

  useEffect(() => {
    window.localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  // Derived filtered notes
  const filteredNotes = useMemo(() => {
    let byTag = selectedTag === "All"
      ? notes
      : notes.filter(note =>
        Array.isArray(note.tags) && note.tags.includes(selectedTag)
      );
    if (search.trim() !== "") {
      const term = search.toLowerCase();
      byTag = byTag.filter(
        n =>
          n.title.toLowerCase().includes(term) ||
          n.body.toLowerCase().includes(term)
      );
    }
    // Sort: most recent updated first
    return byTag.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [notes, search, selectedTag]);

  // Show tag list based on note tags
  const tags = useMemo(() => {
    const tagSet = new Set();
    notes.forEach((note) =>
      (note.tags || []).forEach((tag) => tagSet.add(tag))
    );
    return ["All", ...Array.from(tagSet)];
  }, [notes]);

  // PUBLIC_INTERFACE
  function openEditor(note = null) {
    setEditorNote(note);
    setEditorOpen(true);
  }

  // PUBLIC_INTERFACE
  function closeEditor() {
    setEditorOpen(false);
    setEditorNote(null);
  }

  // PUBLIC_INTERFACE
  function handleSaveNote(note) {
    // Update or create new
    if (note.id) {
      // edit
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...note, updatedAt: Date.now() } : n))
      );
      setSelectedNoteId(note.id);
    } else {
      // create new
      const nid = "n" + Date.now();
      const newNote = {
        ...note,
        id: nid,
        updatedAt: Date.now(),
      };
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNoteId(nid);
    }
    closeEditor();
  }

  // PUBLIC_INTERFACE
  function handleDeleteNote(id) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNoteId === id) setSelectedNoteId(null);
    closeEditor();
  }

  // PUBLIC_INTERFACE
  function handleSelectNote(id) {
    setSelectedNoteId(id);
  }

  // PUBLIC_INTERFACE
  function handleSearchChange(e) {
    setSearch(e.target.value);
  }

  // PUBLIC_INTERFACE
  function handleTagClick(tag) {
    setSelectedTag(tag);
    setSelectedNoteId(null); // When switching tags, deselect note
  }

  const mainNote = notes.find((n) => n.id === selectedNoteId);

  return (
    <div className="notes-root">
      <Sidebar
        tags={tags}
        selectedTag={selectedTag}
        onTagSelect={handleTagClick}
        onCreateNote={() => openEditor()}
      />
      <main className="main-section">
        <div className="notes-header">
          <h1 className="notes-title" style={{ color: COLORS.primary }}>
            Notes
          </h1>
          <SearchBar search={search} onChange={handleSearchChange} />
        </div>
        <div className="notes-list-and-view">
          <NoteList
            notes={filteredNotes}
            selectedId={selectedNoteId}
            onSelect={handleSelectNote}
            onEdit={(note) => openEditor(note)}
            onDelete={handleDeleteNote}
          />
          <NoteView note={mainNote} />
        </div>
      </main>
      {/* Note Editor modal */}
      {editorOpen && (
        <NoteEditorModal
          note={editorNote}
          onClose={closeEditor}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
          tagOptions={tags}
        />
      )}
    </div>
  );
}

// Sidebar for tags/categories
function Sidebar({ tags, selectedTag, onTagSelect, onCreateNote }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-app-title">My Notes</span>
        <button className="btn btn-new" onClick={() => onCreateNote()}>
          + New Note
        </button>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-label">Tags</div>
        <div className="tag-list">
          {tags.map((tag) => (
            <button
              key={tag}
              className={`tag-btn${selectedTag === tag ? " active" : ""}`}
              onClick={() => onTagSelect(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div className="sidebar-footer">
        <span className="sidebar-brand-accent">
          <b>KAVIA</b>
        </span>
      </div>
    </aside>
  );
}

// Search bar
function SearchBar({ search, onChange }) {
  return (
    <div className="search-bar">
      <input
        type="search"
        className="search-input"
        placeholder="Search notes..."
        value={search}
        onChange={onChange}
        aria-label="Search notes"
        autoFocus={false}
      />
    </div>
  );
}

// Note list
function NoteList({ notes, selectedId, onSelect, onEdit, onDelete }) {
  if (!notes || notes.length === 0)
    return <div className="no-notes-empty">No notes found.</div>;
  return (
    <div className="notes-list">
      {notes.map((n) => (
        <NoteListItem
          key={n.id}
          note={n}
          selected={selectedId === n.id}
          onClick={() => onSelect(n.id)}
          onEdit={() => onEdit(n)}
          onDelete={() => onDelete(n.id)}
        />
      ))}
    </div>
  );
}

// A note item in the list
function NoteListItem({ note, selected, onClick, onEdit, onDelete }) {
  return (
    <div className={`note-list-item${selected ? " selected" : ""}`} onClick={onClick}>
      <div>
        <div className="note-list-title">{note.title || "<Untitled>"}</div>
        <div className="note-list-tags">
          {(note.tags || []).map((tag) => (
            <span className="note-tag" key={tag}>{tag}</span>
          ))}
        </div>
        <div className="note-list-date">
          {note.updatedAt && (
            <span>
              {new Date(note.updatedAt).toLocaleDateString()}{" "}
              {new Date(note.updatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      <div className="note-list-actions">
        <button
          className="btn-icon"
          title="Edit note"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(note);
          }}
        >
          ✏️
        </button>
        <button
          className="btn-icon"
          title="Delete note"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm("Delete this note?")) onDelete(note.id);
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// Viewing a note's details
function NoteView({ note }) {
  if (!note)
    return (
      <div className="note-view-empty">
        <div>Select a note to view.</div>
      </div>
    );
  return (
    <div className="note-view">
      <div className="note-view-title">{note.title || "Untitled Note"}</div>
      <div className="note-view-body">
        {note.body ? (
          <div style={{ whiteSpace: "pre-wrap" }}>{note.body}</div>
        ) : (
          <span style={{ color: "#888" }}>No content.</span>
        )}
      </div>
      <div className="note-view-tags">
        {(note.tags || []).map((tag) => (
          <span className="note-tag" key={tag}>{tag}</span>
        ))}
      </div>
      <div className="note-view-date">
        {note.updatedAt && (
          <span>
            Last edited:{" "}
            {new Date(note.updatedAt).toLocaleDateString()} {new Date(note.updatedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}

// Editor (modal for create/edit)
function NoteEditorModal({ note, onClose, onSave, onDelete, tagOptions }) {
  const isEdit = !!(note && note.id);
  // PUBLIC_INTERFACE
  const [title, setTitle] = useState(note ? note.title : "");
  const [body, setBody] = useState(note ? note.body : "");
  const [tags, setTags] = useState(
    note && Array.isArray(note.tags) && note.tags.length > 0 ? note.tags : []
  );
  // For new tag entry
  const [tagInput, setTagInput] = useState("");

  // PUBLIC_INTERFACE
  function handleSubmit(e) {
    e.preventDefault();
    if ((title || body) && onSave) {
      onSave({
        ...(note || {}),
        title,
        body,
        tags: tags.filter(Boolean),
      });
    }
  }
  // PUBLIC_INTERFACE
  function handleDelete() {
    if (note && note.id && onDelete) {
      onDelete(note.id);
    }
  }

  // Add tag from input
  function handleTagInput(e) {
    setTagInput(e.target.value);
  }
  function handleTagAdd(e) {
    e.preventDefault();
    const val = tagInput.trim();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
      setTagInput("");
    }
  }
  function handleTagRemove(tag) {
    setTags(tags.filter((t) => t !== tag));
  }
  function handleTagClickPreset(preset) {
    if (!tags.includes(preset)) setTags([...tags, preset]);
  }

  // Keyboard shortcut: Esc closes modal
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <form className="note-editor-form" onSubmit={handleSubmit}>
          <div className="note-editor-header">
            <span>{isEdit ? "Edit Note" : "New Note"}</span>
            <button className="btn-close" type="button" onClick={onClose} title="Close">
              ×
            </button>
          </div>
          <div className="note-editor-body">
            <input
              className="note-editor-title"
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              autoFocus
            />
            <textarea
              className="note-editor-textarea"
              placeholder="Write your note here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              maxLength={4096}
            />
            {/* Tag controls */}
            <div className="note-editor-tags">
              <div className="note-editor-tags-list">
                {tags.map((tag) => (
                  <span className="note-tag tag-edit" key={tag}>
                    {tag}
                    <button type="button" className="tag-remove-btn" title="Remove tag" onClick={() => handleTagRemove(tag)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="note-editor-tags-add">
                <input
                  type="text"
                  className="note-editor-tag-input"
                  placeholder="Add tag"
                  value={tagInput}
                  onChange={handleTagInput}
                  maxLength={16}
                />
                <button className="btn-small" onClick={handleTagAdd}>
                  Add
                </button>
                {/* Show suggestions */}
                <div className="note-editor-tags-presets">
                  {tagOptions
                    .filter(
                      (preset) =>
                        preset !== "All" &&
                        !tags.includes(preset) &&
                        preset.toLowerCase().startsWith(tagInput.toLowerCase()) &&
                        preset.toLowerCase() !== tagInput.toLowerCase()
                    )
                    .slice(0, 3)
                    .map((preset) => (
                      <button
                        key={preset}
                        className="tag-btn tag-preset-btn"
                        type="button"
                        onClick={() => handleTagClickPreset(preset)}
                      >
                        {preset}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
          <div className="note-editor-footer">
            {isEdit && (
              <button className="btn btn-delete" type="button" onClick={handleDelete}>
                Delete
              </button>
            )}
            <button className="btn btn-accent" type="submit">
              {isEdit ? "Save Changes" : "Create Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
