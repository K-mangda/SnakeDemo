'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Hexagon, Lock } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { showToast } = useToast()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    showToast('Login successful! Redirecting...')
    if (email.includes('admin')) router.push('/admin')
    else router.push('/expert')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-zinc-950">
      <div className="w-full max-w-sm border border-zinc-800 bg-zinc-900/50 rounded-2xl p-8 backdrop-blur-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4">
            <Hexagon size={24} className="text-emerald-500" />
          </div>
          <h1 className="text-xl font-medium text-zinc-100">System Authentication</h1>
          <p className="text-sm text-zinc-500 mt-1">Authorized personnel only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <Button className="w-full mt-4" size="lg">
            Authenticate <Lock size={16} />
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-800/50 text-xs text-zinc-500 font-mono">
          <p className="mb-2 uppercase tracking-widest text-[10px]">Demo Credentials</p>
          <div className="flex justify-between mb-1"><span>Expert:</span> <span className="text-zinc-400">expert@snake.ai / demo1234</span></div>
          <div className="flex justify-between"><span>Admin:</span> <span className="text-zinc-400">admin@snake.ai / admin1234</span></div>
        </div>
      </div>
    </main>
  )
}
