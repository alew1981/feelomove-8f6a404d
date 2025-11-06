import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedEvents from "@/components/FeaturedEvents";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <FeaturedEvents />
      <Footer />
    </div>
  );
};

export default Index;
