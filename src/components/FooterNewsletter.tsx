import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const IconMail = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const FooterNewsletter = () => {
  const { t, locale } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');
    try {
      const { error } = await supabase
        .from('subscribers')
        .upsert({
          email,
          locale,
          consent_marketing: true,
          consent_date: new Date().toISOString(),
          source: 'footer_newsletter',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email', ignoreDuplicates: false });

      if (error) throw error;
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-4">
        <p className="text-accent font-semibold text-lg">🎶 {t('¡Estás dentro!')}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {t('Te avisaremos de los mejores eventos. ¡Nos vemos en el próximo concierto!')}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto md:mx-0">
      <h3 className="font-bold text-lg text-foreground mb-1">
        {t('No te pierdas nada')}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {t('Conciertos, festivales y hoteles. Te avisamos de los mejores eventos cerca de ti.')}
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
            placeholder={t('Tu email')}
            className="pl-9"
            disabled={status === 'loading'}
          />
        </div>
        <Button type="submit" size="default" disabled={!email || status === 'loading'}>
          {status === 'loading' ? '...' : t('Suscribirme')}
        </Button>
      </form>

      {status === 'error' && (
        <p className="text-sm text-destructive mt-2">
          {t('Algo ha fallado. Inténtalo de nuevo.')}
        </p>
      )}

      <p className="text-xs text-muted-foreground/70 mt-3">
        {t('Sin spam. Solo música. Puedes darte de baja cuando quieras.')}
      </p>
    </div>
  );
};

export default FooterNewsletter;
