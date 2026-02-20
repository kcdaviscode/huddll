#!/bin/bash
# Huddll Django/Daphne Server Startup

echo "🚀 Starting Django/Daphne Server..."
echo ""

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Starting Redis..."
    brew services start redis
    sleep 2
fi

echo "✅ Redis running"

# Activate virtual environment
source .venv/bin/activate

echo "🌐 Django running at: http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""

# Start Daphne
daphne -b 0.0.0.0 -p 8000 huddll.asgi:application
