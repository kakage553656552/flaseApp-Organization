import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '#nexo/ui'
import { Rocket } from 'lucide-react'
import { $fetch } from '#nexo/shared'

interface ApiResponse {
  message: string
  timestamp: string
  app: {
    id: string
    name: string
    version?: string
    description?: string
  }
}

interface SdkTestResponse {
  message: string
  sdkResponse: {
    success: boolean
    data: {
      message: string
      timestamp: string
      appId: string
    }
  }
  timestamp: string
}

export function Home() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sdkData, setSdkData] = useState<SdkTestResponse | null>(null)
  const [sdkLoading, setSdkLoading] = useState(false)
  const [sdkError, setSdkError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await $fetch('./api/hello')
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const testSdkCall = async () => {
    setSdkLoading(true)
    setSdkError(null)
    try {
      const res = await $fetch('./api/test/sdk-hello')
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      const json = await res.json()
      setSdkData(json)
    } catch (err) {
      setSdkError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSdkLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl border-border/60 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to MSPBots</CardTitle>
          <CardDescription className="text-base">
            Full-stack React template with TypeScript
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-muted-foreground">
                Backend API Response
              </div>
              <div className="flex items-center gap-2">
                {loading ? (
                  <>
                    <Spinner className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  </>
                ) : error ? (
                  <span className="text-xs text-red-600 dark:text-red-400">Failed</span>
                ) : (
                  <span className="text-xs text-green-600 dark:text-green-400">✓ Success</span>
                )}
              </div>
            </div>

            {error ? (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            ) : data ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-border/50 bg-background p-3">
                    <div className="text-xs text-muted-foreground mb-1">Message</div>
                    <div className="text-sm font-medium">{data.message}</div>
                  </div>
                  <div className="rounded-md border border-border/50 bg-background p-3">
                    <div className="text-xs text-muted-foreground mb-1">Timestamp</div>
                    <div className="text-sm font-medium font-mono">{new Date(data.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
                
                <div className="rounded-md border border-border/50 bg-background p-3">
                  <div className="text-xs text-muted-foreground mb-2">App Context</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-medium font-mono">{data.app.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{data.app.name}</span>
                    </div>
                    {data.app.version && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Version:</span>
                        <span className="font-medium">{data.app.version}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <Spinner className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">Gateway SDK Test</div>
            <div className="rounded-lg border border-border/60 bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground">
                  Test calling Gateway SDK from server.ts
                </div>
                <button
                  onClick={testSdkCall}
                  disabled={sdkLoading}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sdkLoading ? 'Calling...' : 'Call SDK'}
                </button>
              </div>

              {sdkError && (
                <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600 dark:text-red-400">
                  {sdkError}
                </div>
              )}

              {sdkData && (
                <div className="space-y-2">
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                    ✓ SDK Call Successful
                  </div>
                  <div className="rounded-md border border-border/50 bg-muted/30 p-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Server Message:</span>
                      <span className="font-medium">{sdkData.message}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SDK Message:</span>
                      <span className="font-medium">{sdkData.sdkResponse?.data?.message}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">App ID:</span>
                      <span className="font-medium font-mono">{sdkData.sdkResponse?.data?.appId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SDK Timestamp:</span>
                      <span className="font-medium font-mono text-xs">{sdkData.sdkResponse?.data?.timestamp}</span>
                    </div>
                  </div>
                </div>
              )}

              {!sdkData && !sdkError && !sdkLoading && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  Click the button to test SDK call
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">Quick Start</div>
            <div className="grid gap-3 text-sm">
              <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card p-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <div className="font-medium mb-1">Edit pages</div>
                  <div className="text-xs text-muted-foreground">Modify <code className="px-1 py-0.5 rounded bg-muted">pages/Home.tsx</code> to customize this page</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card p-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <div className="font-medium mb-1">Add API routes</div>
                  <div className="text-xs text-muted-foreground">Define backend endpoints in <code className="px-1 py-0.5 rounded bg-muted">server.ts</code></div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card p-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <div className="font-medium mb-1">Build & deploy</div>
                  <div className="text-xs text-muted-foreground">Run <code className="px-1 py-0.5 rounded bg-muted">mspbot build</code> when ready to publish</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
