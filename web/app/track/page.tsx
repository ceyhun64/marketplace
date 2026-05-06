export const metadata = {
  title: "Track Your Order — Marketplace",
  description: "Track the status of your order in real time.",
};

export default function TrackRoute() {
  return (
    <main className="container mx-auto px-4 py-16 min-h-[60vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-bold mb-4">Track Your Order</h1>
      <p className="text-muted-foreground max-w-md">
        Enter your tracking number to see the status of your order.
      </p>
    </main>
  );
}
