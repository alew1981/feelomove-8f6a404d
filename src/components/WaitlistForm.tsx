import { useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";

interface WaitlistFormProps {
  eventId: string;
}

const WaitlistForm = memo(({ eventId }: WaitlistFormProps) => {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const canSubmit = email.trim().length > 0 && consent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    try {
      const trimmedEmail = email.trim();
      const trimmedName = name.trim() || null;

      // Upsert 1 — waitlist_notifications
      const { error: waitlistError } = await supabase
        .from("waitlist_notifications")
        .upsert(
          { event_id: eventId, email: trimmedEmail },
          { onConflict: "event_id,email", ignoreDuplicates: true }
        );
      if (waitlistError) throw waitlistError;

      // Upsert 2 — subscribers
      const { error: subscriberError } = await supabase
        .from("subscribers")
        .upsert(
          {
            email: trimmedEmail,
            name: trimmedName,
            locale,
            consent_marketing: true,
            consent_date: new Date().toISOString(),
            source: "waitlist",
            source_event_id: eventId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email", ignoreDuplicates: false }
        );
      if (subscriberError) throw subscriberError;

      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-center">
        <p className="text-accent font-bold text-sm mb-1">✓ {t("¡Apuntado! Te avisaremos cuando las entradas estén disponibles.")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="text"
          maxLength={100}
          placeholder={t("Tu nombre")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
          disabled={status === "loading"}
        />
        <Input
          type="email"
          required
          maxLength={255}
          placeholder={t("Tu email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={status === "loading"}
        />
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <Checkbox
          checked={consent}
          onCheckedChange={(checked) => setConsent(checked === true)}
          disabled={status === "loading"}
          className="mt-0.5"
        />
        <span className="text-xs text-muted-foreground leading-snug">
          {t("Acepto recibir comunicaciones de Feelomove sobre este evento y otros similares. Puedes darte de baja cuando quieras.")}
        </span>
      </label>

      <Button
        type="submit"
        disabled={!canSubmit || status === "loading"}
        className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold whitespace-nowrap w-full sm:w-auto"
      >
        {t("Avísame cuando haya entradas")}
      </Button>

      {status === "error" && (
        <p className="text-xs text-destructive">
          {t("Algo ha fallado. Inténtalo de nuevo.")}
        </p>
      )}
    </form>
  );
});

WaitlistForm.displayName = "WaitlistForm";

export default WaitlistForm;
