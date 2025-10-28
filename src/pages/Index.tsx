import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { TrendingUp, ShieldCheck, Zap } from "lucide-react";
import LivePriceTicker from "@/components/LivePriceTicker";
import TrendingCoins from "@/components/TrendingCoins";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto text-center pt-20 pb-12 lg:pt-32 lg:pb-20 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-foreground dark:bg-gradient-to-r dark:from-cyan-400 dark:to-purple-500 dark:text-transparent dark:bg-clip-text">
            Boost Your Profits with AI-Powered Crypto Signals
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Let us handle the market analysis while you make the right moves at the right time. Power your investment strategy with our advanced algorithms.
          </p>
          <Link to="/login">
            <Button size="lg" className="transition-all hover:shadow-[0_0_20px_theme(colors.cyan.500)]">
              Get Started for Free
            </Button>
          </Link>
        </section>

        {/* Live Price Ticker */}
        <LivePriceTicker />

        {/* Features Section */}
        <section 
          className="bg-black bg-opacity-20 py-20 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="container mx-auto grid md:grid-cols-3 gap-8 text-center">
            {[
              { icon: <TrendingUp />, title: "High Win Rate", description: "Our AI strategy is developed for a high win rate, identifying the most promising trading opportunities." },
              { icon: <ShieldCheck />, title: "Real-Time Analysis", description: "Our system processes market data in real-time to generate the most reliable signals." },
              { icon: <Zap />, title: "Timely Alerts", description: "Receive timely alerts on potential market moves, so you're always prepared." }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="bg-secondary/50 backdrop-blur-sm border-white/10 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-[0_0_25px_theme(colors.cyan.500/50%)]"
              >
                <CardHeader>
                  <div className="mx-auto bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trending Coins Section */}
        <section 
          className="py-20 animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10">Trending Coins</h2>
            <TrendingCoins />
          </div>
        </section>

      </main>
    </div>
  );
};

export default Index;