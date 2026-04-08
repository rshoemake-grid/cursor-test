import { useState } from "react";
import PropTypes from "prop-types";
import { Search, X, Filter } from "lucide-react";
import {
  LogAdvRoot,
  LogAdvInputWrap,
  LogAdvSearchIcon,
  LogAdvInput,
  LogAdvClearBtn,
  LogAdvToggleBtn,
} from "../../styles/logComponents.styled";

function AdvancedSearch({
  value,
  onSearch,
  onClear,
  placeholder = "Search executions...",
  showAdvanced = false,
  onToggleAdvanced,
}) {
  const [searchQuery, setSearchQuery] = useState(value);
  const handleChange = (e) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onSearch(newValue);
  };
  const handleClear = () => {
    setSearchQuery("");
    onClear();
  };
  return (
    <LogAdvRoot>
      <LogAdvInputWrap>
        <LogAdvSearchIcon>
          <Search aria-hidden />
        </LogAdvSearchIcon>
        <LogAdvInput
          type="text"
          value={searchQuery}
          onChange={handleChange}
          placeholder={placeholder}
        />
        {searchQuery && (
          <LogAdvClearBtn onClick={handleClear} aria-label="Clear search">
            <X aria-hidden />
          </LogAdvClearBtn>
        )}
      </LogAdvInputWrap>
      {onToggleAdvanced && (
        <LogAdvToggleBtn
          type="button"
          onClick={onToggleAdvanced}
          $active={showAdvanced}
        >
          <Filter aria-hidden />
          {showAdvanced ? "Hide" : "Show"} Advanced Filters
        </LogAdvToggleBtn>
      )}
    </LogAdvRoot>
  );
}

AdvancedSearch.propTypes = {
  value: PropTypes.string.isRequired,
  onSearch: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  showAdvanced: PropTypes.bool,
  onToggleAdvanced: PropTypes.func,
};

export { AdvancedSearch as default };
