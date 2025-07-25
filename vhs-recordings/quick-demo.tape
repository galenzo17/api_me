# VHS Tape for Quick Concurrency Demo
# Shorter version for README

# Require ttyd (set PATH)
Require ttyd

# Output settings
Output vhs-recordings/quick-demo.gif
Set FontSize 12
Set Width 1000
Set Height 600
Set Theme "Tokyo Night"
Set Shell bash

# Start recording
Hide
Type "# 🚀 API ME - Concurrency with Pessimistic Locking"
Enter
Sleep 1s
Show

Type "clear"
Enter
Sleep 500ms

# Quick setup
Type "echo '🔧 Setup: API + Test Data'"
Enter
Type "npm run start:dev > /dev/null 2>&1 & sleep 4 && npm run seed"
Enter
Sleep 6s

# Show initial state
Type "curl -s localhost:3000/monitor/status | jq -r '\"📊 Initial: \\(.jobs.total) jobs, \\(.transactions.total) transactions\"'"
Enter
Sleep 2s

# Start simulation
Type "echo ''"
Enter
Type "echo '🎯 Starting 5 workers simulation...'"
Enter
Type "timeout 8s npm run simulate"
Enter
Sleep 9s

# Show results
Type "echo ''"
Enter
Type "echo '📈 Results:'"
Enter
Type "curl -s localhost:3000/monitor/status | jq -r '\"✅ Jobs completed: \\(.jobs.byStatus.completed // 0)/\\(.jobs.total)\\n✅ Transactions completed: \\(.transactions.byStatus.completed // 0)/\\(.transactions.total)\"'"
Enter
Sleep 3s

# Cleanup
Type "pkill -f 'npm run start:dev' || true"
Enter
Type "echo '✨ Demo complete! Check: https://github.com/galenzo17/api_me'"
Enter
Sleep 2s