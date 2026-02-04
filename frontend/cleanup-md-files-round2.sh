#!/bin/bash

# Second round of cleanup - analysis files and other outdated docs

FILES_TO_REMOVE=(
    # Analysis files (outdated, work already done)
    "frontend/src/hooks/useWebSocket.analysis.md"
    "frontend/src/hooks/useTemplateOperations.analysis.md"
    "frontend/src/hooks/useLLMProviders.analysis.md"
    "frontend/src/hooks/useCanvasEvents.analysis.md"
    "frontend/src/hooks/useExecutionManagement.analysis.md"
    "frontend/src/hooks/useMarketplaceIntegration.analysis.md"
    "frontend/src/components/editors/InputNodeEditor.analysis.md"
    "frontend/src/utils/workflowFormat.analysis.md"
    
    # Outdated completion summaries
    "frontend/ERROR_FACTORY_EXTRACTION_COMPLETE.md"
    "frontend/STABILITY_FIXES_SUMMARY.md"
    "frontend/IMPROVEMENTS_SUMMARY.md"
    
    # Outdated refactoring/analysis docs
    "frontend/REFACTORING_PHASE_4_SUMMARY.md"
    "frontend/REFACTORING_SUMMARY.md"
    "frontend/WORKFLOW_BUILDER_REFACTORING_ANALYSIS.md"
    "frontend/CODE_QUALITY_ANALYSIS.md"
    "frontend/REACT_BEST_PRACTICES_ANALYSIS.md"
    "frontend/REACT_BEST_PRACTICES_QUICK_REFERENCE.md"
    "frontend/LEGACY_CODE_DOCUMENTATION.md"
    "frontend/RECOMMENDATIONS_WORKFLOWTABS_STATE.md"
    "frontend/DRY_SOLID_RECOMMENDATIONS.md"
    "frontend/DEPENDENCY_INJECTION_RECOMMENDATIONS.md"
    
    # Outdated coverage/planning docs
    "frontend/COVERAGE_80_PERCENT_PLAN.md"
    "frontend/TEST_COVERAGE_ASSESSMENT.md"
    "frontend/FILES_NEEDING_IMPROVEMENT.md"
)

echo "Files to remove:"
for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (not found)"
    fi
done

echo ""
read -p "Remove these files? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Removing files..."
    for file in "${FILES_TO_REMOVE[@]}"; do
        if [ -f "$file" ]; then
            rm "$file"
            echo "  Removed: $file"
        fi
    done
    echo ""
    echo "✓ Cleanup complete!"
else
    echo "Cancelled."
fi
