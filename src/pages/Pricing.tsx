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
    description: "Get started with our basic features.",
    features: [
      "Access to top 5 coin signals",
      "Basic performance metrics",
      "Email notifications",
    ],
    cta: "Get Started",
  },
  {
    name: "Pro",
    priceMonthly: 5,
    priceYearly: 40, // ~33% discount
    description: "For active traders who need more.",
    features: [
      "Access to all coin signals",
      "Advanced performance metrics",
      "Real-time trade history",
      "Favorite coins tracking",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Business",
    priceMonthly: 10,
    priceYearly: 80, // ~33% discount
    description: "For professionals and power users.",
    features: [
      "All features in Pro",
      "API Access for custom integrations",
      "Dedicated account manager",
      "Early access to new features",
      "Team access (up to 5 users)",
    ],
    cta: "Contact Sales",
  },
];

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

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
              Monthly
            </Label>
            <Switch
              id="billing-cycle"
              checked={billingCycle === "yearly"}
              onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
            />
            <Label htmlFor="billing-cycle" className={cn(billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground')}>
              Yearly <span className="text-green-500 font-semibold">(Save up to 33%)</span>
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
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">
                    ${billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    /{billingCycle === "monthly" ? "month" : "year"}
                  </span>
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