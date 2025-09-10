
import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
      e.target.value = ''; // Reset input to allow re-uploading the same file
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if(e.dataTransfer.files[0].type === 'application/pdf') {
        onFileSelect(e.dataTransfer.files[0]);
      }
    }
  }, [onFileSelect, disabled]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const borderStyle = isDragging 
    ? 'border-brand-primary ring-2 ring-brand-primary' 
    : 'border-gray-300';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand-primary';

  return (
    <div 
      className={`relative flex flex-col items-center justify-center w-full p-8 text-center border-2 ${borderStyle} border-dashed rounded-lg transition-all duration-300 ${disabledClasses}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        id="file-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
        accept="application/pdf"
        disabled={disabled}
      />
      <div className="text-brand-primary">
         <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <p className="mt-4 text-lg font-semibold text-brand-dark">
        Drag and drop your PDF here
      </p>
      <p className="mt-1 text-sm text-brand-secondary">or click to browse</p>
      <button 
        type="button" 
        onClick={() => document.getElementById('file-upload')?.click()}
        disabled={disabled}
        className="mt-4 px-6 py-2 text-sm font-medium text-white bg-brand-primary rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400"
      >
        Select PDF File
      </button>
    </div>
  );
};

export default FileUpload;
