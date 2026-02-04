#!/bin/bash

# Script to extract file-level mutation statistics from completed test

echo "=== Mutation Test File Analysis ==="
echo ""

# Check if test is complete
if tail -20 mutation-test-output.log | grep -q "Mutation score\|All tests completed"; then
    echo "✓ Mutation test completed"
    echo ""
    
    # Try to parse HTML report
    if [ -f "reports/mutation/mutation.html" ]; then
        echo "Analyzing HTML report..."
        node analyze-mutation-by-file.js 2>/dev/null || {
            echo "Using Python parser..."
            python3 << 'PYTHON'
import re
import json
from collections import defaultdict

try:
    with open('reports/mutation/mutation.html', 'r', encoding='utf-8', errors='ignore') as f:
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
        print("Could not parse HTML report. Please check reports/mutation/mutation.html manually.")
        exit(1)
    
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
                'total': len(mutants)
            }
            stats['unkilled'] = stats['survived'] + stats['timeout'] + stats['noCoverage']
            if stats['killed'] + stats['survived'] > 0:
                stats['score'] = (stats['killed'] / (stats['killed'] + stats['survived'])) * 100
            else:
                stats['score'] = 0
            file_stats.append(stats)
    
    # Sort by unkilled (survived + timeout + noCoverage)
    file_stats.sort(key=lambda x: x['unkilled'], reverse=True)
    
    print('\nTop 30 files by unkilled mutants:')
    print('=' * 110)
    print(f"{'File':<60} {'Survived':<10} {'Timeout':<10} {'NoCov':<10} {'Unkilled':<12} {'Score%':<10} {'Total':<10}")
    print('-' * 110)
    for f in file_stats[:30]:
        file_name = f['file'][:58] if len(f['file']) <= 58 else '...' + f['file'][-55:]
        print(f"{file_name:<60} {f['survived']:<10} {f['timeout']:<10} {f['noCoverage']:<10} {f['unkilled']:<12} {f['score']:.1f:<10} {f['total']:<10}")
    
    print('\n=== Summary ===')
    total_survived = sum(f['survived'] for f in file_stats)
    total_timeout = sum(f['timeout'] for f in file_stats)
    total_no_cov = sum(f['noCoverage'] for f in file_stats)
    total_killed = sum(f['killed'] for f in file_stats)
    
    print(f"Total Survived: {total_survived}")
    print(f"Total Timeout: {total_timeout}")
    print(f"Total No Coverage: {total_no_cov}")
    print(f"Total Unkilled: {total_survived + total_timeout + total_no_cov}")
    print(f"Total Killed: {total_killed}")
    if total_killed + total_survived > 0:
        print(f"Overall Mutation Score: {((total_killed / (total_killed + total_survived)) * 100):.2f}%")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
PYTHON
        }
    else
        echo "HTML report not found. Waiting for test completion..."
    fi
else
    echo "Mutation test still running..."
    echo "Current progress:"
    tail -3 mutation-test-output.log | grep "Mutation testing" | tail -1
    echo ""
    echo "Run this script again once the test completes."
fi
