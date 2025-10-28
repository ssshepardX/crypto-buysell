import Navbar from "@/components/Navbar";
import { MadeWithDyad } from "@/components/made-with-dyad";
import PricingTiers from "@/components/PricingTiers";

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Stratejinize Uygun Planı Seçin
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            İster yeni başlayın, ister profesyonel bir yatırımcı olun, size uygun bir çözümümüz var.
          </p>
        </div>
        <PricingTiers />
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Pricing;