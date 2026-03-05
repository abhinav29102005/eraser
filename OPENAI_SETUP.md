# OpenAI API Setup Guide

## ✅ Current Status
The OpenAI API integration is **properly configured and working**.

## 📋 What's Been Done

### Backend Configuration
1. ✅ **Environment Variables Loaded**: `.env` file is automatically loaded via `python-dotenv`
2. ✅ **OpenAI Client Initialized**: AsyncOpenAI client is created with the API key
3. ✅ **Provider Resolution**: System automatically uses OpenAI when API key is available
4. ✅ **Logging**: Detailed logs show configuration status and provider selection

### Files Modified
- `backend/main.py` - Added `load_dotenv()` to load `.env` file
- `backend/app/ai_service.py` - Improved client initialization with logging
- `backend/requirements.txt` - Added `python-dotenv>=1.0.0`

## 🔑 API Key Configuration

Your `.env` file contains:
```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
```

The API key is automatically loaded when the backend starts.

## 🚀 How It Works

1. **Startup**: When the backend starts, `main.py` loads the `.env` file
2. **Initialization**: `ai_service.py` creates an AsyncOpenAI client with the API key
3. **Provider Resolution**: When a diagram is requested:
   - System checks `AI_PROVIDER` setting
   - Since it's set to `"openai"`, OpenAI is used
   - If OpenAI fails, it falls back to mock diagrams

## 📊 Testing Diagram Generation

Try these prompts in the AI Assistant:

```
1. "DSA roadmap" 
   → Generates detailed Data Structures and Algorithms roadmap

2. "Microservices architecture"
   → Generates system architecture diagram

3. "CI/CD pipeline"
   → Generates deployment pipeline diagram

4. Any custom prompt
   → Generates a detailed flowchart
```

## 🔍 Verify Setup

Run this to verify OpenAI is configured:
```bash
source .venv/bin/activate
cd backend
python -c "
from dotenv import load_dotenv
load_dotenv()
from app.ai_service import client
print('OpenAI client ready:', bool(client))
"
```

## 📝 Logs

When you see in logs:
```
✓ OpenAI client initialized successfully
```
This means OpenAI API is ready to use!

## ⚙️ Configuration Options

### Switch Providers (in `.env`):
```bash
# Use OpenAI (default, requires API key)
AI_PROVIDER=openai

# Use local Ollama
AI_PROVIDER=ollama
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b

# Use mock diagrams (no API key needed)
AI_PROVIDER=mock
```

## 🐛 Troubleshooting

**Issue**: "OpenAI module not available"
- **Fix**: Make sure you're using the virtual environment and OpenAI is installed
  ```bash
  source .venv/bin/activate
  pip install openai
  ```

**Issue**: "API key not found"
- **Fix**: Check `.env` file has `OPENAI_API_KEY` set
  ```bash
  grep OPENAI_API_KEY backend/.env
  ```

**Issue**: OpenAI requests fail
- **Fix**: Verify API key is valid at https://platform.openai.com/api-keys
- **Fix**: Check internet connection and API rate limits

## 📞 Support

For OpenAI issues:
- Check API key at: https://platform.openai.com/api-keys
- Check status page: https://status.openai.com/
- Documentation: https://platform.openai.com/docs
