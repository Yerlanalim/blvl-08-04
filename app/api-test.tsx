'use client'

import { useEffect, useState } from 'react'

type ApiTestResult = {
  success: boolean
  testConnection?: any[]
  levels?: any[]
  error?: string
  timestamp?: string
}

export default function ApiTestComponent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [result, setResult] = useState<ApiTestResult | null>(null)

  useEffect(() => {
    const testApi = async () => {
      try {
        const response = await fetch('/api/supabase-test')
        const data = await response.json()
        
        setResult(data)
        setStatus(data.success ? 'success' : 'error')
      } catch (e) {
        setStatus('error')
        setResult({
          success: false,
          error: (e as Error).message
        })
      }
    }

    testApi()
  }, [])

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-2">Supabase API Test</h2>
      {status === 'loading' && <p>Testing API connection...</p>}
      {status === 'success' && (
        <div>
          <p className="text-green-600 mb-2">✅ API connection successful!</p>
          {result?.timestamp && (
            <p className="text-sm text-gray-600 mb-2">Timestamp: {result.timestamp}</p>
          )}
          {result?.testConnection && (
            <div className="mt-2">
              <p className="font-medium">Test table data:</p>
              <pre className="bg-gray-100 p-2 rounded text-sm mt-1 max-h-32 overflow-auto">
                {JSON.stringify(result.testConnection, null, 2)}
              </pre>
            </div>
          )}
          {result?.levels && (
            <div className="mt-2">
              <p className="font-medium">Levels data:</p>
              <pre className="bg-gray-100 p-2 rounded text-sm mt-1 max-h-32 overflow-auto">
                {JSON.stringify(result.levels, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
      {status === 'error' && (
        <div>
          <p className="text-red-600">❌ API connection error:</p>
          <pre className="bg-gray-100 p-2 rounded text-sm mt-2">{result?.error}</pre>
        </div>
      )}
    </div>
  )
} 