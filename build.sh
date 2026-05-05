#!/bin/bash
# Build script - Railway handles install automatically
echo "Build complete"

# Optional: Run checks during build
cd backend
python -c "import django; print('Django version:', django.__version__)"
echo "Build checks completed successfully"
