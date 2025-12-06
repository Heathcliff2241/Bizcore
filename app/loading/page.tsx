import LoadingScreen from '@/components/LoadingScreen'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function LoadingDemoPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-4 left-4 z-50">
        <Link href="/" className="text-sm text-blue-700 hover:underline">← Back</Link>
      </header>

      <main className="min-h-screen flex items-center justify-center">
        <LoadingScreen />
      </main>
    </div>
  )
}
