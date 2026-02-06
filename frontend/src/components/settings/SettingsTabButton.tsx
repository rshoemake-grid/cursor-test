/**
 * Settings Tab Button Component
 * Extracted from SettingsPage to improve DRY compliance
 * Single Responsibility: Only renders a settings tab button
 */

export interface SettingsTabButtonProps {
  label: string
  isActive: boolean
  onClick: () => void
}

/**
 * Settings Tab Button Component
 * DRY: Reusable tab button for settings tabs
 */
export function SettingsTabButton({
  label,
  isActive,
  onClick,
}: SettingsTabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-4 py-3 rounded-lg border transition ${
        isActive
          ? 'bg-primary-600 text-white border-primary-600'
          : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400 hover:text-primary-700'
      }`}
    >
      {label}
    </button>
  )
}
