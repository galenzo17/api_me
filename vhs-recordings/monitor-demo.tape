# VHS Tape for Monitor Dashboard Demo
# Documentation: https://github.com/charmbracelet/vhs

# Output settings
Output vhs-recordings/monitor-demo.gif
Set FontSize 12
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"

# Start recording
Hide
Type "# 📊 Real-time Monitor Dashboard Demo"
Enter
Sleep 1s
Show

# Setup
Type "clear"
Enter
Sleep 500ms

# Start API
Type "echo '🚀 Starting API and seeding data...'"
Enter
Type "npm run start:dev > api.log 2>&1 & sleep 5 && npm run seed"
Enter
Sleep 8s

# Clear for monitor
Type "clear"
Enter
Sleep 500ms

# Show monitor dashboard
Type "echo '📊 Launching Real-time Monitor Dashboard'"
Enter
Type "echo 'Watch as workers compete for jobs and transactions...'"
Enter
Sleep 2s

# Start monitor (we'll simulate since it's interactive)
Type "# Simulating monitor dashboard output"
Enter
Type "echo '════════════════════════════════════════════════════════════════════════════════'"
Enter
Type "echo '🔍 CONCURRENCY MONITOR DASHBOARD - Live Demo'"
Enter
Type "echo '════════════════════════════════════════════════════════════════════════════════'"
Enter
Type "echo ''"
Enter
Type "echo '📋 JOBS STATUS'"
Enter
Type "echo '────────────────────────────────────────────'"
Enter
Type "echo '  pending    |  10 ██████████'"
Enter
Type "echo '  running    |   0 '"
Enter
Type "echo '  completed  |   0 '"
Enter
Type "echo '  TOTAL      |  10'"
Enter
Type "echo ''"
Enter
Type "echo '💰 TRANSACTIONS STATUS'"
Enter
Type "echo '────────────────────────────────────────────'"
Enter
Type "echo '  pending    |   8 ████████'"
Enter
Type "echo '  completed  |   0 '"
Enter
Type "echo '  TOTAL      |   8'"
Enter
Sleep 3s

# Start workers in background and show updates
Type "timeout 12s npm run simulate > /dev/null 2>&1 &"
Enter
Sleep 2s

# Simulate monitor updates
Type "clear"
Enter
Type "echo '🔍 CONCURRENCY MONITOR DASHBOARD - Workers Active'"
Enter
Type "echo '════════════════════════════════════════════════════════════════════════════════'"
Enter
Type "echo ''"
Enter
Type "echo '📋 JOBS STATUS'"
Enter
Type "echo '────────────────────────────────────────────'"
Enter
Type "echo '  pending    |   7 ███████'"
Enter
Type "echo '  running    |   2 ██'"
Enter
Type "echo '  completed  |   1 █'"
Enter
Type "echo '  TOTAL      |  10'"
Enter
Type "echo ''"
Type "echo '💰 TRANSACTIONS STATUS'"
Enter
Type "echo '────────────────────────────────────────────'"
Enter
Type "echo '  pending    |   5 █████'"
Enter
Type "echo '  processing |   1 █'"
Enter
Type "echo '  completed  |   2 ██'"
Enter
Type "echo '  TOTAL      |   8'"
Enter
Type "echo ''"
Type "echo '🔒 ACTIVE LOCKS'"
Enter
Type "echo '────────────────────────────────────────────────────────────────'"
Enter
Type "echo '  👤 WORKER-01'"
Enter
Type "echo '    🔒 Job 3: Process User Registration... (5s)'"
Enter
Type "echo '  👤 WORKER-03'"
Enter
Type "echo '    💎 Transaction 2: $50.25 debit (3s)'"
Enter
Type "echo ''"
Type "echo '👥 ACTIVE WORKERS'"
Enter
Type "echo '──────────────────────────────────────────────────'"
Enter
Type "echo '  Active workers: 3'"
Enter
Type "echo ''"
Enter
Type "echo '  WORKER-01    | Jobs:  1 | Tx:  0 | Total:  1 █'"
Enter
Type "echo '  WORKER-02    | Jobs:  0 | Tx:  1 | Total:  1 █'"
Enter
Type "echo '  WORKER-03    | Jobs:  1 | Tx:  1 | Total:  2 ██'"
Enter
Sleep 4s

# Final state
Type "clear"
Enter
Type "echo '🔍 CONCURRENCY MONITOR DASHBOARD - Final State'"
Enter
Type "echo '════════════════════════════════════════════════════════════════════════════════'"
Enter
Type "echo ''"
Type "echo '📋 JOBS STATUS'"
Enter
Type "echo '────────────────────────────────────────────'"
Enter
Type "echo '  pending    |   0 '"
Enter
Type "echo '  running    |   0 '"
Enter
Type "echo '  completed  |  10 ██████████'"
Enter
Type "echo '  TOTAL      |  10'"
Enter
Type "echo ''"
Type "echo '💰 TRANSACTIONS STATUS'"
Enter
Type "echo '────────────────────────────────────────────'"
Enter
Type "echo '  pending    |   0 '"
Enter
Type "echo '  processing |   0 '"
Enter
Type "echo '  completed  |   8 ████████'"
Enter
Type "echo '  TOTAL      |   8'"
Enter
Type "echo ''"
Type "echo '🔒 ACTIVE LOCKS'"
Enter
Type "echo '────────────────────────────────────────────────────────────────'"
Enter
Type "echo '  No active locks'"
Enter
Type "echo ''"
Type "echo '👥 ACTIVE WORKERS'"
Enter
Type "echo '──────────────────────────────────────────────────'"
Enter
Type "echo '  Active workers: 0'"
Enter
Sleep 3s

# Show real final status
Type "echo ''"
Enter
Type "echo '📊 Actual Final Status:'"
Enter
Type "curl -s http://localhost:3000/monitor/status | jq '.jobs.byStatus, .transactions.byStatus'"
Enter
Sleep 2s

# Cleanup
Type "echo ''"
Enter
Type "echo '🧹 Stopping API...'"
Enter
Type "pkill -f 'npm run start:dev' || true"
Enter
Sleep 1s

Type "echo '✨ Monitor demo completed!'"
Enter
Sleep 2s