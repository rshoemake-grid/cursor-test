import PropTypes from "prop-types";
import {
  TEMPLATE_CATEGORIES as CATEGORY_VALUES,
  formatCategory,
} from "../config/templateConstants";
import {
  TemplateFiltersBar,
  TemplateFiltersInner,
  TemplateFiltersRow,
  TemplateFilterGroup,
  TemplateFilterLabel,
  TemplateFilterSelect,
  TemplateSearchGrow,
  TemplateSearchInput,
  TemplateSearchButton,
} from "../styles/templateFilters.styled";

function toTitleCase(s) {
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
const TEMPLATE_CATEGORIES = [
  {
    value: "",
    label: "All Categories",
  },
  ...CATEGORY_VALUES.map((cat) => ({
    value: cat,
    label: toTitleCase(formatCategory(cat)),
  })),
];
const SORT_OPTIONS = [
  {
    value: "popular",
    label: "Most Popular",
  },
  {
    value: "recent",
    label: "Most Recent",
  },
  {
    value: "rating",
    label: "Highest Rated",
  },
];
function TemplateFilters({ filters, handlers }) {
  const { category, searchQuery, sortBy, activeTab } = filters;
  const {
    onCategoryChange,
    onSearchChange,
    onSortChange,
    onSearch,
  } = handlers;
  return (
    <TemplateFiltersBar>
      <TemplateFiltersInner>
        <TemplateFiltersRow>
          <TemplateFilterGroup>
            <TemplateFilterLabel htmlFor="category-select">
              Category:
            </TemplateFilterLabel>
            <TemplateFilterSelect
              id="category-select"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              {TEMPLATE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </TemplateFilterSelect>
          </TemplateFilterGroup>
          <TemplateSearchGrow>
            <TemplateSearchInput
              type="text"
              placeholder={
                activeTab === "agents"
                  ? "Search agents..."
                  : activeTab === "workflows-of-workflows"
                    ? "Search workflows of workflows..."
                    : "Search workflows..."
              }
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSearch();
                }
              }}
            />
          </TemplateSearchGrow>
          <TemplateFilterGroup>
            <TemplateFilterLabel htmlFor="sort-select">Sort:</TemplateFilterLabel>
            <TemplateFilterSelect
              id="sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </TemplateFilterSelect>
          </TemplateFilterGroup>
          <TemplateSearchButton type="button" onClick={onSearch}>
            Search
          </TemplateSearchButton>
        </TemplateFiltersRow>
      </TemplateFiltersInner>
    </TemplateFiltersBar>
  );
}

TemplateFilters.propTypes = {
  filters: PropTypes.shape({
    category: PropTypes.string.isRequired,
    searchQuery: PropTypes.string.isRequired,
    sortBy: PropTypes.string.isRequired,
    activeTab: PropTypes.string.isRequired,
  }).isRequired,
  handlers: PropTypes.shape({
    onCategoryChange: PropTypes.func.isRequired,
    onSearchChange: PropTypes.func.isRequired,
    onSortChange: PropTypes.func.isRequired,
    onSearch: PropTypes.func.isRequired,
  }).isRequired,
};

export { TemplateFilters };
