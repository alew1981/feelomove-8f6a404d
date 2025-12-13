import OptimizedImage from "./OptimizedImage";

interface PageHeroProps {
  title: string;
  imageUrl?: string;
  className?: string;
}

const PageHero = ({ title, imageUrl, className = "" }: PageHeroProps) => {
  const defaultImage = "/placeholder.svg";
  
  return (
    <div className={`relative h-[200px] md:h-[280px] overflow-hidden rounded-xl mb-6 ${className}`}>
      <OptimizedImage
        src={imageUrl || defaultImage}
        alt={title}
        priority={true}
        className="w-full h-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute bottom-6 left-6 right-6">
        <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-lg">
          {title}
        </h1>
      </div>
    </div>
  );
};

export default PageHero;