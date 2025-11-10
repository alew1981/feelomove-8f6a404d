import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Search, Music2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Categorias = () => {
  const { categoryId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_list_page_view")
        .select("category_id, category_name")
        .not("category_id", "is", null)
        .not("category_name", "is", null)
        .gt("event_date", new Date().toISOString());
      
      if (error) throw error;
      
      // Count events per category
      const categoryCounts = data.reduce((acc: any, item) => {
        const id = item.category_id;
        if (!acc[id]) {
          acc[id] = {
            category_id: item.category_id,
            category_name: item.category_name,
            event_count: 0
          };
        }
        acc[id].event_count++;
        return acc;
      }, {});
      
      const uniqueCategories = Object.values(categoryCounts);
      
      return uniqueCategories.sort((a: any, b: any) => 
        b.event_count - a.event_count
      );
    },
  });

  const { data: categoryEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["categoryEvents", categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      
      const { data, error } = await supabase
        .from("event_list_page_view")
        .select("event_id, event_name, venue_city, venue_name, event_date, image_standard_url, min_price, main_attraction_name")
        .eq("category_id", categoryId)
        .gt("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!categoryId,
  });

  const filteredCategories = categories?.filter((cat: any) =>
    cat.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCategoryData = categories?.find((c: any) => c.category_id === categoryId);

  if (categoryId && selectedCategoryData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8 mt-20">
          <Breadcrumbs />
          
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-6"
          >
            ← Volver a Géneros
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{(selectedCategoryData as any).category_name}</h1>
            <p className="text-muted-foreground text-lg">
              {categoryEvents?.length || 0} eventos próximos
            </p>
          </div>

          {isLoadingEvents ? (
            <div className="text-center py-12">Cargando eventos...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categoryEvents?.map((event) => {
                const eventDate = new Date(event.event_date);
                const formattedDate = eventDate.toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <Card key={event.event_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={event.image_standard_url || "/placeholder.svg"}
                        alt={event.event_name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end">
                        <h3 className="font-bold text-lg p-4 line-clamp-2 text-foreground">{event.event_name}</h3>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      {event.main_attraction_name && (
                        <p className="text-sm text-muted-foreground mb-2">{event.main_attraction_name}</p>
                      )}
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-secondary" />
                          <span>{event.venue_city}</span>
                        </div>
                        {event.venue_name && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs">{event.venue_name}</span>
                          </div>
                        )}
                      </div>
                      {event.min_price && (
                        <div className="mt-3">
                          <Badge variant="secondary">Desde €{Number(event.min_price).toFixed(2)}</Badge>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button asChild className="w-full">
                        <Link to={`/producto/${event.event_id}`}>Ver Detalles</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        <Breadcrumbs />
        
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Géneros</h1>
          <p className="text-muted-foreground text-lg">
            Explora eventos por género musical
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar géneros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoadingCategories ? (
          <div className="text-center py-12">Cargando géneros...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCategories?.slice(0, 12).map((category: any) => (
              <Card
                key={category.category_id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => window.location.href = `/categorias/${category.category_id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-xl mb-1">{category.category_name}</h3>
                      <p className="text-sm text-muted-foreground">Género</p>
                    </div>
                    <Music2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {category.event_count} eventos
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button className="w-full">
                    Ver Eventos
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Categorias;
