import { useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  useInputFieldSync,
  useInputFieldSyncSimple,
} from "../../../hooks/utils/useInputFieldSync";
import {
  INPUT_MODE,
  EMPTY_STRING,
  DEFAULT_OVERWRITE,
} from "../../../hooks/utils/inputDefaults";
import {
  createTextInputHandler,
  createSelectHandler,
  createCheckboxHandler,
} from "../../../hooks/utils/inputEditorHelpers";
import { CONFIG_FIELD } from "./inputEditorConstants";
import {
  EditorSectionRoot,
  EditorSectionTitle,
  EditorFieldGroup,
  EditorLabel,
  EditorSelect,
  EditorInput,
  EditorCheckboxRow,
  EditorCheckbox,
  EditorCheckboxCaption,
  EditorSecondaryFullButton,
} from "../../../styles/editorForm.styled";
import { LocalFileObjectPickerDialog } from "./storageObjectPickers";

function LocalFileSystemEditor({ node, onConfigUpdate }) {
  const inputConfig = node.data.input_config || {};
  const filePathRef = useRef(null);
  const filePatternRef = useRef(null);
  const [filePathValue, setFilePathValue] = useInputFieldSync(
    filePathRef,
    inputConfig.file_path,
    EMPTY_STRING,
  );
  const [filePatternValue, setFilePatternValue] = useInputFieldSync(
    filePatternRef,
    inputConfig.file_pattern,
    EMPTY_STRING,
  );
  const [modeValue, setModeValue] = useInputFieldSyncSimple(
    inputConfig.mode,
    INPUT_MODE.READ,
  );
  const [overwriteValue, setOverwriteValue] = useInputFieldSyncSimple(
    inputConfig.overwrite,
    DEFAULT_OVERWRITE,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSession, setPickerSession] = useState(0);
  const openFilePicker = useCallback(() => {
    setPickerSession((s) => s + 1);
    setPickerOpen(true);
  }, []);
  const handlePickedPath = useCallback(
    (path) => {
      setFilePathValue(path);
      onConfigUpdate(CONFIG_FIELD, "file_path", path);
    },
    [onConfigUpdate, setFilePathValue],
  );
  return (
    <EditorSectionRoot>
      <EditorSectionTitle>Local File System Configuration</EditorSectionTitle>
      <EditorFieldGroup $mb="sm">
        <EditorLabel htmlFor="filesystem-mode">Mode</EditorLabel>
        <EditorSelect
          id="filesystem-mode"
          value={modeValue}
          onChange={createSelectHandler(
            setModeValue,
            onConfigUpdate,
            CONFIG_FIELD,
            "mode",
          )}
          aria-label="Select file system operation mode"
        >
          <option value={INPUT_MODE.READ}>Read from file</option>
          <option value={INPUT_MODE.WRITE}>Write to file</option>
        </EditorSelect>
      </EditorFieldGroup>
      <EditorFieldGroup>
        <EditorLabel htmlFor="filesystem-path">File Path</EditorLabel>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "stretch",
          }}
        >
          <EditorInput
            id="filesystem-path"
            ref={filePathRef}
            type="text"
            value={filePathValue}
            onChange={createTextInputHandler(
              setFilePathValue,
              onConfigUpdate,
              CONFIG_FIELD,
              "file_path",
            )}
            placeholder="/path/to/file.txt"
            aria-label="File system path"
            style={{ flex: 1, minWidth: 0 }}
          />
          <EditorSecondaryFullButton
            type="button"
            onClick={openFilePicker}
            aria-label="Browse server filesystem for a file"
            style={{
              width: "auto",
              flexShrink: 0,
              whiteSpace: "nowrap",
              alignSelf: "stretch",
            }}
          >
            Browse…
          </EditorSecondaryFullButton>
        </div>
      </EditorFieldGroup>
      {pickerOpen ? (
        <LocalFileObjectPickerDialog
          key={pickerSession}
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          initialFilePath={filePathValue}
          onSelectFile={handlePickedPath}
        />
      ) : null}
      {modeValue === INPUT_MODE.READ && (
        <EditorFieldGroup $mt="sm">
          <EditorLabel htmlFor="filesystem-pattern">
            File Pattern (optional)
          </EditorLabel>
          <EditorInput
            id="filesystem-pattern"
            ref={filePatternRef}
            type="text"
            value={filePatternValue}
            onChange={createTextInputHandler(
              setFilePatternValue,
              onConfigUpdate,
              CONFIG_FIELD,
              "file_pattern",
            )}
            placeholder="*.txt or leave blank for exact match"
            aria-label="File pattern for matching"
          />
        </EditorFieldGroup>
      )}
      {modeValue === INPUT_MODE.WRITE && (
        <EditorFieldGroup $mt="sm">
          <EditorCheckboxRow htmlFor="filesystem-overwrite">
            <EditorCheckbox
              id="filesystem-overwrite"
              type="checkbox"
              checked={overwriteValue}
              onChange={createCheckboxHandler(
                setOverwriteValue,
                onConfigUpdate,
                CONFIG_FIELD,
                "overwrite",
              )}
              aria-label="Overwrite existing file"
            />
            <EditorCheckboxCaption>
              Overwrite existing file
            </EditorCheckboxCaption>
          </EditorCheckboxRow>
        </EditorFieldGroup>
      )}
    </EditorSectionRoot>
  );
}
LocalFileSystemEditor.propTypes = {
  node: PropTypes.object.isRequired,
  onConfigUpdate: PropTypes.func.isRequired,
};

export { LocalFileSystemEditor as default };
