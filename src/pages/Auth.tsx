import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const { t, locale, localePath } = useTranslation();
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate(localePath('/mi-cuenta'), { replace: true });
    }
  }, [user, loading, navigate, localePath]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    if (error) setError(error);
    setSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (regPassword.length < 6) {
      setError(t('La contraseña debe tener al menos 6 caracteres'));
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(regEmail, regPassword, regName, locale, consent);
    if (error) {
      setError(error);
    } else {
      setRegistered(true);
    }
    setSubmitting(false);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">{t('Mi cuenta')}</h1>

        {registered ? (
          <Card className="p-6 text-center space-y-3">
            <p className="text-accent font-semibold text-lg">🎉 {t('¡Registro completado!')}</p>
            <p className="text-sm text-muted-foreground">
              {t('Revisa tu email para confirmar tu cuenta.')}
            </p>
          </Card>
        ) : (
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">{t('Iniciar sesión')}</TabsTrigger>
              <TabsTrigger value="register">{t('Registrarse')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="p-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">{t('Email')}</label>
                    <Input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('Contraseña')}</label>
                    <Input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? '...' : t('Iniciar sesión')}
                  </Button>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="p-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">{t('Nombre')}</label>
                    <Input type="text" required value={regName} onChange={e => setRegName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('Email')}</label>
                    <Input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('Contraseña')}</label>
                    <Input type="password" required minLength={6} value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} />
                    <label htmlFor="consent" className="text-xs text-muted-foreground leading-tight">
                      {t('Acepto recibir comunicaciones de Feelomove sobre eventos y novedades. Puedes darte de baja cuando quieras.')}
                    </label>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? '...' : t('Registrarse')}
                  </Button>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
