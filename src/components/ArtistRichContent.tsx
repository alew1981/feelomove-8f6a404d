import { useMemo } from "react";
import type { ArtistContentData } from "@/hooks/useArtistContent";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ArtistRichContentProps {
  artistContent: ArtistContentData;
  language: "es" | "en";
}

// Country code → flag emoji helper
const FLAG_MAP: Record<string, string> = {
  España: "🇪🇸", Spain: "🇪🇸",
  "Estados Unidos": "🇺🇸", "United States": "🇺🇸", USA: "🇺🇸",
  "Reino Unido": "🇬🇧", "United Kingdom": "🇬🇧", UK: "🇬🇧",
  Colombia: "🇨🇴", México: "🇲🇽", Mexico: "🇲🇽",
  Argentina: "🇦🇷", Brasil: "🇧🇷", Brazil: "🇧🇷",
  Canada: "🇨🇦", Canadá: "🇨🇦",
  Francia: "🇫🇷", France: "🇫🇷",
  Alemania: "🇩🇪", Germany: "🇩🇪",
  Italia: "🇮🇹", Italy: "🇮🇹",
  Portugal: "🇵🇹",
  "Puerto Rico": "🇵🇷",
  Cuba: "🇨🇺",
  Chile: "🇨🇱",
  Perú: "🇵🇪", Peru: "🇵🇪",
  Venezuela: "🇻🇪",
  "República Dominicana": "🇩🇴", "Dominican Republic": "🇩🇴",
  Irlanda: "🇮🇪", Ireland: "🇮🇪",
  Australia: "🇦🇺",
  Suecia: "🇸🇪", Sweden: "🇸🇪",
  Noruega: "🇳🇴", Norway: "🇳🇴",
  "Corea del Sur": "🇰🇷", "South Korea": "🇰🇷",
  Japón: "🇯🇵", Japan: "🇯🇵",
  Jamaica: "🇯🇲",
  Barbados: "🇧🇧",
  Nigeria: "🇳🇬",
  Panamá: "🇵🇦", Panama: "🇵🇦",
};

const getFlag = (country: string | null): string => {
  if (!country) return "";
  return FLAG_MAP[country] ?? "🌍";
};

const formatBirthday = (dateStr: string, lang: "es" | "en"): string => {
  const date = new Date(dateStr + "T00:00:00");
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  if (
    now.getMonth() < date.getMonth() ||
    (now.getMonth() === date.getMonth() && now.getDate() < date.getDate())
  ) {
    age--;
  }

  const day = date.getDate();
  const months_es = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const months_en = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const months = lang === "en" ? months_en : months_es;
  const formatted = `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
  const ageLabel = lang === "en" ? `${age} years` : `${age} años`;
  return `${formatted} (${ageLabel})`;
};

const l = (lang: "es" | "en", es: string, en: string) => (lang === "en" ? en : es);

export default function ArtistRichContent({ artistContent: c, language: lang }: ArtistRichContentProps) {
  const introText = lang === "en" ? c.intro_text_en : c.intro_text_es;
  const bio = lang === "en" ? c.bio_short_en : c.bio_short_es;
  const funFact = lang === "en" ? c.fun_fact_en : c.fun_fact_es;
  const signatureSongs = lang === "en" ? c.signature_songs_en : c.signature_songs_es;
  const whyLive = lang === "en" ? c.why_live_en : c.why_live_es;
  const spainHistory = lang === "en" ? c.spain_history_en : c.spain_history_es;
  const faq = lang === "en" ? c.faq_en : c.faq_es;

  const songs = useMemo(() => {
    if (!signatureSongs) return [];
    return signatureSongs.split(",").map((s) => s.trim()).filter(Boolean);
  }, [signatureSongs]);

  const disco = useMemo(() => {
    if (!c.discography || !Array.isArray(c.discography)) return [];
    return c.discography.slice(0, 6);
  }, [c.discography]);

  // FAQ JSON-LD
  const faqJsonLd = useMemo(() => {
    if (!faq || faq.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    };
  }, [faq]);

  const hasIdentityBar = c.origin_city || c.origin_country || c.birthday || (c.genre_tags && c.genre_tags.length > 0);

  return (
    <div className="space-y-10 mt-12">
      {/* Section 1 — Identity Bar */}
      {hasIdentityBar && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {(c.origin_city || c.origin_country) && (
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true">{getFlag(c.origin_country)}</span>
              {[c.origin_city, c.origin_country].filter(Boolean).join(", ")}
            </span>
          )}
          {c.birthday && (
            <span>{formatBirthday(c.birthday, lang)}</span>
          )}
          {c.genre_tags && c.genre_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {c.genre_tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs font-medium">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section 2 — Intro Paragraph */}
      {introText && (
        <p className="text-lg leading-relaxed text-foreground/90 max-w-3xl">
          {introText}
        </p>
      )}

      {/* Section 3 — Bio + Fun Fact */}
      {(bio || funFact) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bio && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">
                {l(lang, "Sobre el artista", "About the artist")}
              </h2>
              <p className="text-muted-foreground leading-relaxed">{bio}</p>
            </div>
          )}
          {funFact && (
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <span aria-hidden="true">🎵</span>
                {l(lang, "¿Sabías que...?", "Did you know?")}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{funFact}</p>
            </div>
          )}
        </div>
      )}

      {/* Section 4 — Signature Songs */}
      {songs.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">
            {l(lang, "Sus canciones más icónicas", "Iconic songs")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {songs.map((song) => (
              <span
                key={song}
                className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-sm font-medium"
              >
                {song}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Section 5 — Discography */}
      {disco.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">
            {l(lang, "Discografía", "Discography")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {disco.map((album) => {
              const desc = lang === "en" ? (album.description_en || album.description_es) : album.description_es;
              const highlights = lang === "en" ? (album.highlights_en || album.highlights_es) : album.highlights_es;
              return (
                <div
                  key={`${album.album}-${album.year}`}
                  className="border border-border rounded-xl p-4 hover:border-accent/50 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-foreground text-sm leading-tight">{album.album}</h3>
                    <span className="bg-foreground text-background text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0">
                      {album.year}
                    </span>
                  </div>
                  {desc && (
                    <p className="text-muted-foreground text-xs leading-relaxed mb-1">{desc}</p>
                  )}
                  {highlights && (
                    <p className="text-muted-foreground/70 text-xs italic">{highlights}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 6 — Why See Them Live */}
      {whyLive && (
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
            <span aria-hidden="true">🎤</span>
            {l(lang, "¿Por qué verle en directo?", "Why see them live?")}
          </h2>
          <p className="text-muted-foreground leading-relaxed">{whyLive}</p>
        </div>
      )}

      {/* Section 7 — Spain History */}
      {spainHistory && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">
            {l(lang, "Su relación con España", "Their connection with Spain")}
          </h2>
          <p className="text-muted-foreground leading-relaxed">{spainHistory}</p>
        </div>
      )}

      {/* Section 8 — FAQ */}
      {faq && faq.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">
            {l(lang, "Preguntas frecuentes", "Frequently asked questions")}
          </h2>
          <Accordion type="single" collapsible className="border border-border rounded-xl overflow-hidden">
            {faq.map((item, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="px-4">
                <AccordionTrigger className="text-left text-sm font-semibold">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* FAQ JSON-LD */}
          {faqJsonLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
          )}
        </div>
      )}
    </div>
  );
}
