"use client";

import { motion } from "framer-motion";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: "primary" | "secondary" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
}

export default function Button({
    children,
    variant = "primary",
    size = "md",
    isLoading,
    className = "",
    ...props
}: ButtonProps) {
    const baseStyles = "px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2";

    const sizes = {
        sm: "text-sm px-3 py-1",
        md: "text-base px-4 py-2",
        lg: "text-lg px-6 py-3",
    };

    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
        danger: "bg-red-500 text-white hover:bg-red-600",
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading || props.disabled}
            {...(props as any)}
        >
            {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {children}
        </motion.button>
    );
}
