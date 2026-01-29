"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800"
            >
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold bg-linear-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        {title}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>
                </div>
                {children}
            </motion.div>
        </div>
    );
}