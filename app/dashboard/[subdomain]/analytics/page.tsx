import { AnalyticsManager } from '@/components/dashboard/analytics/AnalyticsManager'

export default async function AnalyticsPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params
  return (
    <div className="space-y-6">
      <AnalyticsManager subdomain={subdomain} />
    </div>
  )
}
