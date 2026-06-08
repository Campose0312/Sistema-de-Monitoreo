import React from 'react'

export default function PrimaryButton({ children, type = 'button', disabled = false, className = '' }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`w-full py-2 px-4 ${disabled ? 'opacity-60 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95'} text-white rounded-md shadow ${className}`}
    >
      {children}
    </button>
  )
}
