import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Music, Users, Ticket } from 'lucide-react';

interface RelatedLink {
  type: string;
  label: string;
  url: string;
  slug: string;
  event_count?: number;
}

interface RelatedLinksData {
  cities?: RelatedLink[];
  genres?: RelatedLink[];
  top_artists?: RelatedLink[];
  top_cities?: RelatedLink[];
}

interface RelatedLinksProps {
  slug: string;
  type: 'event' | 'artist' | 'city' | 'genre';
}

export const RelatedLinks = ({ slug, type }: RelatedLinksProps) => {
  const [links, setLinks] = useState<RelatedLink[] | RelatedLinksData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const { data, error } = await supabase
          .from('mv_internal_links')
          .select('related_links')
          .eq('source_type', type)
          .eq('source_slug', slug)
          .single();

        if (error) throw error;
        if (data?.related_links) {
          setLinks(data.related_links as RelatedLink[] | RelatedLinksData);
        }
      } catch (error) {
        console.error('Error fetching related links:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchLinks();
    }
  }, [slug, type]);

  if (isLoading || !links) return null;

  const getIcon = (linkType: string) => {
    switch (linkType) {
      case 'city':
        return <MapPin className="h-3.5 w-3.5" />;
      case 'artist':
        return <Users className="h-3.5 w-3.5" />;
      case 'genre':
        return <Music className="h-3.5 w-3.5" />;
      default:
        return <Ticket className="h-3.5 w-3.5" />;
    }
  };

  const renderLinkSection = (title: string, linkArray: RelatedLink[] | null | undefined) => {
    if (!linkArray || linkArray.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">{title}</h4>
        <div className="flex flex-wrap gap-2">
          {linkArray.slice(0, 8).map((link, index) => (
            <Link
              key={`${link.slug}-${index}`}
              to={link.url}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
            >
              {getIcon(link.type)}
              {link.label}
              {link.event_count && link.event_count > 0 && (
                <span className="text-xs text-muted-foreground ml-1">({link.event_count})</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-10 pt-8 border-t border-border">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        🔗 También te puede interesar
      </h3>

      {/* For individual events - links is an array */}
      {type === 'event' && Array.isArray(links) && (
        <div className="flex flex-wrap gap-2">
          {links.map((link: RelatedLink, index: number) => (
            <Link
              key={`${link.slug}-${index}`}
              to={link.url}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
            >
              {getIcon(link.type)}
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* For artists - links has cities and genres */}
      {type === 'artist' && !Array.isArray(links) && (
        <>
          {renderLinkSection('Ciudades donde toca', links.cities)}
          {renderLinkSection('Géneros musicales', links.genres)}
        </>
      )}

      {/* For cities - links has genres and top_artists */}
      {type === 'city' && !Array.isArray(links) && (
        <>
          {renderLinkSection('Géneros disponibles', links.genres)}
          {renderLinkSection('Artistas destacados', links.top_artists)}
        </>
      )}

      {/* For genres - links has top_artists and top_cities */}
      {type === 'genre' && !Array.isArray(links) && (
        <>
          {renderLinkSection('Artistas destacados', links.top_artists)}
          {renderLinkSection('Ciudades con eventos', links.top_cities)}
        </>
      )}
    </div>
  );
};