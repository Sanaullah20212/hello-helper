import { Link } from "react-router-dom";
import { useContentCategories } from "@/hooks/useContent";
import { LayoutGrid } from "lucide-react";

const CategoryBadges = () => {
  const { data: categories, isLoading } = useContentCategories();

  const activeCategories = categories?.filter((cat) => cat.is_active) || [];

  if (isLoading) {
    return (
      <section className="py-4">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!activeCategories.length) return null;

  return (
    <section className="py-4">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="section-header-line mb-4">
          <LayoutGrid className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground whitespace-nowrap">Categories</h2>
        </div>

        {/* Badge Grid */}
        <div className="flex flex-wrap gap-2">
          {activeCategories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className="category-badge-pill"
            >
              {category.image_url && (
                <img
                  src={category.image_url}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover"
                  loading="lazy"
                />
              )}
              <span>{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryBadges;
