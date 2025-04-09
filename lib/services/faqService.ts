import { createServerComponentClient } from '@/lib/supabase/client';
import { FAQ } from '@/lib/supabase/types';
import { cache } from 'react';

/**
 * Get all FAQ items
 */
export const getAllFAQs = cache(async (): Promise<FAQ[]> => {
  try {
    const supabase = createServerComponentClient();
    
    const { data, error } = await supabase
      .from('faq')
      .select('*')
      .order('category')
      .order('order_num')
      .throwOnError();
    
    if (error) {
      console.error('Error fetching FAQs:', error);
      throw new Error('Failed to fetch FAQs');
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getAllFAQs:', error);
    throw error;
  }
});

/**
 * Get FAQ items by category
 */
export const getFAQsByCategory = cache(async (category: string): Promise<FAQ[]> => {
  try {
    const supabase = createServerComponentClient();
    
    const { data, error } = await supabase
      .from('faq')
      .select('*')
      .eq('category', category)
      .order('order_num')
      .throwOnError();
    
    if (error) {
      console.error('Error fetching FAQs by category:', error);
      throw new Error(`Failed to fetch FAQs for category: ${category}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getFAQsByCategory:', error);
    throw error;
  }
});

/**
 * Search FAQ items by query
 */
export const searchFAQs = cache(async (query: string): Promise<FAQ[]> => {
  if (!query.trim()) {
    return getAllFAQs();
  }
  
  try {
    const supabase = createServerComponentClient();
    
    // Search in question, answer and category
    const { data, error } = await supabase
      .from('faq')
      .select('*')
      .or(`question.ilike.%${query}%,answer.ilike.%${query}%,category.ilike.%${query}%`)
      .order('category')
      .order('order_num')
      .throwOnError();
    
    if (error) {
      console.error('Error searching FAQs:', error);
      throw new Error(`Failed to search FAQs for query: ${query}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in searchFAQs:', error);
    throw error;
  }
});

/**
 * Get all unique FAQ categories
 */
export const getAllFAQCategories = cache(async (): Promise<string[]> => {
  try {
    const faqs = await getAllFAQs();
    const uniqueCategories = [...new Set(faqs.map(faq => faq.category))];
    return uniqueCategories;
  } catch (error) {
    console.error('Error in getAllFAQCategories:', error);
    throw error;
  }
}); 