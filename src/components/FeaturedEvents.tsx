import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, MapPin, Hotel } from "lucide-react";
import electronicImg from "@/assets/festival-electronic.jpg";
import rockImg from "@/assets/festival-rock.jpg";
import jazzImg from "@/assets/festival-jazz.jpg";

const events = [
  {
    id: 1,
    title: "Summer Electronic Festival",
    location: "Barcelona, España",
    date: "15-17 Julio 2024",
    price: "Desde €299",
    image: electronicImg,
    hotels: 12,
  },
  {
    id: 2,
    title: "Rock Legends Tour",
    location: "Madrid, España",
    date: "22 Agosto 2024",
    price: "Desde €189",
    image: rockImg,
    hotels: 8,
  },
  {
    id: 3,
    title: "Jazz Night Festival",
    location: "Valencia, España",
    date: "5-6 Septiembre 2024",
    price: "Desde €149",
    image: jazzImg,
    hotels: 15,
  },
];

const FeaturedEvents = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Eventos Destacados
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Los mejores festivales y conciertos con alojamiento a tu medida
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <Card
              key={event.id}
              className="overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-b from-card to-card/80"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  {event.price}
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3">{event.title}</h3>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-secondary" />
                    <span className="text-sm">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hotel className="h-4 w-4 text-accent" />
                    <span className="text-sm">{event.hotels} hoteles disponibles</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button className="w-full" variant="default">
                  Ver Detalles
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedEvents;
