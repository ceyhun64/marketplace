"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SubscriptionCard from "./SubscriptionCard";

const FAQ_ITEMS = [
  {
    q: "Does a plan upgrade take effect immediately?",
    a: "Yes, the plan change is applied immediately after payment is confirmed.",
  },
  {
    q: "What happens to my products if I downgrade?",
    a: "If you downgrade to Basic and exceed the 50-product limit, you won't be able to add new products, but your existing products are kept.",
  },
  {
    q: "How does the Marketplace publishing feature work?",
    a: "On Pro and higher plans, use the 'Publish to Marketplace' toggle on the product page to list your products on the general marketplace.",
  },
];

export default function MerchantSubscriptionView() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          My Subscription
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          View and upgrade your current plan
        </p>
      </div>

      <SubscriptionCard />

      <Card className="border border-gray-100 shadow-none rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {FAQ_ITEMS.map((item) => (
            <div
              key={item.q}
              className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
            >
              <p className="text-sm font-semibold text-gray-900">{item.q}</p>
              <p className="text-sm text-gray-500 mt-1">{item.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
