import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventCardCompact from '@/components/EventCardCompact';
import { getEventUrl } from '@/lib/eventUtils';

const MiCuenta = () => {
  const { user, loading, signOut } = useAuth();
  const { t, locale, localePath } = useTranslation();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Fetch subscriber record
  const { data: subscriber, refetch } = useQuery({
    queryKey: ['subscriber', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscribers')
        .select('*')
        .eq('auth_user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Fetch favorite events
  const favoriteIds = subscriber?.favorite_event_ids ?? [];
  const { data: favoriteEvents } = useQuery({
    queryKey: ['favorite-events', favoriteIds],
    queryFn: async () => {
      if (favoriteIds.length === 0) return [];
      const { data } = await supabase
        .from('lovable_mv_event_product_page')
        .select('id, event_id, name, slug, event_date, venue_city, image_large_url, image_standard_url, price_min_incl_fees, sold_out, event_type')
        .in('id', favoriteIds);
      return data ?? [];
    },
    enabled: favoriteIds.length > 0,
  });

  useEffect(() => {
    if (subscriber) {
      setName(subscriber.name ?? '');
      setConsentMarketing(subscriber.consent_marketing ?? false);
    }
  }, [subscriber]);

  useEffect(() => {
    if (!loading && !user) {
      navigate(localePath('/login'), { replace: true });
    }
  }, [user, loading, navigate, localePath]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    await supabase
      .from('subscribers')
      .update({
        name,
        consent_marketing: consentMarketing,
        locale,
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', user.id);
    await refetch();
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate(localePath('/'));
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">{t('Mi cuenta')}</h1>

        {/* My Data */}
        <Card className="p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">{t('Mis datos')}</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('Nombre')}</label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{t('Email')}</label>
              <Input value={user.email ?? ''} disabled className="opacity-60" />
            </div>
          </div>
        </Card>

        {/* Favorites */}
        <Card className="p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">{t('Mis favoritos')}</h2>
          {favoriteIds.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('Aún no tienes favoritos. Explora eventos y guarda los que más te interesen.')}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(favoriteEvents ?? []).map((event) => (
                <EventCardCompact
                  key={event.id}
                  event={{
                    id: event.id ?? undefined,
                    name: event.name ?? undefined,
                    slug: event.slug ?? undefined,
                    event_date: event.event_date,
                    venue_city: event.venue_city ?? '',
                    image_large_url: event.image_large_url ?? undefined,
                    image_standard_url: event.image_standard_url ?? undefined,
                    price_min_incl_fees: event.price_min_incl_fees,
                    sold_out: event.sold_out,
                    event_type: event.event_type,
                  }}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Preferences */}
        <Card className="p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">{t('Preferencias')}</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('Recibir newsletter')}</span>
            <Switch checked={consentMarketing} onCheckedChange={setConsentMarketing} />
          </div>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? '...' : saved ? `✓ ${t('Guardado')}` : t('Guardar cambios')}
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            {t('Cerrar sesión')}
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MiCuenta;
