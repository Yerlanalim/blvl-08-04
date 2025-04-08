'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient, Tables } from '@/lib/supabase'

type TestConnectionRow = Tables['test_connection']['Row']

export default function SupabaseTestComponent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TestConnectionRow[] | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabase = createBrowserSupabaseClient()
        
        // Query the test table we created
        const { data, error } = await supabase
          .from('test_connection')
          .select('*')
        
        if (error) throw error
        
        // If we get here, the connection is successful
        setStatus('success')
        setData(data)
      } catch (e) {
        setStatus('error')
        setError((e as Error).message)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-2">Supabase Connection Test</h2>
      {status === 'loading' && <p>Testing connection...</p>}
      {status === 'success' && (
        <div>
          <p className="text-green-600 mb-2">✅ Connected to Supabase successfully!</p>
          {data && data.length > 0 && (
            <div className="mt-2">
              <p className="font-medium">Test data retrieved:</p>
              <ul className="bg-gray-100 p-2 rounded text-sm mt-1">
                {data.map(item => (
                  <li key={item.id}>ID: {item.id}, Message: {item.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {status === 'error' && (
        <div>
          <p className="text-red-600">❌ Connection error:</p>
          <pre className="bg-gray-100 p-2 rounded text-sm mt-2">{error}</pre>
        </div>
      )}
    </div>
  )
} 