"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MessageSquare, Shield, Zap, Globe, ArrowRight, CheckCircle2 } from "lucide-react";
import Button, { buttonVariants } from "@/components/ui/Button";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-linear-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <MessageSquare className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter">Relay</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
            <a href="#security" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Security</a>
            <Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Sign In</Link>
            <Link href="/register" className={buttonVariants({ size: "sm", className: "rounded-full px-6" })}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-linear-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent -z-10" />
        <div className="absolute top-20 right-[10%] w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute top-40 left-[10%] w-72 h-72 bg-blue-500/20 rounded-full blur-3xl -z-10 animate-pulse delay-700" />

        <div className="max-w-7xl mx-auto text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase mb-4 border border-blue-100 dark:border-blue-800">
              <Zap size={14} className="animate-bounce" />
              Revolutionizing Real-time Chat
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1] text-gray-900 dark:text-white">
              Connect <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">Instantly</span><br />
              Anywhere in the World.
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Experience the next generation of communication. Seamless, secure, and lightning-fast real-time messaging designed for modern teams and individuals.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register" className={buttonVariants({ className: "h-16 px-10 text-lg rounded-2xl shadow-2xl shadow-blue-500/25 flex items-center gap-3" })}>
              Start Chatting Free <ArrowRight size={20} />
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "secondary", className: "h-16 px-10 text-lg rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800" })}>
              Sign In
            </Link>
          </motion.div>

          {/* App Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative mt-20 max-w-5xl mx-auto"
          >
            <div className="relative rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
              <div className="bg-gray-50 dark:bg-gray-900 aspect-video flex items-center justify-center p-8">
                <div className="w-full h-full rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 flex shadow-inner overflow-hidden">
                  <div className="w-1/3 border-r border-gray-100 dark:border-gray-800 p-4 space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-3 items-center opacity-40">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 p-6 flex flex-col gap-6">
                    <div className="w-2/3 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl self-start" />
                    <div className="w-1/2 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl self-end" />
                    <div className="w-3/4 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl self-start" />
                    <div className="mt-auto h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl" />
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 blur-3xl -z-10" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 blur-3xl -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black">Built for Speed and Security</h2>
            <p className="text-gray-600 dark:text-gray-400">Everything you need in a modern workspace communication tool.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="text-yellow-500" />}
              title="Real-time Sync"
              description="Powered by Socket.io, messages fly across the globe in milliseconds."
            />
            <FeatureCard
              icon={<Shield className="text-blue-500" />}
              title="Secure Encryption"
              description="Your privacy is our priority. Industry standard hashing and JWT auth."
            />
            <FeatureCard
              icon={<Globe className="text-purple-500" />}
              title="Global Network"
              description="Reach anyone, anywhere. Reliability built into the core infrastructure."
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="security" className="py-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <h2 className="text-5xl font-black leading-tight">Your Privacy, Protected by Default</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              We leverage modern security standards to ensure your data stays yours. From secure authentication to protected API endpoints, every layer of Relay is hardened against threats.
            </p>
            <ul className="space-y-4">
              {[
                "Password Hashing with BcryptJS",
                "JSON Web Token (JWT) Authorization",
                "Cloudinary-backed Media Storage",
                "PostgreSQL Persistence"
              ].map(item => (
                <li key={item} className="flex items-center gap-3 font-medium">
                  <CheckCircle2 className="text-green-500" size={20} /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 relative">
            <div className="w-full aspect-square bg-linear-to-tr from-blue-600/20 to-purple-600/20 rounded-[4rem] flex items-center justify-center p-12 overflow-hidden rotate-3">
              <div className="w-full h-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 space-y-4 -rotate-3 border border-gray-100 dark:border-gray-800">
                <div className="h-2 w-1/4 bg-gray-200 dark:bg-gray-800 rounded shadow-xs" />
                <div className="h-2 w-3/4 bg-gray-200 dark:bg-gray-800 rounded shadow-xs" />
                <div className="h-2 w-1/2 bg-gray-200 dark:bg-gray-800 rounded shadow-xs" />
                <div className="pt-8 h-32 w-full bg-blue-500/5 rounded-2xl flex items-center justify-center border-2 border-dashed border-blue-500/20">
                  <Shield className="text-blue-500/40" size={48} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-12 bg-linear-to-r from-blue-600 to-purple-600 p-16 rounded-[3rem] shadow-2xl shadow-blue-500/30 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl -rotate-12 translate-x-20 -translate-y-20" />
          <h2 className="text-5xl font-black">Ready to switch to Relay?</h2>
          <p className="text-white/80 text-lg">Join thousands of users who are already experiencing zero-lag communication.</p>
          <div className="flex justify-center gap-4">
            <Link href="/register" className={buttonVariants({ size: "lg", className: "bg-white text-blue-600 hover:bg-gray-100 px-12 h-16 rounded-2xl font-bold shadow-xl" })}>
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold tracking-tighter">Relay</span>
          </div>
          <p className="text-sm text-gray-500">© 2026 Relay Inc. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all space-y-4"
    >
      <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}