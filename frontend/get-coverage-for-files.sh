#!/bin/bash

# Extract coverage for specific files from test output

echo "=== Coverage Report for Files with Most Unkilled Mutants ==="
echo ""

# Run coverage and extract specific files
npm run test:coverage 2>&1 | grep -E "^\s+(useWebSocket|useMarketplaceData|useTemplateOperations|useMarketplaceIntegration|useExecutionManagement|adapters|useLocalStorage|useTabOperations|useLLMProviders|useKeyboardShortcuts|storageHelpers|useTabInitialization)" | while read line; do
    echo "$line"
done

echo ""
echo "Format: File | Statements% | Branches% | Functions% | Lines% | Uncovered Lines"
echo ""
