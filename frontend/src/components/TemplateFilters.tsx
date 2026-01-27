/**
 * TemplateFilters Component
 * Provides filtering and sorting UI controls for marketplace templates
 */


interface TemplateFiltersProps {
  category: string
  searchQuery: string
  sortBy: string
  activeTab: 'agents' | 'repository' | 'workflows-of-workflows'
  onCategoryChange: (category: string) => void
  onSearchChange: (query: string) => void
  onSortChange: (sortBy: string) => void
  onSearch: () => void
}

const TEMPLATE_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'content_creation', label: 'Content Creation' },
  { value: 'data_analysis', label: 'Data Analysis' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'research', label: 'Research' },
  { value: 'automation', label: 'Automation' },
  { value: 'education', label: 'Education' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
]

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'rating', label: 'Highest Rated' },
]

export function TemplateFilters({
  category,
  searchQuery,
  sortBy,
  activeTab,
  onCategoryChange,
  onSearchChange,
  onSortChange,
  onSearch,
}: TemplateFiltersProps) {

  return (
    <div className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="category-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Category:
            </label>
            <select
              id="category-select"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {TEMPLATE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder={
                activeTab === 'agents' 
                  ? "Search agents..." 
                  : activeTab === 'workflows-of-workflows'
                  ? "Search workflows of workflows..."
                  : "Search workflows..."
              }
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearch()
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Sort:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={onSearch}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  )
}
