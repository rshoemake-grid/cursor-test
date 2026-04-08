import {
  AutoSyncSection,
  AutoSyncRow,
  AutoSyncDot,
  AutoSyncText,
  AutoSyncSubText,
} from "../../styles/settings.styled";
function AutoSyncIndicator() {
  return (
    <AutoSyncSection data-testid="auto-sync-section">
      <AutoSyncRow>
        <AutoSyncDot aria-hidden data-testid="auto-sync-dot" />
        <AutoSyncText>
          <strong>Auto-sync enabled:</strong> Settings are automatically saved
          when you make changes.
        </AutoSyncText>
      </AutoSyncRow>
      <AutoSyncSubText>
        Settings are automatically synced to the backend server when you make
        changes.
      </AutoSyncSubText>
    </AutoSyncSection>
  );
}

AutoSyncIndicator.propTypes = {};

export { AutoSyncIndicator };
