import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    description: "Start with 1 daily signal and basic features.",
    features: [
      "1 random signal per day",
      "Basic performance metrics",
      "Email notifications",
      "Limited chart analysis",
      "Community support",
    ],
    cta: "Get Started",
  },
  {
    name: "Scalper",
    // Monthly price (will be billed annually). Display shows monthly but charged yearly.
    priceMonthly: 9.99,
    // priceYearly kept equal to monthly to represent the monthly rate when billed annually
    priceYearly: 9.99,
    description: "Perfect for active day traders.",
    features: [
      "Access to all signals",
      "Real-time entry/exit points",
      "Advanced performance metrics",
      "Favorite coins tracking",
      "Priority email support",
      "Stop-loss recommendations",
    ],
    cta: "Become a Scalper",
    popular: true,
  },
  {
    name: "Pro Trader",
    // Monthly price (will be billed annually). Display shows monthly but charged yearly.
    priceMonthly: 17.99,
    priceYearly: 17.99,
    description: "Advanced analysis and AI-powered insights.",
    features: [
      "All Scalper features",
      "Detailed AI market analysis",
      "Risk level assessment",
      "Multi-timeframe signals",
      "Custom alert settings",
      "1-on-1 trading consultation",
      "VIP Discord access",
    ],
    cta: "Go Pro",
  },
];

const Pricing = () => {
  // Default to yearly so the site shows 'billed annually' (monthly price, charged yearly)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Find the perfect plan
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Start for free, then upgrade to a paid plan to unlock more features and power up your trading strategy.
          </p>
          <div className="flex items-center justify-center space-x-4 mb-12">
            <Label htmlFor="billing-cycle" className={cn(billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground')}>
              Pay Monthly
            </Label>
            <Switch
              id="billing-cycle"
              checked={billingCycle === "yearly"}
              onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
            />
            <Label htmlFor="billing-cycle" className={cn(billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground')}>
              Pay Annually <span className="text-green-500 font-semibold">(Save up to 23%)</span>
            </Label>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.name} className={cn("flex flex-col", plan.popular && "border-purple-500 shadow-lg shadow-purple-500/20")}>
              {plan.popular && (
                <div className="bg-purple-500 text-white text-xs font-bold text-center py-1 rounded-t-lg">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-6">
                <div className="flex flex-col">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">
                      ${billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly}
                    </span>
                    <span className="text-muted-foreground ml-2">/month</span>
                  </div>
                  {billingCycle === "yearly" && plan.priceYearly > 0 && (
                    <div className="text-sm text-green-500">
                      Billed annually (${(plan.priceYearly * 12).toFixed(2)}/year)
                    </div>
                  )}
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Pricing;