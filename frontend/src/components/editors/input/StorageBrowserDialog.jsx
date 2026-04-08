import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Folder, FileText, ChevronUp, RefreshCw } from "lucide-react";
import {
  StoragePickerOverlay,
  StoragePickerPanel,
  StoragePickerHeader,
  StoragePickerTitle,
  StoragePickerSubtitle,
  StoragePickerClose,
  StoragePickerToolbar,
  StoragePickerPath,
  StoragePickerToolbarBtn,
  StoragePickerList,
  StoragePickerRow,
  StoragePickerRowMeta,
  StoragePickerFooter,
  StoragePickerPrimaryBtn,
  StoragePickerMessage,
} from "../../../styles/storageBrowserPicker.styled";
import {
  parentLocalDirectory,
  parentObjectKeyPrefix,
  formatStorageSize,
} from "../../../utils/storageBrowserPaths";

/**
 * Shared modal to browse storage: GCS/S3 key prefixes or server local directories.
 *
 * @param {Object} props
 * @param {'keyPrefix'|'localDirectory'|'bucketList'} props.variant
 * @param {function(string=): Promise<{prefixes: string[], objects: Array, canGoUp?: boolean}>} props.fetchPage
 */
function StorageBrowserDialog({
  isOpen,
  onClose,
  title,
  resourceSubtitle,
  titleId = "storage-browser-title",
  variant,
  initialLocation,
  prereqError,
  fetchPage,
  onSelectFile,
  selectButtonLabel = "Use selected file",
  emptyFolderMessage = "This folder is empty.",
  listPathLabel = "All accessible buckets",
}) {
  const [location, setLocation] = useState(initialLocation || "");
  const [prefixes, setPrefixes] = useState([]);
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedName, setSelectedName] = useState(null);
  const [canGoUp, setCanGoUp] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    setLocation(variant === "bucketList" ? "" : initialLocation || "");
    setSelectedName(null);
    setError("");
    return undefined;
  }, [isOpen, initialLocation, variant]);

  const load = useCallback(async () => {
    if (prereqError) {
      setError(prereqError);
      setPrefixes([]);
      setObjects([]);
      setCanGoUp(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      let data;
      if (variant === "bucketList") {
        data = await fetchPage();
        setPrefixes([]);
        setObjects(data.objects || []);
        setCanGoUp(false);
      } else {
        const loc =
          variant === "localDirectory"
            ? (location || "").replace(/\/+$/, "")
            : location;
        data = await fetchPage(loc);
        setPrefixes(data.prefixes || []);
        setObjects(data.objects || []);
        if (variant === "localDirectory") {
          setCanGoUp(Boolean(data.canGoUp));
          if (data.currentDirectory != null && data.currentDirectory !== "") {
            const canon = String(data.currentDirectory).replace(/\/+$/, "");
            setLocation((prev) => (prev === canon ? prev : canon));
          }
        } else {
          setCanGoUp(Boolean(loc));
        }
      }
    } catch (e) {
      const status = e.response?.status;
      if (status === 401) {
        setError("Sign in to browse storage.");
      } else {
        setError(e.message || "Failed to load listing.");
      }
      setPrefixes([]);
      setObjects([]);
      setCanGoUp(false);
    } finally {
      setLoading(false);
    }
  }, [prereqError, variant, location, fetchPage]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    load();
    return undefined;
  }, [isOpen, load]);

  const goUp = useCallback(() => {
    if (variant === "bucketList") {
      return;
    }
    if (variant === "localDirectory") {
      const cur = (location || "").replace(/\/+$/, "");
      setLocation(parentLocalDirectory(cur));
    } else {
      setLocation(parentObjectKeyPrefix(location));
    }
    setSelectedName(null);
  }, [variant, location]);

  const pathToolbarLabel =
    variant === "bucketList"
      ? listPathLabel
      : variant === "localDirectory"
        ? location
          ? location.replace(/\/+$/, "") || "/"
          : "(server base directory)"
        : location || "/";

  const handleSelectFile = useCallback((fullName) => {
    setSelectedName(fullName);
  }, []);

  const applySelection = useCallback(() => {
    if (selectedName) {
      onSelectFile(selectedName);
      onClose();
    }
  }, [selectedName, onSelectFile, onClose]);

  const handleRowActivate = useCallback(
    (kind, value) => {
      if (kind === "prefix") {
        if (variant === "localDirectory") {
          setLocation(value.replace(/\/+$/, ""));
        } else {
          setLocation(value);
        }
        setSelectedName(null);
        return;
      }
      onSelectFile(value);
      onClose();
    },
    [variant, onSelectFile, onClose],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <StoragePickerOverlay
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <StoragePickerPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <StoragePickerHeader>
          <div>
            <StoragePickerTitle id={titleId}>{title}</StoragePickerTitle>
            {resourceSubtitle ? (
              <StoragePickerSubtitle>{resourceSubtitle}</StoragePickerSubtitle>
            ) : null}
          </div>
          <StoragePickerClose type="button" onClick={onClose} aria-label="Close">
            Close
          </StoragePickerClose>
        </StoragePickerHeader>
        <StoragePickerToolbar>
          <StoragePickerToolbarBtn
            type="button"
            disabled={variant === "bucketList" || !canGoUp || loading}
            onClick={goUp}
            aria-label="Parent folder"
          >
            <ChevronUp
              aria-hidden
              style={{ width: "1rem", height: "1rem", verticalAlign: "middle" }}
            />{" "}
            Up
          </StoragePickerToolbarBtn>
          <StoragePickerToolbarBtn
            type="button"
            disabled={loading}
            onClick={() => load()}
            aria-label="Refresh list"
          >
            <RefreshCw
              aria-hidden
              style={{ width: "1rem", height: "1rem", verticalAlign: "middle" }}
            />{" "}
            Refresh
          </StoragePickerToolbarBtn>
          <StoragePickerPath title={pathToolbarLabel}>{pathToolbarLabel}</StoragePickerPath>
        </StoragePickerToolbar>
        {error ? (
          <StoragePickerMessage $error role="alert">
            {error}
          </StoragePickerMessage>
        ) : null}
        {loading && !error ? (
          <StoragePickerMessage>Loading…</StoragePickerMessage>
        ) : null}
        {!loading && !error ? (
          <StoragePickerList
            aria-label={
              variant === "bucketList" ? "Bucket list" : "Folder contents"
            }
          >
            {prefixes.map((p) => (
              <StoragePickerRow
                key={`pre-${p}`}
                $selected={false}
                onClick={() => handleRowActivate("prefix", p)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleRowActivate("prefix", p);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <Folder
                  aria-hidden
                  style={{
                    width: "1rem",
                    height: "1rem",
                    color: "#ca8a04",
                    flexShrink: 0,
                  }}
                />
                {variant === "localDirectory" || !location
                  ? p.replace(/\/+$/, "").split("/").filter(Boolean).slice(-1)[0] ||
                    p
                  : p.length > location.length
                    ? p.slice(location.length)
                    : p}
                <StoragePickerRowMeta>folder</StoragePickerRowMeta>
              </StoragePickerRow>
            ))}
            {objects.map((obj) => (
              <StoragePickerRow
                key={obj.name}
                $selected={selectedName === obj.name}
                onClick={() => handleSelectFile(obj.name)}
                onDoubleClick={() => handleRowActivate("object", obj.name)}
                role="option"
                aria-selected={selectedName === obj.name}
              >
                <FileText
                  aria-hidden
                  style={{
                    width: "1rem",
                    height: "1rem",
                    flexShrink: 0,
                  }}
                />
                {obj.display_name || obj.name}
                <StoragePickerRowMeta>
                  {formatStorageSize(obj.size)}
                  {obj.updated ? ` · ${obj.updated.slice(0, 10)}` : ""}
                </StoragePickerRowMeta>
              </StoragePickerRow>
            ))}
            {prefixes.length === 0 && objects.length === 0 ? (
              <StoragePickerMessage>{emptyFolderMessage}</StoragePickerMessage>
            ) : null}
          </StoragePickerList>
        ) : null}
        <StoragePickerFooter>
          <StoragePickerToolbarBtn type="button" onClick={onClose}>
            Cancel
          </StoragePickerToolbarBtn>
          <StoragePickerPrimaryBtn
            type="button"
            disabled={!selectedName}
            onClick={applySelection}
          >
            {selectButtonLabel}
          </StoragePickerPrimaryBtn>
        </StoragePickerFooter>
      </StoragePickerPanel>
    </StoragePickerOverlay>
  );
}

StorageBrowserDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  resourceSubtitle: PropTypes.string,
  titleId: PropTypes.string,
  variant: PropTypes.oneOf(["keyPrefix", "localDirectory", "bucketList"])
    .isRequired,
  initialLocation: PropTypes.string,
  prereqError: PropTypes.string,
  fetchPage: PropTypes.func.isRequired,
  onSelectFile: PropTypes.func.isRequired,
  selectButtonLabel: PropTypes.string,
  emptyFolderMessage: PropTypes.string,
  listPathLabel: PropTypes.string,
};

export { StorageBrowserDialog as default };
