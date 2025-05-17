import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="p-4 text-red-600 bg-red-100 border border-red-400 rounded-md">
      <p>{message}</p>
    </div>
  );
};

export default ErrorMessage; 