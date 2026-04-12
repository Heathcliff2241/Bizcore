import { AnalyticsManager } from '@/components/dashboard/analytics/AnalyticsManager'

export default async function AnalyticsPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params
  return <AnalyticsManager subdomain={subdomain} />
}
