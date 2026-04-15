import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";

export function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll the main content area to top on route change
    const mainEl = document.querySelector('.app-scroll-area');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, left: 0 });
    }
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
}

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(() => {
    const mainEl = document.querySelector('.app-scroll-area');
    if (mainEl) {
      setVisible(mainEl.scrollTop > 200);
    }
  }, []);

  useEffect(() => {
    const mainEl = document.querySelector('.app-scroll-area');
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
      return () => mainEl.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const scrollToTop = () => {
    const mainEl = document.querySelector('.app-scroll-area');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-24 right-4 z-50 p-2.5 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
      style={{
        backgroundColor: 'hsl(120 30% 22%)',
        color: 'white',
      }}
      aria-label="Voltar ao topo"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
