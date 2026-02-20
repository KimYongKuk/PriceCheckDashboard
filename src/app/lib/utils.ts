import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

export function formatRelativeTime(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays === 1) {
    return '어제';
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return past.toLocaleDateString('ko-KR');
  }
}

export function calculatePriceChange(current: number, previous: number): {
  percentage: number;
  direction: 'up' | 'down' | 'same';
} {
  if (current === previous) {
    return { percentage: 0, direction: 'same' };
  }
  const percentage = ((current - previous) / previous) * 100;
  return {
    percentage: Math.abs(percentage),
    direction: current > previous ? 'up' : 'down',
  };
}
