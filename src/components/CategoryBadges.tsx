import { Link } from "react-router-dom";
import { useContentCategories } from "@/hooks/useContent";

const CategoryBadges = () => {
  const { data: categories, isLoading } = useContentCategories();

  const activeCategories = (categories?.filter((cat) => cat.is_active) || [])
    .sort((a, b) => a.name.localeCompare(b.name));

  if (isLoading) {
    return (
      <section className="py-5">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4">
          <div className="flex flex-wrap justify-center gap-2.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-9 w-28 rounded-full bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!activeCategories.length) return null;

  return (
    <section className="py-4">
      <div className="max-w-[720px] mx-auto px-3 sm:px-4">
        <div className="flex flex-wrap justify-center gap-2">
          {activeCategories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className="cat-pill"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryBadges;
