
import React from 'react';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  options: { value: string | number; label: string }[];
}

const SelectField: React.FC<SelectFieldProps> = ({ label, id, options, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block mb-2 text-sm font-medium text-cyan-700 dark:text-cyan-300">
        {label}
      </label>
      <select
        id={id}
        {...props}
        className="w-full bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
      >
        {options.map(option => (
          <option key={option.value} value={option.value} className="bg-white dark:bg-gray-800 text-black dark:text-white">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectField;