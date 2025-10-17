import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link } from "react-router-dom";
import { TrendingUp, ShieldCheck, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto text-center py-20 lg:py-32">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Yapay Zeka Destekli Kripto Sinyalleriyle Kazancınızı Artırın
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Piyasa analizini bize bırakın, siz doğru zamanda doğru hamleleri yapın. Gelişmiş algoritmalarımızla yatırım stratejinizi güçlendirin.
          </p>
          <Link to="/login">
            <Button size="lg">Ücretsiz Başla</Button>
          </Link>
        </section>

        {/* Backtest/Features Section */}
        <section className="bg-secondary py-20">
          <div className="container mx-auto grid md:grid-cols-3 gap-8 text-center">
            <Card>
              <CardHeader>
                <div className="mx-auto bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp />
                </div>
                <CardTitle>%82 Başarı Oranı</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Geçmiş 12 aylık backtest verilerine göre sinyallerimizin kanıtlanmış başarı oranı.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="mx-auto bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck />
                </div>
                <CardTitle>Güvenilir Analiz</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Birden fazla indikatör ve piyasa duyarlılığı analizi ile en güvenilir sinyalleri üretiriz.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="mx-auto bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <Zap />
                </div>
                <CardTitle>Anlık Bildirimler</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Alım veya satım fırsatı doğduğunda anında haberdar olun, hiçbir fırsatı kaçırmayın.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;