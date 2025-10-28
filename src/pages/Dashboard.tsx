import Navbar from "@/components/Navbar";
import SignalList from "@/components/SignalList";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSession } from "@/contexts/SessionContext";
import { Skeleton } from "@/components/ui/skeleton";
import WinRateTracker from "@/components/WinRateTracker";
import SignalHistory from "@/components/SignalHistory";

const Dashboard = () => {
  const { session, loading } = useSession();

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
            Here's the latest analysis from our AI engine.
          </p>
        </div>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">System Performance</h2>
          <WinRateTracker />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Active Signals & Market Scan</h2>
          <SignalList />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Trade History</h2>
          <SignalHistory />
        </section>

      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Dashboard;