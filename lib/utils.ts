import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Форматирует дату в удобный для чтения формат
 * @param dateString строка даты или объект Date
 * @returns отформатированная дата в формате DD.MM.YYYY
 */
export function formatDate(dateString: string | Date): string {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Некорректная дата';
    }
    
    // Форматирование в виде DD.MM.YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Ошибка форматирования';
  }
}
