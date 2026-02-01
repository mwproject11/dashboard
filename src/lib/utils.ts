import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import CONFIG from "@/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short'
  }).format(date);
}

export function getRoleLabel(role: string): string {
  return CONFIG.ROLES[role.toUpperCase() as keyof typeof CONFIG.ROLES]?.label || role;
}

export function getRoleColor(role: string): string {
  return CONFIG.ROLES[role.toUpperCase() as keyof typeof CONFIG.ROLES]?.color || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  return CONFIG.ARTICLE_STATUS[status as keyof typeof CONFIG.ARTICLE_STATUS]?.label || status;
}

export function getStatusColor(status: string): string {
  return CONFIG.ARTICLE_STATUS[status as keyof typeof CONFIG.ARTICLE_STATUS]?.color || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority: string): string {
  return CONFIG.PRIORITY[priority as keyof typeof CONFIG.PRIORITY]?.color || 'bg-gray-100 text-gray-800';
}
