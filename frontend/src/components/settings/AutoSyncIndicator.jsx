function AutoSyncIndicator() {
  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <div className="flex items-center gap-3 text-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <p className="text-gray-600">
          <strong>Auto-sync enabled:</strong> Settings are automatically saved
          when you make changes.
        </p>
      </div>
      <p className="mt-3 text-sm text-gray-500">
        Settings are automatically synced to the backend server when you make
        changes.
      </p>
    </div>
  );
}
export { AutoSyncIndicator };
