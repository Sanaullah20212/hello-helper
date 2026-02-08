import { useRef } from "react";
import { useContentCategories } from "@/hooks/useContent";
import { useWheelPassthrough } from "@/hooks/useWheelPassthrough";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const CategoryCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: categories, isLoading } = useContentCategories();

  useWheelPassthrough(scrollRef);

  // Filter only categories with images
  const categoriesWithImages = categories?.filter(cat => cat.image_url && cat.is_active) || [];

  if (isLoading) {
    return (
      <div className="py-6 bg-[#0f0617]">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex-shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/10 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!categoriesWithImages.length) {
    return null;
  }

  return (
    <div className="py-6 bg-[#0f0617]">
      <div className="max-w-[1600px] mx-auto px-4">
        <div 
          ref={scrollRef}
          className="flex gap-5 md:gap-6 overflow-x-auto scrollbar-hide pb-2"
        >
          {categoriesWithImages.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className="flex-shrink-0 group flex flex-col items-center"
            >
              <div className={cn(
                "w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden",
                "border-2 border-white/20",
                "transition-all duration-300",
                "group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/30"
              )}>
                <img
                  src={category.image_url!}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              <p className="text-center text-xs md:text-sm text-muted-foreground mt-2 truncate max-w-20 md:max-w-24 group-hover:text-foreground transition-colors">
                {category.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryCarousel;
