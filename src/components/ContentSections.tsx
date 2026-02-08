import { useContentSections } from "@/hooks/useContent";
import ContentCarousel from "./ContentCarousel";

const ContentSections = () => {
  const { data: sections, isLoading } = useContentSections();

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="max-w-[1600px] mx-auto px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-8">
              <div className="h-6 w-48 bg-white/10 rounded animate-pulse mb-4" />
              <div className="flex gap-3 overflow-hidden">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div
                    key={j}
                    className="flex-shrink-0 w-[160px] aspect-[2/3] bg-white/10 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#0f0617]">
      {sections.map((section) => (
        <ContentCarousel key={section.id} section={section} />
      ))}
    </div>
  );
};

export default ContentSections;
