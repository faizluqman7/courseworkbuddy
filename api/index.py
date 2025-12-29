import os
import sys

# Add the parent directory to sys.path so we can import from server
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from server.main import app

# Vercel needs this
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
