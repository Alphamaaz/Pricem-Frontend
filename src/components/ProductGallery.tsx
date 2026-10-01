"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Handshake,
  MapPin,
  Play,
  X,
} from "lucide-react";
import { assetUrl } from "@/lib/api";

type GalleryItem = { type: "image" | "video"; url: string; alt?: string };

interface ProductGalleryProps {
  title: string;
  cover: { url: string; alt?: string };
  media: GalleryItem[];
  condition?: "new" | "used";
  locationText?: string;
  isNegotiable?: boolean;
}

export function ProductGallery({
  title,
  cover,
  media,
  condition,
  locationText,
  isNegotiable = true,
}: ProductGalleryProps) {
  const items: GalleryItem[] = [{ type: "image", ...cover }, ...media];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const selected = items[selectedIndex] ?? items[0];

  function handlePrev() {
    setSelectedIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  }

  function handleNext() {
    setSelectedIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  }

  return (
    <div className="space-y-4">
      {/* Main Showcase Stage */}
      <div className="relative aspect-[4/3] sm:aspect-square w-full rounded-3xl border border-line bg-gradient-to-b from-sunken/40 to-sunken/90 shadow-soft overflow-hidden group">
        {selected.type === "video" ? (
          <video
            key={selected.url}
            src={assetUrl(selected.url)}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="h-full w-full bg-black object-contain"
            aria-label={selected.alt ?? `${title} video presentation`}
          />
        ) : (
          <div
            onClick={() => setLightboxOpen(true)}
            className="h-full w-full flex items-center justify-center p-4 sm:p-6 cursor-zoom-in"
          >
            <img
              key={selected.url}
              src={selected?.url ? assetUrl(selected.url) : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85"}
              alt={selected?.alt ?? title}
              onError={(e) => {
                const el = e.currentTarget;
                if (!el.src.includes("photo-1523275335684-37898b6baf30")) {
                  el.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85";
                }
              }}
              className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105 select-none"
            />
          </div>
        )}

        {/* Floating Top Badges */}
        <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-2 pointer-events-none">
          {condition && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider backdrop-blur-md border shadow-soft ${
                condition === "new"
                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-800"
                  : "bg-surface/90 border-line text-body"
              }`}
            >
              {condition === "new" ? "Brand New" : "Pre-Owned"}
            </span>
          )}

          {locationText && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white shadow-soft">
              <MapPin className="h-3.5 w-3.5 text-white/80" />
              <span>{locationText}</span>
            </span>
          )}
        </div>

        {/* Price Am Negotiable Floating Tag */}
        {isNegotiable && (
          <div className="absolute bottom-3.5 left-3.5 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md border border-line px-3.5 py-1.5 text-xs font-black text-primary shadow-glow">
              <Handshake className="h-4 w-4 text-primary" strokeWidth={2.4} />
              Price Am · Negotiable
            </span>
          </div>
        )}

        {/* Image Counter & Fullscreen trigger */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
          <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-bold text-white shadow-soft">
            {selectedIndex + 1} / {items.length}
          </span>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors shadow-soft"
            title="Expand Fullscreen"
          >
            <Expand className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Navigation Arrows (Visible if multiple items) */}
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 backdrop-blur-md border border-line text-ink hover:text-primary hover:border-primary opacity-0 group-hover:opacity-100 transition-all shadow-soft"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 backdrop-blur-md border border-line text-ink hover:text-primary hover:border-primary opacity-0 group-hover:opacity-100 transition-all shadow-soft"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Carousel Strip */}
      {items.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {items.map((item, index) => {
            const isSelected = selectedIndex === index;
            return (
              <button
                key={`${item.url}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`View photo ${index + 1}`}
                aria-pressed={isSelected}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                  isSelected
                    ? "border-primary shadow-glow ring-2 ring-primary/20 scale-[1.02]"
                    : "border-line bg-sunken hover:border-primary/50 opacity-70 hover:opacity-100"
                }`}
              >
                {item.type === "video" ? (
                  <>
                    <video
                      src={assetUrl(item.url)}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play className="h-6 w-6 fill-white text-white drop-shadow" />
                    </span>
                  </>
                ) : (
                  <img
                    src={item.url ? assetUrl(item.url) : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80"}
                    alt={item.alt ?? `${title} photo ${index + 1}`}
                    loading="lazy"
                    onError={(e) => {
                      const el = e.currentTarget;
                      if (!el.src.includes("photo-1523275335684-37898b6baf30")) {
                        el.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80";
                      }
                    }}
                    className="h-full w-full object-cover"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in-up">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="max-w-4xl max-h-[85vh] w-full flex items-center justify-center p-4">
            {selected.type === "video" ? (
              <video
                src={assetUrl(selected.url)}
                controls
                autoPlay
                className="max-h-[80vh] max-w-full rounded-2xl"
              />
            ) : (
              <img
                src={assetUrl(selected.url)}
                alt={selected.alt ?? title}
                className="max-h-[80vh] max-w-full object-contain rounded-2xl"
              />
            )}
          </div>

          {items.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold">
              <button onClick={handlePrev} className="hover:text-primary">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>{selectedIndex + 1} / {items.length}</span>
              <button onClick={handleNext} className="hover:text-primary">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
