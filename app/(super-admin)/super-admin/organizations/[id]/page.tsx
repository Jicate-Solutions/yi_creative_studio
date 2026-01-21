/**
 * Super Admin Organization Detail Page
 * View and manage individual organization details
 */

import OrganizationDetail from '@/components/super-admin/OrganizationDetail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className="space-y-8">
      <OrganizationDetail organizationId={id} />
    </div>
  )
}
