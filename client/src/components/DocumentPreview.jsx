import React from 'react';

const DocumentPreview = ({ src }) => (
  <div className="relative">
    <iframe src={src} className="w-full h-80" title="Document preview"></iframe>
  </div>
);

export default DocumentPreview;
