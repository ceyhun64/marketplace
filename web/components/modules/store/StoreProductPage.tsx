import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { fetchISR } from "@/lib/fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Star, Package, Clock } from "lucide-react";
import { AddToCartButton } from "@/components/modules/store/AddToCartButton";
import { WishlistButton } from "@/components/modules/store/WishlistButton";

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  images: string[];
  tags: string[];
  categoryName?: string;
}

interface StoreOffer {
  id: string;
  productId: string;
  price: number;
  stock: number;
  rating: number;
  handlingHours?: number;
  merchantName: string;
  merchantSlug: string;
}

export async function generateMetadata({
  params: paramsPromise,
}: Props): Promise<Metadata> {
  try {
    const params = await paramsPromise;
    const resp = await fetchISR<{ data: ProductDetail }>(`/api/products/${params.id}`);
    const product = resp?.data;
    if (!product) return { title: "Product Not Found" };
    return {
      title: `${product.name} | Product Details`,
      description: product.description?.slice(0, 160),
      openGraph: {
        title: product.name,
        images: product.images,
      },
    };
  } catch {
    return { title: "Product Not Found" };
  }
}

export default async function StoreProductPage({
  params: paramsPromise,
}: Props) {
  const params = await paramsPromise;
  let product: ProductDetail | null = null;
  let offers: StoreOffer[] = [];

  try {
    const [productResp, offersResp] = await Promise.all([
      fetchISR<{ data: ProductDetail }>(`/api/products/${params.id}`),
      fetchISR<{ data: StoreOffer[] }>(`/api/store/${params.slug}/products`),
    ]);

    product = productResp?.data ?? null;
    const allOffers = offersResp?.data ?? [];
    offers = allOffers.filter((o: StoreOffer) => o.productId === params.id);
  } catch {
    notFound();
  }

  if (!product) notFound();

  const safeProduct = product as ProductDetail;
  const storeOffer = offers[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span>/</span>
          <Link href={`/store/${params.slug}`} className="hover:underline">
            Store
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-xs">
            {safeProduct.name}
          </span>
        </div>

        <Link href={`/store/${params.slug}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Store
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
              {safeProduct.images[0] ? (
                <Image
                  src={safeProduct.images[0]}
                  alt={safeProduct.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="h-full flex items-center justify-center text-6xl text-muted-foreground">
                  📦
                </div>
              )}
            </div>
            {safeProduct.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {safeProduct.images.map((img, i) => (
                  <div
                    key={i}
                    className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden border"
                  >
                    <Image
                      src={img}
                      alt={`${safeProduct.name} ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {safeProduct.categoryName && (
              <Badge variant="secondary" className="mb-2">
                {safeProduct.categoryName}
              </Badge>
            )}
            <h1 className="text-2xl font-bold mb-3">{safeProduct.name}</h1>

            {storeOffer && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-bold">
                    {storeOffer.price.toLocaleString("tr-TR", {
                      style: "currency",
                      currency: "TRY",
                    })}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {storeOffer.rating.toFixed(1)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-5">
                  <span className="flex items-center gap-1.5">
                    <Package className="h-4 w-4" />
                    {storeOffer.stock > 0 ? (
                      <span className="text-green-600 font-medium">
                        In Stock ({storeOffer.stock} adet)
                      </span>
                    ) : (
                      <span className="text-red-500 font-medium">
                        Out of Stock
                      </span>
                    )}
                  </span>
                  {storeOffer.handlingHours && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      Handling: {storeOffer.handlingHours} hours
                    </span>
                  )}
                </div>

                <AddToCartButton
                  offerId={storeOffer.id}
                  productId={safeProduct.id}
                  productName={safeProduct.name}
                  image={safeProduct.images[0] ?? ""}
                  price={storeOffer.price}
                  merchantId={params.slug}
                  disabled={storeOffer.stock === 0}
                />
                <WishlistButton
                  productId={safeProduct.id}
                  productName={safeProduct.name}
                  className="w-full"
                />
              </>
            )}

            <Separator className="my-5" />

            <div>
              <h2 className="font-semibold mb-2">Product Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {safeProduct.description}
              </p>
            </div>

            {safeProduct.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {safeProduct.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
