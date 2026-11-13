import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Home page: the section under the hero.
export default function TeamGenerationSection() {
  const navigate = useNavigate();
  return (
    <section className="py-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="container mx-auto max-w-3xl bg-card/80 backdrop-blur-xl rounded-3xl p-5 sm:p-8 shadow-2xl text-center"
      >
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">Team Generation</h2>
        <p className="text-foreground/70 mb-6">
          Upload your players list and create balanced teams in seconds. Export them as PDF or Excel.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/team-generation")}
          className="px-8 py-3 bg-red-600 text-white rounded-full font-semibold shadow-lg"
        >
          Team Generation
        </motion.button>
      </motion.div>
    </section>
  );
}
