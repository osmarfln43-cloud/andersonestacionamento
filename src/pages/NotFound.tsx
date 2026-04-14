import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center pdv-card p-8">
        <h1 className="mb-4 text-4xl font-bold font-mono text-primary">404</h1>
        <p className="mb-4 text-lg text-muted-foreground font-mono">Página não encontrada</p>
        <a href="/" className="pdv-btn-green inline-block">
          Voltar ao Início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
