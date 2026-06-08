import React from 'react'

export default function FormInput({ label, type = 'text', value, onChange, placeholder, name, error, id, darkMode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id || name} className={`block text-sm font-medium transition-colors ${darkMode ? 'text-white' : 'text-gray-700'}`}>{label}</label>
      <input
        id={id || name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all border py-2 px-3 ${
          error ? 'border-red-500' : 'border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
