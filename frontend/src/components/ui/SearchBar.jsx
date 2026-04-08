import PropTypes from "prop-types";
import { Search, X } from "lucide-react";
import {
  SearchBarRoot,
  SearchBarIconLeft,
  SearchBarInput,
  SearchBarClear,
} from "../../styles/uiComponents.styled";

function SearchBar({
  value,
  placeholder = "Search...",
  onChange,
  onClear,
  className = "",
}) {
  const handleClear = () => {
    onChange("");
    onClear?.();
  };
  return (
    <SearchBarRoot className={className}>
      <SearchBarIconLeft>
        <Search aria-hidden />
      </SearchBarIconLeft>
      <SearchBarInput
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <SearchBarClear
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X aria-hidden />
        </SearchBarClear>
      )}
    </SearchBarRoot>
  );
}

SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func,
  className: PropTypes.string,
};

export { SearchBar as default };
