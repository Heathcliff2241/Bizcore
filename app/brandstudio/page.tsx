import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import BrandStudioFrame from '@/components/BrandStudioFrame'

export default async function BrandStudio() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="h-screen">
      <BrandStudioFrame />
    </div>
  )
}