/**
 * Server-side API Routes
 * 
 * Define your backend API endpoints here.
 * Each route is a key-value pair where:
 * - Key: "METHOD /path" (e.g., "GET /api/hello")
 * - Value: async handler function (req, ctx) => response
 * 
 * Note: Routes should start with /api prefix. The framework will:
 * 1. Remove the /api prefix from the route definition
 * 2. Add /apps/{app-id}/api prefix automatically
 * 3. Final path: /apps/{app-id}/api/xxx
 * 
 * Example: "GET /api/hello" -> accessible at /apps/{app-id}/api/hello
 * 
 * Types (Context, ServerExports) are automatically provided by the `@mspbots/server` package.
 * No need to import them manually.
 */

const routes: ServerExports = {
  /**
   * Simple Hello World endpoint
   * Returns a greeting message with app context
   * Accessible at: /apps/{app-id}/api/hello
   */
  async 'GET /api/hello'(req: Request, ctx: Context) {
    return {
      message: 'Hello World!',
      timestamp: new Date().toISOString(),
      app: ctx.app,
    }
  },

  /**
   * Example: Call Gateway SDK API
   * Demonstrates how to call SDK endpoints from server.ts
   * Accessible at: /apps/{app-id}/api/test/sdk-hello
   */
  async 'GET /api/test/sdk-hello'(req: Request, ctx: Context) {
    try {
      // Call Gateway SDK test endpoint
      // In dev mode, use the global api() function
      const result = await api(`/apps/${ctx.app.id}/sdk/test/hello`, {
        method: 'GET',
      })

      return {
        message: 'SDK call successful',
        sdkResponse: result,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        error: 'SDK call failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }
    }
  },
}

export default routes
