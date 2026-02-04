#!/bin/bash

# Script to identify and remove outdated MD files

echo "=== Identifying Outdated MD Files ==="
echo ""

# Files to remove - temporary status/progress files
FILES_TO_REMOVE=(
    # Temporary status files
    "frontend/MUTATION_TEST_LIVE_STATUS.md"
    "frontend/MUTATION_TEST_MONITORING_STATUS.md"
    "frontend/MUTATION_TEST_MONITORING_INSTRUCTIONS.md"
    "frontend/src/hooks/MUTATION_TEST_MONITORING.md"
    "frontend/src/hooks/MUTATION_TEST_STATUS.md"
    "frontend/src/hooks/MUTATION_TEST_STATUS_UPDATE.md"
    "frontend/src/hooks/MUTATION_TEST_PROGRESS.md"
    
    # Phase status files (outdated)
    "frontend/PHASE_2_PROGRESS.md"
    "frontend/src/hooks/PHASE_4_STATUS.md"
    "frontend/src/hooks/PHASE_4_PROGRESS.md"
    "frontend/src/hooks/PHASE_4_MILESTONE.md"
    "frontend/src/hooks/PHASE_4_FINAL_STATUS.md"
    "frontend/src/hooks/PHASE_4_PLAN.md"
    
    # Phase completion files (historical, keep latest summary only)
    "frontend/PHASE_2_COMPLETE.md"
    "frontend/src/hooks/PHASE_4_COMPLETE.md"
    "frontend/src/hooks/PHASE1_COMPLETE.md"
    "frontend/src/hooks/PHASE_1_2_COMPLETE.md"
    "frontend/src/hooks/PHASE_3_SUMMARY.md"
    "frontend/src/hooks/PHASE_3_FINAL_REPORT.md"
    
    # Outdated test result summaries
    "frontend/MUTATION_TEST_RESULTS_SUMMARY.md"
    "frontend/MUTATION_TEST_RESULTS_REPORT.md"
    "frontend/MUTATION_TEST_RESULTS_PHASE4.md"
    "frontend/src/hooks/MUTATION_TEST_RESULTS_PHASE2.md"
    "frontend/src/hooks/MUTATION_TEST_RESULTS_ANALYSIS.md"
    "frontend/MUTATION_TEST_RESULTS_ANALYSIS.md"
    
    # Outdated progress tracking
    "frontend/SURVIVING_MUTANTS_PROGRESS.md"
    "frontend/SURVIVING_MUTANTS_FINAL_PROGRESS.md"
    "frontend/SURVIVING_MUTANTS_PRIORITY.md"
    
    # Outdated summaries
    "frontend/src/hooks/MUTATION_IMPROVEMENT_SUMMARY.md"
    "frontend/src/hooks/MUTATION_IMPROVEMENT_PLAN.md"
    "frontend/MUTATION_IMPROVEMENTS.md"
    "frontend/MUTATION_TEST_IMPROVEMENTS.md"
    "frontend/MUTATION_TEST_FIXES.md"
    "frontend/MUTATION_CRASH_FIXES.md"
    
    # Outdated test summaries
    "frontend/TEST_RESULTS_SUMMARY.md"
    "frontend/TEST_RESULTS_ANALYSIS.md"
    "frontend/TEST_EXECUTION_SUMMARY.md"
    "frontend/TEST_VERIFICATION_COMPLETE.md"
    "frontend/FINAL_TEST_CONFIRMATION.md"
    "frontend/src/hooks/MUTATION_TEST_COMPLETE.md"
    "frontend/MUTATION_TESTING_COMPLETE.md"
    
    # Outdated analysis
    "frontend/TIMEOUT_ANALYSIS.md"
    "frontend/TIMEOUT_IMPLEMENTATION_SUMMARY.md"
    "frontend/MUTATION_TEST_ANALYSIS.md"
    "frontend/MUTATION_100_PERCENT_PLAN.md"
    
    # Outdated completion summaries
    "frontend/src/hooks/FINAL_SUMMARY.md"
    "frontend/src/hooks/COMPLETE_PROJECT_SUMMARY.md"
    "frontend/src/hooks/CONTINUED_IMPROVEMENTS.md"
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
