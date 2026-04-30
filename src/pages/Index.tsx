import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Search, ShieldCheck, Waves } from "lucide-react";
import LivePriceTicker from "@/components/LivePriceTicker";
import TrendingCoins from "@/components/TrendingCoins";
import Head from "@/components/Head";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 flex flex-col">
      {/* Background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-slate-950"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)] animate-pulse"></div>
        </div>
      </div>
      <Head
        title="AI Market Analyst - Crypto AI Advisor Platform"
        description="Crypto market movement intelligence platform. Understand sudden price moves, whale traces, fraud risk, and social/news catalysts."
      />
      <Navbar />
      <main className="relative z-10 flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto text-center pt-20 pb-12 lg:pt-32 lg:pb-20 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-inter font-bold tracking-tight mb-4 bg-gradient-to-r from-cyan-300 to-slate-400 text-transparent bg-clip-text">
            Crypto Movement Intelligence
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-inter max-w-3xl mx-auto mb-8 leading-relaxed">
            Ani fiyat hareketlerinin kaynağını incele: organik talep mi, whale itişi mi, düşük likidite mi, yoksa sosyal/news katalizörüyle şişen riskli bir hareket mi?
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-inter font-medium px-8 py-3 rounded-lg transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]">
              Hareketleri İncele
            </Button>
          </Link>
        </section>

        {/* Live Price Ticker */}
        <LivePriceTicker />

        {/* Features Section */}
        <section
          className="py-20 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="container mx-auto relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-inter font-bold text-slate-200 mb-4">Movement Intelligence</h2>
              <p className="text-slate-400 font-inter max-w-2xl mx-auto">Trade sinyali değil; hareket sebebi, manipülasyon riski ve kaynak güveni.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <Search className="h-8 w-8 text-emerald-400" />, title: "Hareket Sebebi", description: "Teknik, hacim, orderbook ve haber/sosyal sinyalleriyle ani hareketin olası kaynağını sınıflandırır." },
                { icon: <ShieldCheck className="h-8 w-8 text-cyan-400" />, title: "Manipülasyon Riski", description: "Whale izi, ince orderbook, wick rejection ve hacim anomalilerini birlikte değerlendirir." },
                { icon: <Waves className="h-8 w-8 text-yellow-400" />, title: "Katalizör Takibi", description: "Google news/search ve Reddit kaynaklarından aggregate sentiment ve katalizör terimleri üretir." }
              ].map((feature, index) => (
                <Card
                  key={index}
                  className="bg-slate-950/80 backdrop-blur-xl border-white/10 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:border-cyan-500/30 rounded-xl h-full"
                >
                  <CardHeader className="pb-4">
                    <div className="mx-auto w-14 h-14 bg-slate-800/50 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 shadow-lg border border-white/10">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl font-inter font-semibold text-slate-200 text-center">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400 font-inter leading-relaxed text-center">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Coins Section */}
        <section
          className="py-20 animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="container mx-auto">
            <h2 className="text-3xl font-inter font-bold text-center text-slate-200 mb-10">Market Overview</h2>
            <TrendingCoins />
          </div>
        </section>

      </main>
    </div>
  );
};

export default Index;
