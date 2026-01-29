"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = "", ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-black/20 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${error ? "border-red-500" : "border-gray-300"
                        } ${className}`}
                    {...props}
                />
                {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;
