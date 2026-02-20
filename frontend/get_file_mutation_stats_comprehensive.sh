#!/bin/bash

# Comprehensive File-Level Mutation Statistics Extractor
# Combines features from get-file-mutation-stats.sh and extract-file-mutations.sh
# Extracts file-level mutation statistics from completed test

set -e

echo "=== Mutation Test File Analysis ==="
echo ""

# Support multiple log file locations
LOG_FILE="${MUTATION_LOG_FILE:-mutation-test-output.log}"
if [ ! -f "$LOG_FILE" ]; then
    LOG_FILE="${MUTATION_LOG_FILE:-stryker.log}"
fi
if [ ! -f "$LOG_FILE" ]; then
    LOG_FILE="${MUTATION_LOG_FILE:-mutation_test.log}"
fi

HTML_REPORT="reports/mutation/mutation.html"
if [ ! -f "$HTML_REPORT" ]; then
    HTML_REPORT="reports/mutation/html/index.html"
fi

# Check if test is complete
if [ -f "$LOG_FILE" ] && tail -20 "$LOG_FILE" | grep -q "Mutation score\|All tests completed\|Done in"; then
    echo "✓ Mutation test completed"
    echo ""
    
    # Try to parse HTML report (preferred method - most accurate)
    if [ -f "$HTML_REPORT" ]; then
        echo "Analyzing HTML report (most accurate method)..."
        echo ""
        
        # Try Node.js parser first
        if command -v node > /dev/null 2>&1 && [ -f "analyze-mutation-by-file.js" ]; then
            node analyze-mutation-by-file.js 2>/dev/null && exit 0
        fi
        
        # Fallback to Python parser
        python3 << 'PYTHON'
import re
import json
from collections import defaultdict
import sys

try:
    html_file = sys.argv[1] if len(sys.argv) > 1 else 'reports/mutation/mutation.html'
    with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()
    
    # Try multiple patterns to extract JSON
    patterns = [
        r'app\.report\s*=\s*({.*?});',
        r'const report\s*=\s*({.*?});',
        r'window\.report\s*=\s*({.*?});'
    ]
    
    data = None
    for pattern in patterns:
        match = re.search(pattern, html, re.DOTALL)
        if match:
            try:
                json_str = match.group(1)
                # Clean up common issues
                json_str = json_str.replace('undefined', 'null')
                json_str = re.sub(r',\s*}', '}', json_str)
                json_str = re.sub(r',\s*]', ']', json_str)
                data = json.loads(json_str)
                break
            except:
                continue
    
    if not data:
        print("Could not parse HTML report. Falling back to log file analysis.")
        sys.exit(1)
    
    # Calculate file stats
    file_stats = []
    if 'files' in data:
        for file_path, file_data in data['files'].items():
            mutants = file_data.get('mutants', [])
            stats = {
                'file': file_path,
                'survived': sum(1 for m in mutants if m.get('status') == 'Survived'),
                'killed': sum(1 for m in mutants if m.get('status') == 'Killed'),
                'timeout': sum(1 for m in mutants if m.get('status') == 'Timeout'),
                'noCoverage': sum(1 for m in mutants if m.get('status') == 'NoCoverage'),
                'error': sum(1 for m in mutants if m.get('status') == 'Error'),
                'total': len(mutants)
            }
            stats['unkilled'] = stats['survived'] + stats['timeout'] + stats['noCoverage'] + stats['error']
            if stats['killed'] + stats['survived'] > 0:
                stats['score'] = (stats['killed'] / (stats['killed'] + stats['survived'])) * 100
            else:
                stats['score'] = 0
            file_stats.append(stats)
    
    # Sort by unkilled (survived + timeout + noCoverage + error)
    file_stats.sort(key=lambda x: x['unkilled'], reverse=True)
    
    print('\nTop 30 files by unkilled mutants:')
    print('=' * 120)
    print(f"{'File':<60} {'Survived':<10} {'Timeout':<10} {'NoCov':<10} {'Error':<10} {'Unkilled':<12} {'Score%':<10} {'Total':<10}")
    print('-' * 120)
    for f in file_stats[:30]:
        file_name = f['file'][:58] if len(f['file']) <= 58 else '...' + f['file'][-55:]
        print(f"{file_name:<60} {f['survived']:<10} {f['timeout']:<10} {f['noCoverage']:<10} {f['error']:<10} {f['unkilled']:<12} {f['score']:.1f:<10} {f['total']:<10}")
    
    print('\n=== Summary ===')
    total_survived = sum(f['survived'] for f in file_stats)
    total_timeout = sum(f['timeout'] for f in file_stats)
    total_no_cov = sum(f['noCoverage'] for f in file_stats)
    total_error = sum(f['error'] for f in file_stats)
    total_killed = sum(f['killed'] for f in file_stats)
    
    print(f"Total Survived: {total_survived}")
    print(f"Total Timeout: {total_timeout}")
    print(f"Total No Coverage: {total_no_cov}")
    print(f"Total Error: {total_error}")
    print(f"Total Unkilled: {total_survived + total_timeout + total_no_cov + total_error}")
    print(f"Total Killed: {total_killed}")
    if total_killed + total_survived > 0:
        print(f"Overall Mutation Score: {((total_killed / (total_killed + total_survived)) * 100):.2f}%")
    
except Exception as e:
    print(f"Error parsing HTML report: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON
        HTML_REPORT
        
        if [ $? -eq 0 ]; then
            exit 0
        fi
    fi
    
    # Fallback to log file analysis (less accurate but works)
    echo "HTML report not found or parsing failed. Using log file analysis (approximation)..."
    echo ""
    
    if [ -f "$LOG_FILE" ]; then
        # Extract file paths and their mutation statuses from log
        tail -200000 "$LOG_FILE" 2>/dev/null | \
            grep -E "(survived|killed|timeout|NoCoverage)" | \
            grep -E "src/" | \
            grep -v "TRACE" | \
            sed -E 's/.*(src\/[^[:space:]]+\.(ts|tsx)).*/\1/' | \
            sort | uniq -c | sort -rn > /tmp/file_mutations.txt
        
        echo "Files with most mutations (from log analysis - approximation):"
        echo "Count  File"
        echo "-----  ----"
        head -30 /tmp/file_mutations.txt
        
        echo ""
        echo "Note: This is an approximation based on log file analysis."
        echo "For accurate results, use the HTML report parser when available."
    fi
else
    echo "Mutation test still running or log file not found..."
    if [ -f "$LOG_FILE" ]; then
        echo "Current progress:"
        tail -3 "$LOG_FILE" | grep "Mutation testing" | tail -1 || tail -1 "$LOG_FILE"
    fi
    echo ""
    echo "Run this script again once the test completes."
    exit 1
fi

echo ""
echo "=== HTML Report Location ==="
if [ -f "$HTML_REPORT" ]; then
    echo "file://$(pwd)/$HTML_REPORT"
else
    echo "HTML report not found at: $HTML_REPORT"
    echo "Check: reports/mutation/ directory"
fi
