interface PageHeroProps {
  title: string;
  imageUrl?: string;
  className?: string;
}

const PageHero = ({ title, imageUrl, className = "" }: PageHeroProps) => {
  // Use a default concert image if none provided
  const defaultImage = "https://s1.ticketm.net/dam/a/512/655083a1-b8c6-45f5-ba9a-f7c3bca2c512_EVENT_DETAIL_PAGE_16_9.jpg";
  const finalImage = imageUrl && imageUrl !== "/placeholder.svg" ? imageUrl : defaultImage;
  
  return (
    <div className={`relative h-[200px] md:h-[280px] overflow-hidden rounded-xl mb-6 ${className}`}>
      <img
        src={finalImage}
        alt={title}
        className="w-full h-full object-cover"
        loading="eager"
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