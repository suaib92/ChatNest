import React, { useState } from 'react';

const VideoPreview = ({ src }) => {
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
        className="relative cursor-pointer"
        onClick={openModal}
      >
        <video controls className="w-60 h-auto">
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div className="relative w-full max-w-4xl bg-white p-4 rounded-lg">
            <button
              className="absolute top-2 right-2 text-white text-2xl bg-black bg-opacity-50 rounded-full p-1"
              onClick={closeModal}
            >
              &times;
            </button>
            <div className="relative">
              <video controls className="w-full h-auto">
                <source src={src} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
