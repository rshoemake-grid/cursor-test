/**
 * Marketplace Tab Button Component
 * Extracted from MarketplacePage to improve DRY compliance
 * Single Responsibility: Only renders a tab button
 */

import { LucideIcon } from 'lucide-react'

export interface MarketplaceTabButtonProps {
  label: string
  icon: LucideIcon
  isActive: boolean
  onClick: () => void
  iconSize?: 'w-5 h-5' | 'w-4 h-4'
}

/**
 * Marketplace Tab Button Component
 * DRY: Reusable tab button for all marketplace tabs
 */
export function MarketplaceTabButton({
  label,
  icon: Icon,
  isActive,
  onClick,
  iconSize = 'w-5 h-5',
}: MarketplaceTabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
        isActive
          ? 'text-primary-600 border-b-2 border-primary-600'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      <Icon className={iconSize} />
      {label}
    </button>
  )
}
