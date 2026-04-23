"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SubscriptionCard from "./SubscriptionCard";

export default function MerchantSubscriptionView() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abonelik Planım</h1>
        <p className="text-sm text-gray-500 mt-1">
          Mevcut planınızı görüntüleyin ve yükseltin
        </p>
      </div>

      <SubscriptionCard />

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Sık Sorulan Sorular
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              q: "Plan yükseltme anında aktif olur mu?",
              a: "Evet, ödeme onaylandıktan sonra plan değişikliği anında uygulanır.",
            },
            {
              q: "Plan düşürürsem ürünlerime ne olur?",
              a: "Basic'e geçişte 50 ürün limitini aşarsanız yeni ürün ekleyemezsiniz, mevcut ürünler korunur.",
            },
            {
              q: "Marketplace'e publish özelliği nasıl çalışır?",
              a: "Pro ve üzeri planlarda ürün sayfasındaki 'Marketplace'e Yayınla' toggle'ı ile ürünlerinizi genel pazara açabilirsiniz.",
            },
          ].map((item) => (
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
