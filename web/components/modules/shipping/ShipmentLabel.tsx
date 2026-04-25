"use client";

import { useState } from "react";
import { Printer, Download, Loader2, ExternalLink, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { Shipment } from "@/types/entities";
import { SHIPMENT_STATUS_LABELS, SHIPMENT_STATUS_COLORS } from "@/types/enums";
import api from "@/lib/api";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ShipmentLabelProps {
  shipment: Shipment;
  /** Label oluştur butonu gösterilsin mi (admin yetkisi gerekir) */
  canGenerate?: boolean;
  className?: string;
  onGenerated?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ShipmentLabel({
  shipment,
  canGenerate = false,
  className,
  onGenerated,
}: ShipmentLabelProps) {
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const hasLabel = !!shipment.labelUrl;

  // ── Label oluştur (admin) ─────────────────────────────────────────────────

  async function handleGenerate() {
    setGenerating(true);
    try {
      await api.post(`/api/fulfillment/${shipment.id}/generate-label`);
      onGenerated?.();
    } catch (err) {
      console.error("Label could not be created:", err);
    } finally {
      setGenerating(false);
    }
  }

  // ── PDF indir ──────────────────────────────────────────────────────────────

  async function handleDownload() {
    if (!shipment.labelUrl) return;
    setDownloading(true);
    try {
      const response = await api.get(`/api/fulfillment/${shipment.id}/label`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([response.data as BlobPart]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `kargo-etiketi-${shipment.trackingNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  // ── Print ────────────────────────────────────────────────────────────────

  function handlePrint() {
    if (!shipment.labelUrl) return;
    const win = window.open(shipment.labelUrl, "_blank");
    // PDF yüklendikten sonra yazdırma dialogunu aç
    win?.addEventListener("load", () => win.print());
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Kargo Labeli</CardTitle>
            <CardDescription className="mt-1 font-mono text-xs">
              Takip No: {shipment.trackingNumber}
            </CardDescription>
          </div>
          <Badge
            className={cn(
              "shrink-0 text-xs",
              SHIPMENT_STATUS_COLORS[shipment.status],
            )}
          >
            {SHIPMENT_STATUS_LABELS[shipment.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Kurye bilgisi */}
        {shipment.courierName && (
          <div className="rounded-lg bg-muted px-3 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kurye</span>
              <span className="font-medium">{shipment.courierName}</span>
            </div>
            {shipment.courierPhone && (
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Tel</span>
                <span>{shipment.courierPhone}</span>
              </div>
            )}
            {shipment.courierVehicle && (
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Vehicle</span>
                <span>{shipment.courierVehicle}</span>
              </div>
            )}
          </div>
        )}

        {/* ETA bilgisi */}
        {shipment.estimatedDeliveryStart && (
          <div className="rounded-lg bg-muted px-3 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tahmini Teslimat</span>
              <span className="font-medium">
                {format(
                  new Date(shipment.estimatedDeliveryStart),
                  "d MMM yyyy",
                  { locale: tr },
                )}
                {shipment.estimatedDeliveryEnd &&
                  shipment.estimatedDeliveryEnd !==
                    shipment.estimatedDeliveryStart && (
                    <>
                      {" "}
                      –{" "}
                      {format(
                        new Date(shipment.estimatedDeliveryEnd),
                        "d MMM",
                        { locale: tr },
                      )}
                    </>
                  )}
              </span>
            </div>
          </div>
        )}

        {/* Label önizleme iframe */}
        {hasLabel ? (
          <div className="overflow-hidden rounded-lg border">
            <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <QrCode className="h-3.5 w-3.5" />
                <span>Shipping label ready</span>
              </div>
              <a
                href={shipment.labelUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Open in new tab
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <iframe
              src={shipment.labelUrl!}
              title="Kargo Labeli"
              className="h-64 w-full bg-white"
            />
          </div>
        ) : (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground">
            <QrCode className="h-8 w-8 opacity-30" />
            <p className="text-sm">
              {canGenerate
                ? "Shipping label not yet generated."
                : "Label bekleniyor."}
            </p>
          </div>
        )}

        {/* Aksiyonlar */}
        <div className="flex flex-wrap gap-2">
          {canGenerate && !hasLabel && (
            <Button
              variant="outline"
              size="sm"
              disabled={generating}
              onClick={handleGenerate}
              className="flex-1"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-4 w-4" />
              )}
              Generate Label
            </Button>
          )}

          {hasLabel && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={downloading}
                onClick={handleDownload}
                className="flex-1"
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handlePrint}
                className="flex-1"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

export function ShipmentLabelSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export default ShipmentLabel;
