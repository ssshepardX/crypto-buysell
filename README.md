# 🚨 Shepard Signals - AI Crypto Pump Detection

**Real-time cryptocurrency pump detection with AI-powered analysis**

## ⚠️ Security Notice

**This project contains sensitive configuration. Before making it public:**

1. ✅ **Credentials Removed**: All API keys and database credentials have been moved to environment variables
2. ✅ **Environment Variables**: Use `.env.example` as template for your `.env` file
3. ✅ **Git Ignore**: `.env` files are properly ignored
4. ✅ **No Hardcoded Secrets**: All sensitive data uses environment variables

## 🚀 Features

- **Real-time Pump Detection**: Monitors top 200 cryptocurrencies by volume
- **AI-Powered Analysis**: Google Gemini AI analyzes pump legitimacy
- **Risk Assessment**: Low/Moderate/High/Critical risk levels
- **Whale Movement Detection**: Identifies potential manipulation
- **Push Notifications**: Browser notifications for alerts
- **Historical Data**: Stores all pump alerts in Supabase
- **Responsive UI**: Modern React + TailwindCSS interface

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: TailwindCSS + shadcn/ui components
- **Backend**: Supabase (Database + Auth)
- **AI**: Google Gemini 1.5 Flash
- **Data**: Binance API (Real-time market data)
- **State**: React Query + Context API

## 📋 Prerequisites

- Node.js 18+
- npm/pnpm
- Supabase account
- Google AI API key

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/shepard-signals.git
   cd shepard-signals
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your actual credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Database Setup**
   ```bash
   cd supabase
   npx supabase db reset
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🔑 API Keys Setup

### Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings > API
3. Copy Project URL and anon/public key

### Google Gemini AI
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Copy the key to your `.env` file

## 🎯 Usage

1. **Login/Register** on the platform
2. **Navigate to Dashboard**
3. **Start Market Watcher**: Click "Start Watching" button
4. **Monitor Alerts**: Real-time pump detection with AI analysis
5. **Manual Scan**: Use "Manual Scan" for immediate market check

## 📊 How It Works

1. **Data Collection**: Fetches top 200 coins from Binance every minute
2. **Pump Detection**: Identifies coins with >3% price change + >2.5x volume
3. **AI Analysis**: Gemini AI analyzes if pump is organic or manipulation
4. **Risk Scoring**: Calculates whale movement probability and risk levels
5. **Notifications**: Sends browser alerts and stores in database
6. **Dashboard**: Displays real-time alerts with detailed analysis

## 🗂️ Project Structure

```
src/
├── components/          # UI components
│   ├── PumpAlerts.tsx   # Main pump alerts display
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useMarketWatcher.ts  # Main pump detection logic
│   └── ...
├── services/            # External API services
│   ├── binanceService.ts    # Binance API integration
│   ├── aiService.ts         # Gemini AI integration
│   └── ...
├── integrations/        # Third-party integrations
│   └── supabase/        # Database client
└── pages/               # Route components
    └── Dashboard.tsx    # Main dashboard
```

## 🔒 Security Considerations

- ✅ **No hardcoded credentials** in source code
- ✅ **Environment variables** for all sensitive data
- ✅ **Row Level Security** enabled on database tables
- ✅ **Input validation** on all API calls
- ✅ **Rate limiting** on external API requests

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is for educational purposes. Use at your own risk.

## ⚠️ Disclaimer

This tool is for educational and informational purposes only. Cryptocurrency trading involves substantial risk of loss and is not suitable for every investor. Past performance does not guarantee future results. Always do your own research and consult with financial advisors before making investment decisions.

---

**Built with ❤️ for the crypto community**
