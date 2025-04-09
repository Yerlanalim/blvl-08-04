'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type AdminLog = {
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: any;
};

export async function logAdminAction(log: AdminLog): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(log),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error logging admin action:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to log admin action:', error);
    return false;
  }
}

export async function getAdminLogs(options: {
  limit?: number;
  offset?: number;
  resourceType?: string;
} = {}) {
  const { limit = 50, offset = 0, resourceType } = options;
  
  try {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    if (resourceType) {
      params.append('resource_type', resourceType);
    }
    
    const response = await fetch(`/api/admin/logs?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error fetching admin logs:', error);
      return { data: [], count: 0 };
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to get admin logs:', error);
    return { data: [], count: 0 };
  }
}

// Helper to create admin log entry with appropriate type
export const AdminLogTypes = {
  USER: 'user',
  LEVEL: 'level',
  VIDEO: 'video',
  ARTIFACT: 'artifact',
  PAYMENT: 'payment',
  SYSTEM: 'system',
};

// Helper to create admin log entry with appropriate action
export const AdminActions = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  APPROVE: 'approve',
  REJECT: 'reject',
  LOGIN: 'login',
}; 