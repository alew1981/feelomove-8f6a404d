import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { toCanonicalPath, localePath as localePathFn } from "@/lib/i18nRoutes";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

/**
 * Compact ES/EN toggle for the Navbar.
 * Navigates to the equivalent page in the other language.
 */
const LanguageSwitcher = () => {
  const { locale } = useLanguage();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const switchLocale = () => {
    const targetLocale = locale === "es" ? "en" : "es";
    const canonical = toCanonicalPath(pathname);
    const targetPath = localePathFn(canonical, targetLocale);
    navigate(targetPath + search);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
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
