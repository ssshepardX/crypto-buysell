import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const pricingTiers = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Start exploring the market.",
    features: [
      "3 Basic Crypto Signals (BTC, ETH)",
      "Daily Market Summary",
      "Email Notifications",
    ],
    cta: "Current Plan",
    link: "/dashboard",
    disabled: true,
  },
  {
    name: "Scalper",
    monthlyPrice: 15,
    yearlyPrice: 135, // (15 * 12) * 0.75
    description: "For those who are serious about their investments.",
    features: [
      "50+ Crypto Signals",
      "Instant Buy/Sell Notifications",
      "Advanced Technical Analysis Tools",
      "Priority Support",
    ],
    cta: "Subscribe",
    link: "/login", // To be changed to payment page later
    popular: true,
  },
  {
    name: "Pro Trader",
    monthlyPrice: 30,
    yearlyPrice: 270, // (30 * 12) * 0.75
    description: "For high-volume traders and funds.",
    features: [
      "All Scalper Features",
      "Customizable Signal Algorithms",
      "API Access",
      "Dedicated Account Manager",
    ],
    cta: "Contact Us",
    link: "/contact"
  },
];

const PricingTiers = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <>
      <div className="flex items-center justify-center space-x-4 mb-10">
        <Label htmlFor="billing-cycle">Monthly</Label>
        <Switch
          id="billing-cycle"
          checked={billingCycle === 'yearly'}
          onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
        />
        <Label htmlFor="billing-cycle" className="flex items-center">
          Yearly
          <span className="ml-2 inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            Save 25%
          </span>
        </Label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {pricingTiers.map((tier) => (
          <Card key={tier.name} className={`flex flex-col ${tier.popular ? 'border-primary shadow-lg' : ''}`}>
            <CardHeader>
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
              <div>
                <span className="text-4xl font-bold">
                  ${billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice / 12}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              {billingCycle === 'yearly' && tier.monthlyPrice > 0 && (
                 <p className="text-sm text-muted-foreground">
                   Billed as ${tier.yearlyPrice} per year
                 </p>
              )}
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
    </>
  );
};

export default PricingTiers;