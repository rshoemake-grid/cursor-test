import PropTypes from "prop-types";
import { X, Plus } from "lucide-react";
import {
  TabBarRoot,
  TabBarScroll,
  TabBarTabBtn,
  TabBarUnsavedDot,
  TabBarTabLabel,
  TabBarRenameInput,
  TabBarCloseTab,
  TabBarActions,
  TabBarGhostBtn,
  TabBarSaveBtn,
  TabBarClearBtn,
  TabBarExecuteBtn,
  TabBarPublishBtn,
  TabBarNewBtn,
  TabBarNewLabel,
} from "../styles/tabBar.styled";

function TabBar({ tabs, tabState, tabActions, inputProps, workflowActions }) {
  const { activeTabId, editingTabId, editingName } = tabState;
  const {
    setActiveTabId,
    setEditingName,
    startEditingTabName,
    handleCloseTab,
  } = tabActions;
  const {
    editingInputRef,
    onBlur: onInputBlur,
    onKeyDown: onInputKeyDown,
  } = inputProps;
  const {
    onNew,
    onSave,
    onClear,
    onExecute,
    onPublish,
    onExport,
  } = workflowActions;
  return (
    <TabBarRoot>
      <TabBarScroll>
        {tabs.map((tab) => (
          <TabBarTabBtn
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            onDoubleClick={(event) => startEditingTabName(tab, event)}
            $active={tab.id === activeTabId}
          >
            {tab.isUnsaved && <TabBarUnsavedDot />}
            <TabBarTabLabel>
              {editingTabId === tab.id ? (
                <TabBarRenameInput
                  ref={editingInputRef}
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  onBlur={() => onInputBlur(tab.id)}
                  onKeyDown={(event) => onInputKeyDown(tab.id, event)}
                  onClick={(event) => event.stopPropagation()}
                />
              ) : (
                tab.name
              )}
            </TabBarTabLabel>
            {tabs.length > 1 && (
              <TabBarCloseTab
                onClick={(e) => handleCloseTab(tab.id, e)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCloseTab(tab.id, e);
                  }
                }}
              >
                <X aria-hidden />
              </TabBarCloseTab>
            )}
          </TabBarTabBtn>
        ))}
      </TabBarScroll>
      <TabBarActions>
        <TabBarSaveBtn type="button" onClick={onSave} title="Save workflow">
          Save
        </TabBarSaveBtn>
        <TabBarClearBtn
          type="button"
          onClick={onClear}
          title="Clear all nodes, edges, and variables from the canvas"
        >
          Clear workflow
        </TabBarClearBtn>
        <TabBarExecuteBtn type="button" onClick={onExecute} title="Execute workflow">
          Execute
        </TabBarExecuteBtn>
        <TabBarPublishBtn type="button" onClick={onPublish} title="Publish workflow">
          Publish
        </TabBarPublishBtn>
        <TabBarGhostBtn type="button" onClick={onExport} title="Export workflow">
          Export
        </TabBarGhostBtn>
        <TabBarNewBtn onClick={onNew} title="New workflow">
          <Plus aria-hidden />
          <TabBarNewLabel>New</TabBarNewLabel>
        </TabBarNewBtn>
      </TabBarActions>
    </TabBarRoot>
  );
}

const tabShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  isUnsaved: PropTypes.bool,
});

TabBar.propTypes = {
  tabs: PropTypes.arrayOf(tabShape).isRequired,
  tabState: PropTypes.shape({
    activeTabId: PropTypes.string,
    editingTabId: PropTypes.string,
    editingName: PropTypes.string,
  }).isRequired,
  tabActions: PropTypes.shape({
    setActiveTabId: PropTypes.func.isRequired,
    setEditingName: PropTypes.func.isRequired,
    startEditingTabName: PropTypes.func.isRequired,
    handleCloseTab: PropTypes.func.isRequired,
  }).isRequired,
  inputProps: PropTypes.shape({
    editingInputRef: PropTypes.shape({ current: PropTypes.any }),
    onBlur: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func.isRequired,
  }).isRequired,
  workflowActions: PropTypes.shape({
    onNew: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
    onExecute: PropTypes.func.isRequired,
    onPublish: PropTypes.func.isRequired,
    onExport: PropTypes.func.isRequired,
  }).isRequired,
};

export { TabBar };
