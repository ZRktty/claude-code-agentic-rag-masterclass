import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router'

function App() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/sign-in')
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-lg font-semibold">Agentic RAG Masterclass</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Chat shell coming in sub-plan 3.</p>
      </div>
    </div>
  )
}

export default App
