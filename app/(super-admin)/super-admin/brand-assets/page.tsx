/**
 * Super Admin Brand Assets Page
 * View and moderate brand assets (logos and templates) across all organizations
 */

import BrandAssetsGallery from '@/components/super-admin/BrandAssetsGallery'

export default function BrandAssetsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Brand Asset Management</h1>
        <p className="text-gray-600 mt-2">
          View and moderate logos and templates across all organizations
        </p>
      </div>

      {/* Brand Assets Gallery */}
      <BrandAssetsGallery />
    </div>
  )
}
