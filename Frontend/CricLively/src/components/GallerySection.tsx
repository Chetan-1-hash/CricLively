import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { getgalleryApi } from "../API/GalleryApi";
import { Gallery } from "./data/DTO";
import { toast } from "../hooks/use-toast";

export default function GallerySection() {
  const [images, setImages] = useState<Gallery[]>([]);
  const years = ["All", 2022, 2023, 2024, 2025] as const;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeYear, setActiveYear] = useState<typeof years[number]>("All");

  useEffect(() => {
    getGalleryImages();
  },[])

  const getGalleryImages = async () => {
    try {
        const response = await getgalleryApi();
        if (response) {
          setImages(response);
        }
      } catch (error) {
        console.error("Failed to fetch gallery:", error);
        toast({
          title: "Error",
          description: "Failed to fetch gallery",
          variant: "destructive"
        });
      }
  }

  const filteredImages =
    activeYear === "All"
      ? images
      : images.filter((img) => img.year === activeYear);

  return (
    <>
      <Navbar />

      <section className="min-h-screen py-24 bg-background/80 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-10"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground">
              CricLively Gallery
            </h1>
          </motion.div>

          {/* Year Filter Buttons */}
          <div className="flex  mb-12">
            <div className="relative flex bg-background/70 border border-border rounded-full p-1">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setActiveYear(year)}
                  className={`relative z-10 px-6 py-2 text-sm font-semibold rounded-full transition-colors ${
                    activeYear === year
                      ? "text-primary-foreground"
                      : "text-foreground/70"
                  }`}
                >
                  {year}
                </button>
              ))}

              {/* Sliding active background */}
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute top-1 bottom-1 bg-primary rounded-full"
                style={{
                  width: `${100 / years.length}%`,
                  left: `${
                    (years.indexOf(activeYear) * 100) / years.length
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Gallery Grid */}
          <motion.div
            layout
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence>
              {filteredImages.map((img, index) => (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedImage(img.fileName)}
                  className="cursor-pointer rounded-3xl overflow-hidden shadow-2xl"
                >
                  <img
                    src={`${img.fileName}?auto=format&fit=crop&w=800&q=80`}
                    alt="gallery"
                    className="w-full h-64 object-cover"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
              onClick={() => setSelectedImage(null)}
            >
              <motion.img
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                transition={{ duration: 0.4 }}
                src={`${selectedImage}?auto=format&fit=crop&w=1200&q=80`}
                className="max-h-[80vh] rounded-3xl shadow-2xl"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </>
  );
}
