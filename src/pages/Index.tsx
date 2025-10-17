import Header from "@/components/Header";
import SignalList from "@/components/SignalList";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        <Header />
        <SignalList />
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;