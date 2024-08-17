import React, { useState } from 'react';

const ImagePreview = ({ src, alt }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="relative">
      <img
        src={src}
        alt={alt}
        className="w-60 h-auto cursor-pointer"
        onClick={openModal}
      />
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="relative max-w-3xl max-h-screen">
            <button
              className="absolute top-2 right-2 text-white text-2xl bg-black bg-opacity-50 rounded-full p-1"
              onClick={closeModal}
            >
              &times;
            </button>
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain"
              onClick={e => e.stopPropagation()} // Prevent closing the modal when clicking on the image
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePreview;
