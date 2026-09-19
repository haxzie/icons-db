"use client";

import { useEffect } from "react";

export function DevTools() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") import("react-grab");
  }, []);
  return null;
}
