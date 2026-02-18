import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { toCanonicalPath, localePath as localePathFn } from "@/lib/i18nRoutes";

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
    <button
      onClick={switchLocale}
      className="flex items-center gap-1 text-sm font-medium px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
      aria-label={locale === "es" ? "Switch to English" : "Cambiar a Español"}
      title={locale === "es" ? "Switch to English" : "Cambiar a Español"}
    >
      <span className={locale === "es" ? "font-bold text-foreground" : "text-muted-foreground"}>ES</span>
      <span className="text-muted-foreground/50">/</span>
      <span className={locale === "en" ? "font-bold text-foreground" : "text-muted-foreground"}>EN</span>
    </button>
  );
};

export default LanguageSwitcher;
