import { useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";

interface WaitlistFormProps {
  eventId: string;
}

const WaitlistForm = memo(({ eventId }: WaitlistFormProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const { error } = await supabase
        .from("waitlist_notifications")
        .insert({ event_id: eventId, email: email.trim() });

      if (error) throw error;
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-center">
        <p className="text-accent font-bold text-sm mb-1">✓ {t("¡Te avisaremos!")}</p>
        <p className="text-xs text-muted-foreground">
          {t("Te hemos registrado correctamente. Recibirás un aviso cuando haya novedades.")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-3">
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
      <Button
        type="submit"
        disabled={status === "loading"}
        className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold whitespace-nowrap"
      >
        {t("Avísame cuando haya entradas")}
      </Button>
      {status === "error" && (
        <p className="text-xs text-destructive mt-1">
          {t("Error al registrarte. Inténtalo de nuevo.")}
        </p>
      )}
    </form>
  );
});

WaitlistForm.displayName = "WaitlistForm";

export default WaitlistForm;
