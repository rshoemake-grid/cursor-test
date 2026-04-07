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
  TabBarClearBtn,
  TabBarExecuteBtn,
  TabBarPublishBtn,
  TabBarNewBtn,
  TabBarNewLabel,
} from "../styles/tabBar.styled";

function TabBar({
  tabs,
  activeTabId,
  editingTabId,
  editingName,
  editingInputRef,
  setEditingName,
  onTabClick,
  onTabDoubleClick,
  onCloseTab,
  onInputBlur,
  onInputKeyDown,
  onNewWorkflow,
  onSave,
  onClearWorkflow,
  onExecute,
  onPublish,
  onExport,
}) {
  return (
    <TabBarRoot>
      <TabBarScroll>
        {tabs.map((tab) => (
          <TabBarTabBtn
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            onDoubleClick={(event) => onTabDoubleClick(tab, event)}
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
                onClick={(e) => onCloseTab(tab.id, e)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCloseTab(tab.id, e);
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
        <TabBarGhostBtn type="button" onClick={onSave} title="Save workflow">
          Save
        </TabBarGhostBtn>
        <TabBarClearBtn
          type="button"
          onClick={onClearWorkflow}
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
        <TabBarNewBtn onClick={onNewWorkflow} title="New workflow">
          <Plus aria-hidden />
          <TabBarNewLabel>New</TabBarNewLabel>
        </TabBarNewBtn>
      </TabBarActions>
    </TabBarRoot>
  );
}
export { TabBar };
