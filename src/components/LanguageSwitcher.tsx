import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { toCanonicalPath, localePath as localePathFn } from "@/lib/i18nRoutes";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const SESSION_KEY = "lang_tooltip_shown";

/** Returns true for individual event/product pages */
function isEventPage(pathname: string): boolean {
  // Match /conciertos/slug, /en/tickets/slug, /festivales/slug, /en/festivals/slug, /producto/slug
  return /^\/(conciertos|en\/tickets|festivales|en\/festivals|producto)\/[^/]+/.test(pathname);
}

const LanguageSwitcher = () => {
  const { locale } = useLanguage();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [open, setOpen] = useState(false);

  // Auto-show tooltip once per session on event pages
  useEffect(() => {
    if (!isEventPage(pathname)) return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch { /* ignore */ }

    const showTimer = setTimeout(() => setOpen(true), 800);
    const hideTimer = setTimeout(() => {
      setOpen(false);
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
    }, 4500);

    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [pathname]);

  const switchLocale = () => {
    const targetLocale = locale === "es" ? "en" : "es";
    const canonical = toCanonicalPath(pathname);
    const targetPath = localePathFn(canonical, targetLocale);
    navigate(targetPath + search);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            onClick={switchLocale}
            className="flex items-center gap-1.5 text-sm md:text-sm text-base font-medium px-3 py-2 md:px-2.5 md:py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
            aria-label={locale === "es" ? "Switch to English" : "Cambiar a Español"}
          >
            <span className={locale === "es" ? "font-bold text-foreground" : "text-muted-foreground"}>ES</span>
            <span className="text-muted-foreground/50">/</span>
            <span className={locale === "en" ? "font-bold text-foreground" : "text-muted-foreground"}>EN</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {locale === "es" ? "Selecciona tu idioma" : "Select your language"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LanguageSwitcher;
