import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatStr = "MMM d, yyyy") {
  return format(new Date(date), formatStr);
}

export function formatRelative(date: string | Date) {
  const d = new Date(date);
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true });
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

export function formatTime(date: string | Date) {
  return format(new Date(date), "h:mm a");
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "MMM d, yyyy h:mm a");
}

export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good Morning, ${name}!`;
  if (hour < 17) return `Good Afternoon, ${name}!`;
  if (hour < 20) return `Good Evening, ${name}!`;
  return `Good Night, ${name}!`;
}

export function truncate(str: string, length = 50): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatStudyHours(seconds: number): string {
  const h = (seconds / 3600).toFixed(1);
  return `${h}h`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const TASK_CATEGORIES = [
  "GATE ECE",
  "Verilog",
  "SystemVerilog",
  "Digital Electronics",
  "VLSI Design",
  "AI and Machine Learning",
  "FPGA",
  "Semiconductor Engineering",
  "Projects",
  "College Work",
  "Revision",
  "Mock Tests",
  "Personal Development",
  "Other",
] as const;

export const TASK_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export const TASK_STATUSES = [
  "Requested",
  "Accepted",
  "In Progress",
  "Submitted for Review",
  "Revision Requested",
  "Approved",
  "Overdue",
  "Cancelled",
] as const;

export const PRIORITY_COLORS = {
  Low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  High: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Urgent: "bg-red-500/10 text-red-500 border-red-500/20",
} as const;

export const STATUS_COLORS = {
  Requested: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Accepted: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  "In Progress": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "Submitted for Review": "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  "Revision Requested": "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Approved: "bg-green-500/10 text-green-500 border-green-500/20",
  Overdue: "bg-red-500/10 text-red-500 border-red-500/20",
  Cancelled: "bg-gray-500/10 text-gray-500 border-gray-500/20",
} as const;

