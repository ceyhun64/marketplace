// DesignPanel - Ana component (mobile responsive)
"use client";

import React, { useState, useRef, useEffect } from "react";
import { DesignPanelProps, LogoLayer } from "./types";
import { DEFAULT_LAYER_VALUES } from "./constants";
import { Toolbar } from "./toolbar";
import { LayersPanel } from "./layersPanel";
import { Canvas } from "./canvas";
import { PropertiesPanel } from "./propertiesPanel";
import { toast } from "sonner";
import { toPng } from "html-to-image";

export default function DesignPanel({
  productImage,
  onClose,
  onSaveDesign,
  onDirectUpload,
}: DesignPanelProps & {
  onSaveDesign?: (imageUrl: string) => void;
  onDirectUpload?: () => void;
}) {
  const [layers, setLayers] = useState<LogoLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [history, setHistory] = useState<LogoLayer[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [tool, setTool] = useState<"select" | "pan">("select");
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  const activeLayer = layers.find((l) => l.id === activeLayerId);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      }
      if (e.key === "v") setTool("select");
      if (e.key === "h") setTool("pan");
      if (e.key === "Delete" && activeLayerId) {
        e.preventDefault();
        deleteLayer(activeLayerId);
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [historyIndex, history, activeLayerId]);

  // History Management
  const saveHistory = (newLayers: LogoLayer[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newLayers)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setLayers(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setLayers(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  // Layer Operations
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5MB'dan küçük olmalıdır.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen geçerli bir resim dosyası seçin.");
      return;
    }

    const url = URL.createObjectURL(file);
    const newLayer: LogoLayer = {
      id: `layer-${Date.now()}`,
      image: url,
      name: `Logo ${layers.length + 1}`,
      ...DEFAULT_LAYER_VALUES,
    };
    const newLayers = [...layers, newLayer];
    setLayers(newLayers);
    setActiveLayerId(newLayer.id);
    saveHistory(newLayers);
    toast.success("Logo eklendi!");
  };

  const updateLayer = (id: string, updates: Partial<LogoLayer>) => {
    const newLayers = layers.map((l) =>
      l.id === id ? { ...l, ...updates } : l,
    );
    setLayers(newLayers);
    saveHistory(newLayers);
  };

  const deleteLayer = (id: string) => {
    const newLayers = layers.filter((l) => l.id !== id);
    setLayers(newLayers);
    setActiveLayerId(newLayers[0]?.id || null);
    saveHistory(newLayers);
    toast.info("Katman silindi");
  };

  const duplicateLayer = (id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (layer) {
      const newLayer = {
        ...JSON.parse(JSON.stringify(layer)),
        id: `layer-${Date.now()}`,
        position: { x: layer.position.x + 20, y: layer.position.y + 20 },
        name: `${layer.name} Copy`,
      };
      const newLayers = [...layers, newLayer];
      setLayers(newLayers);
      setActiveLayerId(newLayer.id);
      saveHistory(newLayers);
      toast.success("Katman kopyalandı!");
    }
  };

  const moveLayer = (id: string, direction: "up" | "down") => {
    const index = layers.findIndex((l) => l.id === id);
    if (
      (direction === "up" && index < layers.length - 1) ||
      (direction === "down" && index > 0)
    ) {
      const newLayers = [...layers];
      const offset = direction === "up" ? 1 : -1;
      [newLayers[index], newLayers[index + offset]] = [
        newLayers[index + offset],
        newLayers[index],
      ];
      setLayers(newLayers);
      saveHistory(newLayers);
    }
  };

  const resetLayer = () => {
    if (activeLayer) {
      updateLayer(activeLayer.id, {
        rotation: 0,
        opacity: 100,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        blur: 0,
        flipH: false,
        flipV: false,
      });
      toast.success("Katman sıfırlandı!");
    }
  };

  const removeBackground = async (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    toast.loading("Arka plan kaldırılıyor...");

    try {
      let imageBase64 = layer.image;

      if (layer.image.startsWith("blob:")) {
        const response = await fetch(layer.image);
        const blob = await response.blob();
        imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!res.ok) {
        throw new Error("API isteği başarısız oldu");
      }

      const data = await res.json();

      updateLayer(layerId, {
        image: data.image,
        backgroundRemoved: true,
      });

      toast.dismiss();
      toast.success("Arka plan başarıyla kaldırıldı!");
    } catch (err) {
      console.error("Background removal error:", err);
      toast.dismiss();
      toast.error("Arka plan kaldırılamadı. Lütfen tekrar deneyin.");
    }
  };

  const handleExport = async () => {
    if (layers.length === 0) {
      toast.error("Lütfen önce bir logo ekleyin.");
      return;
    }

    const designArea = document.getElementById("design-area");
    if (!designArea) return;

    const currentActiveId = activeLayerId;
    setActiveLayerId(null);

    toast.loading("Görsel hazırlanıyor...");

    const filter = (node: HTMLElement) => {
      const exclusionClasses = [
        "react-resizable-handle",
        "export-hide-guides",
        "export-hide-handles",
        "selection-ring",
      ];

      if (node.classList) {
        return !exclusionClasses.some((cls) => node.classList.contains(cls));
      }
      return true;
    };

    try {
      await new Promise((resolve) => setTimeout(resolve, 50));

      const dataUrl = await toPng(designArea, {
        quality: 1,
        pixelRatio: 2,
        filter: filter,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `tasarim-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      toast.dismiss();
      toast.success("Tasarım başarıyla indirildi!");
    } catch (error) {
      console.error("Export hatası:", error);
      toast.dismiss();
      toast.error("Görsel oluşturulurken bir hata oluştu.");
    } finally {
      setActiveLayerId(currentActiveId);
    }
  };

  const handleSaveAndClose = async () => {
    if (layers.length === 0) {
      toast.info(
        "Logo eklenmedi. Dosya yükleme ekranına yönlendiriliyorsunuz...",
      );
      if (onDirectUpload) {
        onDirectUpload();
      }
      onClose();
      return;
    }

    const designArea = document.getElementById("design-area");
    if (!designArea) {
      onClose();
      return;
    }

    const currentActiveId = activeLayerId;
    setActiveLayerId(null);

    toast.loading("Tasarım kaydediliyor...");

    const filter = (node: HTMLElement) => {
      const exclusionClasses = [
        "react-resizable-handle",
        "export-hide-guides",
        "export-hide-handles",
        "selection-ring",
      ];

      if (node.classList) {
        return !exclusionClasses.some((cls) => node.classList.contains(cls));
      }
      return true;
    };

    try {
      await new Promise((resolve) => setTimeout(resolve, 50));

      const dataUrl = await toPng(designArea, {
        quality: 1,
        pixelRatio: 2,
        filter: filter,
        backgroundColor: "#ffffff",
      });

      toast.dismiss();
      toast.success("Tasarımınız başarıyla kaydedildi! 🎨");

      if (onSaveDesign) {
        onSaveDesign(dataUrl);
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
      onClose();
    } catch (error) {
      console.error("Save error:", error);
      toast.dismiss();
      toast.error("Tasarım kaydedilemedi.");
      setActiveLayerId(currentActiveId);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-slate-900 w-full max-w-[1600px] overflow-hidden shadow-2xl flex flex-col h-full border border-slate-700">
        {/* Toolbar */}
        <Toolbar
          historyIndex={historyIndex}
          historyLength={history.length}
          tool={tool}
          zoom={zoom}
          showGrid={showGrid}
          showLeftPanel={showLeftPanel}
          showRightPanel={showRightPanel}
          onUndo={undo}
          onRedo={redo}
          onToolChange={setTool}
          onZoomChange={setZoom}
          onGridToggle={() => setShowGrid(!showGrid)}
          onToggleLeftPanel={() => setShowLeftPanel(!showLeftPanel)}
          onToggleRightPanel={() => setShowRightPanel(!showRightPanel)}
          onExport={handleExport}
          onClose={handleSaveAndClose}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          {showLeftPanel && (
            <div className="hidden lg:block">
              <LayersPanel
                layers={layers}
                activeLayerId={activeLayerId}
                onFileUpload={handleFileUpload}
                onLayerSelect={setActiveLayerId}
                onLayerUpdate={updateLayer}
                onLayerDuplicate={duplicateLayer}
                onLayerDelete={deleteLayer}
                onLayerMove={moveLayer}
              />
            </div>
          )}

          {/* Canvas */}
          <Canvas
            productImage={productImage}
            layers={layers}
            activeLayerId={activeLayerId}
            zoom={zoom}
            showGrid={showGrid}
            showGuides={showGuides}
            tool={tool}
            canvasRef={canvasRef}
            onLayerUpdate={updateLayer}
          />

          {/* Right Panel */}
          {showRightPanel && (
            <div className="hidden lg:block">
              <PropertiesPanel
                activeLayer={activeLayer}
                onLayerUpdate={(updates) =>
                  activeLayer && updateLayer(activeLayer.id, updates)
                }
                onResetLayer={resetLayer}
                onRemoveBackground={removeBackground}
              />
            </div>
          )}
        </div>

        {/* Mobile Bottom Sheet for Layers/Properties */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 max-h-[40vh] overflow-y-auto">
          {activeLayer ? (
            <PropertiesPanel
              activeLayer={activeLayer}
              onLayerUpdate={(updates) =>
                activeLayer && updateLayer(activeLayer.id, updates)
              }
              onResetLayer={resetLayer}
              onRemoveBackground={removeBackground}
            />
          ) : (
            <LayersPanel
              layers={layers}
              activeLayerId={activeLayerId}
              onFileUpload={handleFileUpload}
              onLayerSelect={setActiveLayerId}
              onLayerUpdate={updateLayer}
              onLayerDuplicate={duplicateLayer}
              onLayerDelete={deleteLayer}
              onLayerMove={moveLayer}
            />
          )}
        </div>
      </div>
    </div>
  );
}
