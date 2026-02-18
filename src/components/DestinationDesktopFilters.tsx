import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";

interface DestinationDesktopFiltersProps {
  filterCity: string;
  setFilterCity: (value: string) => void;
  cityNames: string[];
  filterGenre: string;
  setFilterGenre: (value: string) => void;
  genres: string[];
  filterArtist: string;
  setFilterArtist: (value: string) => void;
  artists: string[];
  filterMonth: string;
  setFilterMonth: (value: string) => void;
  months: { value: string; label: string }[];
  handleClearFilters: () => void;
}

export default function DestinationDesktopFilters({
  filterCity, setFilterCity, cityNames,
  filterGenre, setFilterGenre, genres,
  filterArtist, setFilterArtist, artists,
  filterMonth, setFilterMonth, months,
  handleClearFilters
}: DestinationDesktopFiltersProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3 mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Select value={filterCity} onValueChange={setFilterCity}>
          <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterCity !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
            <span className="truncate text-sm">{filterCity === "all" ? t("Ciudad") : filterCity}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Todas las ciudades")}</SelectItem>
            {cityNames.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterGenre} onValueChange={setFilterGenre}>
          <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterGenre !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
            <span className="truncate text-sm">{filterGenre === "all" ? t("Género") : filterGenre}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Todos los géneros")}</SelectItem>
            {genres.map((genre) => (
              <SelectItem key={genre} value={genre}>{genre}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterArtist} onValueChange={setFilterArtist}>
          <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterArtist !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
            <span className="truncate text-sm">{filterArtist === "all" ? t("Artista") : filterArtist}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Todos los artistas")}</SelectItem>
            {artists.map((artist) => (
              <SelectItem key={artist} value={artist}>{artist}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterMonth !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
            <span className="truncate text-sm">{filterMonth === "all" ? t("Mes") : months.find(m => m.value === filterMonth)?.label}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Todos los meses")}</SelectItem>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(filterCity !== "all" || filterGenre !== "all" || filterArtist !== "all" || filterMonth !== "all") && (
        <div className="flex justify-end">
          <button
            onClick={handleClearFilters}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors underline"
          >
            {t("Limpiar filtros")}
          </button>
        </div>
      )}
    </div>
  );
}
