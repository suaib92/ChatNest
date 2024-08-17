import React, { useState } from 'react';

const LinkPreview = ({ url, title, description }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="relative">
      <div
        className="p-2 border rounded-md bg-white shadow-sm cursor-pointer"
        onClick={openModal}
      >
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          <h3 className="font-bold">{title}</h3>
        </a>
        <p>{description}</p>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div className="relative w-full max-w-3xl bg-white p-4 rounded-md">
            <button
              className="absolute top-2 right-2 text-black text-2xl bg-white bg-opacity-75 rounded-full p-1"
              onClick={closeModal}
            >
              &times;
            </button>
            <div className="text-center">
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                <h3 className="font-bold text-lg mb-2">{title}</h3>
              </a>
              <p className="mb-4">{description}</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                {url}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkPreview;
