import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const pricingTiers = [
  {
    name: "Başlangıç",
    price: "Ücretsiz",
    description: "Piyasayı keşfetmeye başlayın.",
    features: [
      "3 Temel Kripto Sinyali (BTC, ETH)",
      "Günlük Piyasa Özeti",
      "E-posta Bildirimleri",
    ],
    cta: "Mevcut Plan",
    link: "/dashboard",
    disabled: true,
  },
  {
    name: "Profesyonel",
    price: "₺299",
    period: "/ay",
    description: "Yatırımlarını ciddiye alanlar için.",
    features: [
      "50+ Kripto Sinyali",
      "Anlık Al/Sat Bildirimleri",
      "Gelişmiş Teknik Analiz Araçları",
      "Öncelikli Destek",
    ],
    cta: "Abone Ol",
    link: "/login", // Bu daha sonra ödeme sayfasına yönlendirilecek
    popular: true,
  },
  {
    name: "Kurumsal",
    price: "Özel",
    description: "Büyük hacimli yatırımcılar ve fonlar için.",
    features: [
      "Tüm Profesyonel Özellikleri",
      "Özelleştirilmiş Sinyal Algoritmaları",
      "API Erişimi",
      "Özel Müşteri Temsilcisi",
    ],
    cta: "İletişime Geç",
    link: "/contact"
  },
];

const PricingTiers = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {pricingTiers.map((tier) => (
        <Card key={tier.name} className={`flex flex-col ${tier.popular ? 'border-primary shadow-lg' : ''}`}>
          <CardHeader>
            <CardTitle>{tier.name}</CardTitle>
            <CardDescription>{tier.description}</CardDescription>
            <div>
              <span className="text-4xl font-bold">{tier.price}</span>
              {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Link to={tier.link} className="w-full">
              <Button className="w-full" variant={tier.popular ? 'default' : 'outline'} disabled={tier.disabled}>
                {tier.cta}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default PricingTiers;