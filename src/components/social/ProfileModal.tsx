"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, User, Calendar, Mail, Shield, Check, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCredentials } from "@/redux/features/authSlice";
import Button from "@/components/ui/Button";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string; // If provided, shows another user's profile. If null, shows current user's profile.
}

export default function ProfileModal({ isOpen, onClose, userId }: ProfileModalProps) {
    const dispatch = useAppDispatch();
    const currentUser = useAppSelector((state) => state.auth.user);
    const token = useAppSelector((state) => state.auth.token);

    const isOwnProfile = !userId || userId === currentUser?.id;
    const [profile, setProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form states
    const [fullName, setFullName] = useState("");
    const [age, setAge] = useState("");
    const [avatar, setAvatar] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchProfile();
            setSuccess("");
            setError("");
        }
    }, [isOpen, userId]);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const url = isOwnProfile ? "/api/users/profile" : `/api/users/${userId}`;
            const headers: any = {};
            if (isOwnProfile && token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const res = await fetch(url, { headers });
            const data = await res.json();

            if (res.ok) {
                setProfile(data);
                setFullName(data.fullName || "");
                setAge(data.age?.toString() || "");
                setAvatar(data.avatar);
            } else {
                setError(data.error || "Failed to load profile");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password && password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsSaving(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/users/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName,
                    age: age ? parseInt(age) : null,
                    avatar,
                    password: password || undefined
                })
            });

            const data = await res.json();
            if (res.ok) {
                setProfile(data);
                dispatch(setCredentials({ user: data, token: token! }));
                setSuccess("Profile updated successfully!");
                setIsEditing(false);
                setPassword("");
                setConfirmPassword("");
            } else {
                setError(data.error || "Failed to update profile");
            }
        } catch (err) {
            setError("Something went wrong while saving");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl border border-gray-100 dark:border-gray-800"
                >
                    {/* Header */}
                    <div className="p-6 pb-0 flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {isOwnProfile ? (isEditing ? "Edit Profile" : "My Profile") : "User Profile"}
                            </h2>
                            <p className="text-gray-500 text-sm">{profile?.username}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4 text-gray-400 animate-pulse">
                                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800" />
                                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                            </div>
                        ) : (
                            <>
                                {/* Avatar Section */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-lg">
                                            {avatar ? (
                                                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={48} className="text-blue-500" />
                                            )}
                                        </div>
                                        {isOwnProfile && (
                                            <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white shadow-lg cursor-pointer transform transition-transform hover:scale-110 active:scale-95">
                                                <Camera size={16} />
                                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={!isEditing} />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {isEditing ? (
                                    <form onSubmit={handleSave} className="space-y-4 max-h-[400px] overflow-y-auto px-1">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                                            <input
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Enter full name"
                                                className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Age</label>
                                            <input
                                                type="number"
                                                value={age}
                                                onChange={(e) => setAge(e.target.value)}
                                                placeholder="Enter age"
                                                className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                            />
                                        </div>

                                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Change Password</label>
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="New password (optional)"
                                                    className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                                />
                                            </div>
                                            {password && (
                                                <div className="space-y-1">
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder="Confirm new password"
                                                        className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {error && <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}

                                        <div className="flex gap-3 pt-4 sticky bottom-0 bg-white dark:bg-gray-900 py-2">
                                            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)} className="flex-1">Cancel</Button>
                                            <Button type="submit" className="flex-1" disabled={isSaving}>
                                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Save Changes"}
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                                    <User size={14} />
                                                    <span className="text-[10px] uppercase tracking-tighter font-bold">Full Name</span>
                                                </div>
                                                <p className="font-medium truncate">{profile?.fullName || "Not set"}</p>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                                    <Calendar size={14} />
                                                    <span className="text-[10px] uppercase tracking-tighter font-bold">Age</span>
                                                </div>
                                                <p className="font-medium truncate">{profile?.age || "Not set"}</p>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 flex flex-col gap-1 col-span-2">
                                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                                    <Mail size={14} />
                                                    <span className="text-[10px] uppercase tracking-tighter font-bold">Email Address</span>
                                                </div>
                                                <p className="font-medium truncate">{profile?.email || "N/A"}</p>
                                            </div>
                                        </div>

                                        {success && (
                                            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium">
                                                <Check size={16} /> {success}
                                            </div>
                                        )}

                                        {isOwnProfile && (
                                            <Button onClick={() => setIsEditing(true)} className="w-full py-4 text-lg">
                                                Edit My Details
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
