// src/components/SiteFooter.jsx
import React from "react";

export default function SiteFooter() {
  return (
    <footer className="border-t mt-8">
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-slate-500 text-center">
        © {new Date().getFullYear()} ESPOL · Proyecto TAWS
      </div>
    </footer>
  );
}