import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for getting started with AI predictions",
    features: [
      "3 predictions per day",
      "Basic confidence levels",
      "Major metro tracks only",
      "Daily email digest",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    description: "For serious punters who want more edge",
    features: [
      "Unlimited predictions",
      "All confidence levels",
      "All Australian tracks",
      "Real-time notifications",
      "Historical performance data",
      "Priority support",
    ],
    cta: "Start 7-Day Trial",
    popular: true,
  },
  {
    name: "Elite",
    price: "$19.99",
    period: "/month",
    description: "Maximum insights for professional punters",
    features: [
      "Everything in Pro",
      "Early access predictions",
      "Exclusive high-confidence picks",
      "API access",
      "Custom alerts & filters",
      "1-on-1 onboarding call",
      "Bankroll management tools",
    ],
    cta: "Start 7-Day Trial",
    popular: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your punting style. All paid plans include a 7-day free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-primary shadow-lg shadow-primary/20 scale-105 bg-card"
                  : "border-border bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
              <a
  href={
    plan.name === "Pro"
      ? "https://buy.stripe.com/test_xxx_PRO_LINK"
      : "#"}
  }
  target="_blank"
>
  <Button className="w-full">
    {plan.cta}
  </Button>
</a>  
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          All prices in AUD. Cancel anytime. No lock-in contracts.
        </p>
      </div>
    </section>
  )
}
