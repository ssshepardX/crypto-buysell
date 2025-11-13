import Navbar from "@/components/Navbar";
import SignalList from "@/components/SignalList";
import { useSession } from "@/contexts/SessionContext";
import { Skeleton } from "@/components/ui/skeleton";
import WinRateTracker from "@/components/WinRateTracker";
import SignalHistory from "@/components/SignalHistory";
import TrendingCoins from "@/components/TrendingCoins";
import PumpAlerts from "@/components/PumpAlerts";
import { useGenerateSignals } from "@/hooks/useGenerateSignals";
import { useMarketWatcher } from "@/hooks/useMarketWatcher";

const Dashboard = () => {
  const { session, loading } = useSession();

  // Generate signals when dashboard loads
  useGenerateSignals();

  // Market watcher for pump detection
  const {
    isWatching,
    lastScan,
    pumpAlerts,
    startWatching,
    stopWatching,
    scanForPumps
  } = useMarketWatcher({
    enabled: true,
    interval: 60, // 1 minute
    aiEnabled: true,
    maxCoins: 100
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-1/3 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[190px] w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-12">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {session?.user?.email}
          </h1>
          <p className="text-muted-foreground">
            Real-time market anomaly detection and risk analysis powered by AI.
          </p>
        </div>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">System Performance</h2>
          <WinRateTracker />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Trending Coins</h2>
          <TrendingCoins />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">AI Risk Analysis</h2>
          <SignalList />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Analysis History</h2>
          <SignalHistory />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Real-time Anomaly Detection</h2>
          <div className="mb-4 text-sm text-muted-foreground">
            🔄 System continuously monitors top 200 coins for market anomalies and provides AI-powered risk assessments
          </div>
          <PumpAlerts alerts={pumpAlerts} />
        </section>

      </main>
    </div>
  );
};

export default Dashboard;
