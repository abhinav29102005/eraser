// src/components/Modal.jsx
import React from 'react';

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    // Overlay
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent black background
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000, // Ensure it's on top of other content
      }}
      onClick={onClose} // Close modal when clicking outside
    >
      {/* Modal Content */}
      <div
        style={{
          backgroundColor: '#1e293b', // Dark slate background for modal
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
          minWidth: '350px',
          maxWidth: '90%',
          maxHeight: '90%',
          overflowY: 'auto',
          position: 'relative',
          color: 'white',
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.5em', fontWeight: 'bold' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5em',
              cursor: 'pointer',
              color: '#cbd5e1', // Slate 300
              padding: '5px',
            }}
          >
            &times;
          </button>
        </div>
        <div>
          {children} {/* This is where your form content will go */}
        </div>
      </div>
    </div>
  );
}

export default Modal;