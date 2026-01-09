import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '#nexo/ui'
import { $fetch } from '#nexo/shared'

export function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMicrosoftLogin = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 模拟微软 OAuth2 登录
      const res = await $fetch('./api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: null }), // 使用默认用户
      })
      
      if (!res.ok) {
        throw new Error('登录失败')
      }
      
      const data = await res.json()
      
      if (data.success) {
        // 保存 token 到 localStorage
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('user', JSON.stringify(data.user))
        // 跳转到首页
        navigate('/')
      } else {
        setError(data.error || '登录失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-6">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md border-border/60 shadow-2xl backdrop-blur-sm bg-card/95 relative z-10">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Microsoft Logo */}
          <div className="flex justify-center">
            <div className="grid grid-cols-2 gap-1 w-12 h-12">
              <div className="bg-[#f25022] rounded-sm" />
              <div className="bg-[#7fba00] rounded-sm" />
              <div className="bg-[#00a4ef] rounded-sm" />
              <div className="bg-[#ffb900] rounded-sm" />
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold">登录到您的账户</CardTitle>
            <CardDescription className="text-base">
              使用 Microsoft 账户登录以访问组织架构
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleMicrosoftLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#2f2f2f] hover:bg-[#1f1f1f] dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <Spinner className="h-5 w-5" />
                <span>登录中...</span>
              </>
            ) : (
              <>
                {/* Microsoft Icon */}
                <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
                <span>使用 Microsoft 账户登录</span>
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">或</span>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>这是一个 Mock 演示</p>
            <p className="mt-1">点击登录将使用模拟数据</p>
          </div>

          <div className="pt-4 border-t border-border/40">
            <p className="text-xs text-center text-muted-foreground">
              登录即表示您同意我们的
              <a href="#" className="text-primary hover:underline mx-1">服务条款</a>
              和
              <a href="#" className="text-primary hover:underline mx-1">隐私政策</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
