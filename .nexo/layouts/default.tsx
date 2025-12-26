import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './components/Header'
import { Nav } from './components/Nav'
import { Breadcrumb } from './components/Breadcrumb'
import type { MenuNode } from './components/MenuItem'
import { X, Info } from 'lucide-react'
import { inMicroApp } from '#nexo/shared'
import { Card, CardHeader, CardTitle, CardContent, Alert, AlertTitle, AlertDescription, Button } from '#nexo/ui'

type DefaultLayoutProps = {
  menuItems: MenuNode[]
}

export function Default({ menuItems }: DefaultLayoutProps) {
  const inWujie = inMicroApp()
  const [showPropsAlert, setShowPropsAlert] = useState(false)
  const [props] = useState<Record<string, any>>({ menuItems })

  return (
    <div className="min-h-screen bg-background">
      {showPropsAlert && inWujie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Props from Main App
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowPropsAlert(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Received Props</AlertTitle>
                <AlertDescription>
                  <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-auto max-h-64">
                    {JSON.stringify(props, null, 2)}
                  </pre>
                </AlertDescription>
              </Alert>
              <div className="flex justify-end">
                <Button onClick={() => setShowPropsAlert(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <header className="sticky top-0 z-50 w-full bg-background border-b border-border/40 shadow-sm">
        {!inWujie && <Header />}
        <Nav menuItems={menuItems} />
      </header>

      {!inWujie && menuItems.length > 1 && (
        <div className="w-full flex items-center py-3 bg-background">
          <div className="container mx-auto flex items-center justify-end px-6">
            <Breadcrumb menuItems={menuItems} />
          </div>
        </div>
      )}
      {!inWujie && menuItems.length <= 1 && <div className="h-6" />}

      <main className={`flex-1 bg-background ${inWujie ? 'py-6' : 'pb-6'}`}>
        <div className={`mx-auto ${inWujie ? 'max-w-full px-2 sm:px-3' : 'max-w-screen-2xl px-4 sm:px-6 lg:px-8'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

