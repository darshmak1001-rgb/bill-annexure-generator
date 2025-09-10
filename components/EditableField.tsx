import React, { useState, useEffect } from 'react';

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (newValue: string) => void;
}

const EditableField: React.FC<EditableFieldProps> = ({ label, value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    // If the external value prop changes, update the component's state
    // unless it is currently being edited.
    if (!isEditing) {
      setCurrentValue(value);
    }
  }, [value, isEditing]);

  const handleSave = () => {
    onSave(currentValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(value); // Revert to the original value
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-500">{label}</label>
      {isEditing ? (
        <div className="mt-1 flex items-center space-x-2">
          <input
            type="text"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
            autoFocus
          />
          <button onClick={handleSave} className="text-green-600 hover:text-green-800" title="Save">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </button>
          <button onClick={handleCancel} className="text-red-600 hover:text-red-800" title="Cancel">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ) : (
        <div className="mt-1 flex items-center justify-between">
          <p className="text-lg font-semibold text-brand-dark truncate pr-2">{currentValue || 'N/A'}</p>
          <button onClick={() => setIsEditing(true)} className="text-indigo-600 hover:text-indigo-900" title={`Edit ${label}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default EditableField;
