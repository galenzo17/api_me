# VHS Tape for Simple Concurrency Demo
# Avoiding complex jq commands

# Require ttyd (set PATH)
Require ttyd

# Output settings
Output vhs-recordings/simple-demo.gif
Set FontSize 12
Set Width 1000
Set Height 600
Set Theme "TokyoNight"
Set Shell bash

# Start recording
Hide
Type "# 🚀 API ME - Concurrency Demo"
Enter
Sleep 1s
Show

Type "clear"
Enter
Sleep 500ms

# Setup message
Type "echo '🔧 Setting up concurrency demo...'"
Enter
Sleep 1s

# Start API in background
Type "npm run start:dev > /dev/null 2>&1 &"
Enter
Type "sleep 5"
Enter

# Seed data
Type "echo '🌱 Creating test data...'"
Enter
Type "npm run seed"
Enter
Sleep 3s

# Show available jobs and transactions
Type "echo ''"
Enter
Type "echo '📊 Initial state:'"
Enter
Type "curl -s localhost:3000/jobs | wc -l | xargs echo 'Jobs created:'"
Enter
Sleep 1s
Type "curl -s localhost:3000/transactions | wc -l | xargs echo 'Transactions created:'"
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

# Show final results
Type "echo ''"
Enter
Type "echo '📈 Final results:'"
Enter
Type "curl -s localhost:3000/jobs?status=completed | wc -l | xargs echo 'Jobs completed:'"
Enter
Sleep 1s
Type "curl -s localhost:3000/transactions?status=completed | wc -l | xargs echo 'Transactions completed:'"
Enter
Sleep 2s

# Show any remaining pending work
Type "echo ''"
Enter
Type "curl -s localhost:3000/jobs?status=pending | wc -l | xargs echo 'Jobs still pending:'"
Enter
Sleep 1s

# Cleanup
Type "echo ''"
Enter
Type "echo '🧹 Cleaning up...'"
Enter
Type "pkill -f 'npm run start:dev' || true"
Enter
Sleep 1s

# Final message
Type "echo '✨ Demo complete!'"
Enter
Type "echo '🔗 Repository: https://github.com/galenzo17/api_me'"
Enter
Sleep 3s