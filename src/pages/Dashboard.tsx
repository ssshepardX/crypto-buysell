import Navbar from "@/components/Navbar";
import AnalysisList from "@/components/AnalysisList";
import { useSession } from "@/contexts/SessionContext";
import { Skeleton } from "@/components/ui/skeleton";
import WinRateTracker from "@/components/WinRateTracker";
import AnalysisHistory from "@/components/AnalysisHistory";
import TrendingCoins from "@/components/TrendingCoins";
import PumpAlerts from "@/components/PumpAlerts";
import { useGenerateSignals } from "@/hooks/useGenerateSignals";
import { useBackgroundAIWorker } from "@/hooks/useBackgroundAIWorker";

const Dashboard = () => {
  const { session, loading } = useSession();

  // Generate signals when dashboard loads
  const { isGenerating, progress, lastGenerated } = useGenerateSignals();

  // Background AI worker for processing analysis jobs
  const { isRunning: aiWorkerRunning } = useBackgroundAIWorker({
    enabled: false, // Temporarily disabled until RLS is fixed
    pollInterval: 5000, // Check every 5 seconds
    maxConcurrentJobs: 1
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
          <AnalysisList />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Analysis History</h2>
          <AnalysisHistory />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Real-time Anomaly Detection</h2>
          <div className="mb-4 text-sm text-muted-foreground">
            🔄 System continuously monitors top 200 coins for market anomalies and provides AI-powered risk assessments
            {isGenerating && (
              <div className="mt-2">
                <div className="text-xs">Scanning progress: {progress.current}/{progress.total}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            )}
            {lastGenerated && (
              <div className="mt-1 text-xs text-gray-500">
                Last scan: {lastGenerated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default Dashboard;
