#!/usr/bin/env python3
"""
Task 6: Mutation Testing Monitor
Checks progress every 5 minutes until completion
"""

import time
import os
import subprocess
import re
from datetime import datetime

LOG_FILE = "mutation_test.log"
PID_FILE = "mutation_test.pid"
CHECK_INTERVAL = 300  # 5 minutes

def is_running():
    """Check if mutation test process is still running"""
    if not os.path.exists(PID_FILE):
        return False
    
    try:
        with open(PID_FILE, 'r') as f:
            pid = int(f.read().strip())
        
        # Check if process exists
        try:
            os.kill(pid, 0)
            return True
        except OSError:
            return False
    except (ValueError, FileNotFoundError):
        return False

def check_crashes():
    """Check log file for crash indicators"""
    if not os.path.exists(LOG_FILE):
        return False, []
    
    crash_patterns = [
        r"ChildProcessCrashedError",
        r"exited unexpectedly",
        r"TypeError.*undefined",
        r"Cannot read properties",
        r"FATAL",
        r"Error:",
    ]
    
    crashes = []
    try:
        with open(LOG_FILE, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            for i, line in enumerate(lines[-200:], start=len(lines)-200):
                for pattern in crash_patterns:
                    if re.search(pattern, line, re.IGNORECASE):
                        crashes.append((i+1, line.strip()))
                        break
    except Exception as e:
        print(f"Error reading log: {e}")
    
    return len(crashes) > 0, crashes[-10:]  # Return last 10 crash lines

def extract_progress():
    """Extract progress information from log file"""
    if not os.path.exists(LOG_FILE):
        return None
    
    try:
        with open(LOG_FILE, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            lines = content.split('\n')
            
        progress = {
            'completed': False,
            'progress_pct': None,
            'killed': None,
            'survived': None,
            'timeout': None,
            'no_coverage': None,
            'error': None,
            'mutation_score': None,
            'tested': None,
            'total_mutants': None,
            'recent_lines': lines[-15:] if len(lines) > 15 else lines
        }
        
        # Check for completion
        if any('Mutation test report' in line or 'Mutation score' in line or 
               'All mutants tested' in line or 'Final mutation score' in line 
               for line in lines[-500:]):
            progress['completed'] = True
        
        # Extract progress percentage
        for line in reversed(lines[-500:]):
            match = re.search(r'(\d+\.?\d*)%', line)
            if match and 'Mutation testing' in line:
                progress['progress_pct'] = match.group(1)
                break
        
        # Extract mutant counts
        for line in reversed(lines[-500:]):
            if 'Killed' in line and 'mutant' in line.lower():
                match = re.search(r'(\d+)', line)
                if match:
                    progress['killed'] = match.group(1)
            if 'Survived' in line and 'mutant' in line.lower():
                match = re.search(r'(\d+)', line)
                if match:
                    progress['survived'] = match.group(1)
            if 'Timeout' in line and 'mutant' in line.lower():
                match = re.search(r'(\d+)', line)
                if match:
                    progress['timeout'] = match.group(1)
            if 'No coverage' in line.lower() and 'mutant' in line.lower():
                match = re.search(r'(\d+)', line)
                if match:
                    progress['no_coverage'] = match.group(1)
            if 'Error' in line and 'mutant' in line.lower():
                match = re.search(r'(\d+)', line)
                if match:
                    progress['error'] = match.group(1)
        
        # Extract mutation score
        for line in reversed(lines[-500:]):
            if 'Mutation score' in line.lower():
                match = re.search(r'(\d+\.?\d*)%', line)
                if match:
                    progress['mutation_score'] = match.group(1)
                    break
        
        # Extract tested/total
        for line in reversed(lines[-500:]):
            if 'tested' in line.lower() and ('/' in line or 'of' in line):
                matches = re.findall(r'(\d+)', line)
                if len(matches) >= 2:
                    progress['tested'] = matches[0]
                    progress['total_mutants'] = matches[1]
                    break
        
        return progress
    except Exception as e:
        print(f"Error extracting progress: {e}")
        return None

def show_progress(iteration, progress, crashed=False):
    """Display progress information"""
    print("=" * 60)
    print(f"Task 6: Mutation Testing Monitor")
    print(f"Check #{iteration} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()
    
    if not progress:
        print("⚠️  Log file not found or not readable yet")
        return
    
    if progress['completed']:
        print("✅ Mutation testing appears to be COMPLETE")
        print()
    
    if crashed:
        print("⚠️  CRASH DETECTED!")
        print()
    
    print("--- Current Status ---")
    
    if progress['progress_pct']:
        print(f"Progress: {progress['progress_pct']}%")
    
    if progress['tested'] and progress['total_mutants']:
        print(f"Mutants Tested: {progress['tested']} / {progress['total_mutants']}")
    
    if progress['killed']:
        print(f"✅ Killed: {progress['killed']}")
    if progress['survived']:
        print(f"⚠️  Survived: {progress['survived']}")
    if progress['timeout']:
        print(f"⏱️  Timeout: {progress['timeout']}")
    if progress['no_coverage']:
        print(f"🔴 No Coverage: {progress['no_coverage']} ⬅️ KEY METRIC")
    if progress['error']:
        print(f"❌ Error: {progress['error']}")
    
    if progress['mutation_score']:
        print()
        print(f"Mutation Score: {progress['mutation_score']}%")
    
    print()
    print("--- Recent Activity (last 10 lines) ---")
    for line in progress['recent_lines'][-10:]:
        if line.strip():
            print(f"  {line}")
    
    # Log file stats
    if os.path.exists(LOG_FILE):
        size = os.path.getsize(LOG_FILE)
        size_mb = size / (1024 * 1024)
        with open(LOG_FILE, 'r', encoding='utf-8', errors='ignore') as f:
            line_count = sum(1 for _ in f)
        print()
        print(f"Log file: {LOG_FILE} ({size_mb:.2f} MB, {line_count} lines)")

def show_final_results(progress):
    """Display final results"""
    print()
    print("=" * 60)
    print("✅ Mutation Testing COMPLETED")
    print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()
    
    if not progress:
        print("⚠️  Could not extract final results")
        return
    
    print("=== Final Results ===")
    print()
    
    if progress['mutation_score']:
        print(f"🎯 Final Mutation Score: {progress['mutation_score']}%")
        print()
    
    print("--- Final Mutation Counts ---")
    if progress['killed']:
        print(f"✅ Killed: {progress['killed']}")
    if progress['survived']:
        print(f"⚠️  Survived: {progress['survived']}")
    if progress['timeout']:
        print(f"⏱️  Timeout: {progress['timeout']}")
    if progress['no_coverage']:
        print(f"🔴 No Coverage: {progress['no_coverage']} ⬅️ KEY METRIC (Baseline: 63)")
    if progress['error']:
        print(f"❌ Error: {progress['error']}")
    
    if progress['tested'] and progress['total_mutants']:
        print()
        print(f"Total Mutants Tested: {progress['tested']} / {progress['total_mutants']}")
    
    print()
    print("=== Report Location ===")
    if os.path.exists("reports/mutation/html"):
        print("HTML Report: reports/mutation/html/index.html")
    else:
        print("Report directory not found yet")

def main():
    """Main monitoring loop"""
    iteration = 0
    crash_detected = False
    
    print("=" * 60)
    print("Task 6: Mutation Testing Monitor")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()
    print("Monitoring mutation tests every 5 minutes...")
    print("Press Ctrl+C to stop monitoring (tests will continue running)")
    print()
    
    while True:
        iteration += 1
        
        # Check if process is running
        if not is_running():
            print()
            print("⚠️  Process check: Mutation test process not found")
            
            # Check if completed or crashed
            progress = extract_progress()
            if progress and progress['completed']:
                print("✅ Mutation tests completed normally")
                show_final_results(progress)
                break
            else:
                print("❌ Mutation tests may have crashed or stopped unexpectedly")
                crash_detected = True
                crashed, crash_lines = check_crashes()
                if crashed:
                    print()
                    print("Crash indicators found:")
                    for line_num, line in crash_lines:
                        print(f"  Line {line_num}: {line}")
                show_final_results(progress)
                break
        
        # Extract and show progress
        progress = extract_progress()
        crashed, crash_lines = check_crashes()
        
        if crashed:
            crash_detected = True
        
        # Clear screen and show progress
        os.system('clear' if os.name != 'nt' else 'cls')
        show_progress(iteration, progress, crashed)
        
        if crash_detected:
            print()
            print("⚠️  Crash detected - monitoring will continue but mutation tests may have issues")
        
        print()
        print("--- Next check in 5 minutes ---")
        print("Press Ctrl+C to stop monitoring (tests will continue running)")
        
        # Wait 5 minutes
        time.sleep(CHECK_INTERVAL)
    
    # Final status
    print()
    if crash_detected:
        print("⚠️  Monitoring stopped - crashes were detected during execution")
    else:
        print("✅ Monitoring complete - mutation tests finished")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print()
        print()
        print("Monitoring stopped by user")
        print("Mutation tests are still running in the background")
        print(f"Check {LOG_FILE} for progress")
