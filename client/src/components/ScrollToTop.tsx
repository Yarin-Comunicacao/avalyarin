import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * ScrollToTop — scrolls window to top on every route change.
 * Place this component inside the Router/App tree.
 */
export default function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);

  return null;
}
