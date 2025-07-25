# VHS Tape for Concurrency Demo
# Documentation: https://github.com/charmbracelet/vhs

# Output settings
Output vhs-recordings/concurrency-demo.gif
Set FontSize 14
Set Width 1200
Set Height 800
Set Theme "Dracula"

# Start recording
Hide
Type "# 🚀 API ME - Concurrency Simulation Demo"
Enter
Type "# Demonstrating pessimistic locking with multiple workers"
Enter
Sleep 1s
Show

# Clean slate
Type "clear"
Enter
Sleep 500ms

# Show project structure briefly
Type "echo '📁 Project Structure:'"
Enter
Type "ls -la scripts/"
Enter
Sleep 2s

# Start the API server
Type "echo '🚀 Starting API server...'"
Enter
Type "npm run start:dev > api.log 2>&1 &"
Enter
Type "API_PID=$!"
Enter
Sleep 3s

# Wait for API to be ready
Type "echo '⏳ Waiting for API to be ready...'"
Enter
Type "sleep 5"
Enter

# Seed test data
Type "echo '🌱 Seeding test data...'"
Enter
Type "npm run seed"
Enter
Sleep 2s

# Clear screen for monitor demo
Type "clear"
Enter
Sleep 500ms

# Show initial status
Type "echo '📊 Initial System Status:'"
Enter
Type "curl -s http://localhost:3000/monitor/status | jq -r '.jobs.total as $jobs | .transactions.total as $tx | \"Jobs: \\($jobs) | Transactions: \\($tx)\"'"
Enter
Sleep 2s

# Start monitor in background (simulated)
Type "echo '📈 Starting monitor dashboard...'"
Enter
Type "# npm run monitor &"
Enter
Type "# MONITOR_PID=$!"
Enter
Sleep 1s

# Clear screen for simulation
Type "clear"
Enter
Sleep 500ms

# Show simulation starting
Type "echo '🎯 Starting Concurrency Simulation'"
Enter
Type "echo '===================================='"
Enter
Type "echo '👥 5 Workers competing for resources'"
Enter
Type "echo '🔒 Pessimistic locking in action'"
Enter
Type "echo '📊 Real-time lock visualization'"
Enter
Sleep 2s

# Run the simulation
Type "timeout 15s npm run simulate"
Enter
Sleep 16s

# Show final results
Type "echo ''"
Enter
Type "echo '📈 Final Results:'"
Enter
Type "curl -s http://localhost:3000/monitor/status | jq -r '.jobs as $jobs | .transactions as $tx | \"\\n📋 Jobs - Completed: \\($jobs.byStatus.completed // 0) | Failed: \\($jobs.byStatus.failed // 0) | Pending: \\($jobs.byStatus.pending // 0)\\n💰 Transactions - Completed: \\($tx.byStatus.completed // 0) | Failed: \\($tx.byStatus.failed // 0) | Pending: \\($tx.byStatus.pending // 0)\"'"
Enter
Sleep 3s

# Show locked resources
Type "echo ''"
Enter
Type "echo '🔒 Any remaining locks:'"
Enter
Type "curl -s http://localhost:3000/monitor/status | jq -r '.activeLocks.count as $count | if $count > 0 then \"Active locks: \\($count)\" else \"No active locks\" end'"
Enter
Sleep 2s

# Clean up
Type "echo ''"
Enter
Type "echo '🧹 Cleaning up...'"
Enter
Type "kill $API_PID 2>/dev/null || true"
Enter
Sleep 1s

# Final message
Type "echo ''"
Enter
Type "echo '✨ Demo completed!'"
Enter
Type "echo '📁 Check the database.db file for final state'"
Enter
Type "echo '🔗 Repository: https://github.com/galenzo17/api_me'"
Enter
Sleep 3s