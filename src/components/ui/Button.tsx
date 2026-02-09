"use client";

import { motion } from "framer-motion";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: "primary" | "secondary" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
}

export const buttonVariants = ({ variant = "primary", size = "md", className = "" }: { variant?: string, size?: string, className?: string } = {}) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-hidden select-none active:scale-95";

    const sizes: any = {
        sm: "text-sm px-3 py-1.5",
        md: "text-base px-4 py-2",
        lg: "text-lg px-6 py-3",
    };

    const variants: any = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm border border-blue-500/20",
        secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-transparent dark:border-gray-700",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm border border-red-400/20",
    };

    return `${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;
};

export default function Button({
    children,
    variant = "primary",
    size = "md",
    isLoading,
    className = "",
    ...props
}: ButtonProps) {
    const variantStyles = buttonVariants({ variant, size, className });

    return (
        <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`${variantStyles} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading || props.disabled}
            {...(props as any)}
        >
            {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {children}
        </motion.button>
    );
}
