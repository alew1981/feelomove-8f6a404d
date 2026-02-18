/**
 * Convenience re-export of the language context hook.
 * 
 * Usage:
 *   const { t, locale, localePath, formatDate, formatPrice, translateCitySlug } = useTranslation();
 *   <h1>{t('Conciertos')}</h1>
 *   <Link to={localePath('/conciertos')}>{t('Conciertos')}</Link>
 */
export { useLanguage as useTranslation } from '@/contexts/LanguageContext';
