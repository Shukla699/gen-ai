# 🚀 Quick Setup Guide

## Step 1: Get Gemini API Key

1. Visit https://ai.google.dev/tutorials/setup
2. Click "Get API Key"
3. Create new project and generate API key
4. Copy the key

## Step 2: Configure Backend

Edit `backend/.env` and add your Gemini API key:

```
GEMINI_API_KEY=paste_your_key_here
```

## Step 3: Start Backend

```bash
cd backend
npm run dev
```

You should see: `Server is running on port 3000`

## Step 4: Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

You should see: `Local: http://localhost:5173` or similar

## Step 5: Test Application

1. Open http://localhost:5173 in your browser
2. Try uploading `sample_data.csv` included in the root folder
3. Add optional prompt: "Show sales trends by region and category"
4. Click "Generate Dashboard"
5. Wait for AI to analyze and generate dashboard
6. Explore the visualizations!

## 📋 What You'll See

When dashboard generates, you'll see:

- **Key Metrics**: Sales totals, averages, etc.
- **AI Insights**: Automatic analysis of your data
- **Charts**: 
  - Sales trends over quarters
  - Regional breakdowns
  - Category performance
- **Data Table**: Full dataset with filtering/sorting

## 🔑 Important

- Keep your Gemini API key private (in `.env`, not in git)
- First generation takes ~5-10 seconds while AI analyzes data
- Works with any CSV, Excel, or JSON file

## ✨ Try These Prompts

- "Focus on quarterly growth trends"
- "Compare performance across regions"
- "Show top performing categories"
- "Add profitability analysis"

## 🐛 Need Help?

Check the main README.md for troubleshooting section

---

That's it! Your AI dashboard generator is ready to use! 🎉
