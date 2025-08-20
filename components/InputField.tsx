
import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, id, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block mb-2 text-sm font-medium text-cyan-700 dark:text-cyan-300">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="w-full bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
      />
    </div>
  );
};

export default InputField;