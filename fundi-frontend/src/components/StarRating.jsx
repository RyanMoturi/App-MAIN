import React from 'react';

const StarRating = ({ value = 0, onChange, readOnly = false, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'text-lg' : 'text-2xl';

  return (
    <div className={`flex gap-1 ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(star)}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition ${
            star <= value ? 'text-yellow-500' : 'text-gray-300'
          }`}
          aria-label={`Rate ${star} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

export default StarRating;
