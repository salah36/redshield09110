import { useQuery } from "@tanstack/react-query";
import { Server, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useState } from "react";

const PartnersSection = () => {
  const { data: partners } = useQuery({
    queryKey: ['public-partners'],
    queryFn: () => api.getPublicTrustedPartners(),
    initialData: [],
  });

  if (!partners || partners.length === 0) {
    return null; // Don't show section if no partners
  }

  return (
    <section id="partners" className="relative py-32 section-fade overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[150px]"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-semibold mb-6"
          >
            PARTNERS
          </motion.span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-orbitron font-black mb-6">
            Trusted <span className="gradient-text">Partners</span>
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Leading RedM communities trust RedShield for their protection
          </p>
        </motion.div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {partners.map((partner: any, index: number) => (
            <PartnerCard key={partner.id} partner={partner} index={index} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-6 text-lg">
            Want to become a trusted partner?
          </p>
          <motion.a
            href="#"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/30 text-primary font-semibold hover:bg-primary/20 hover:border-primary/50 transition-all duration-300 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Apply for partnership
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

const PartnerCard = ({ partner, index }: { partner: any; index: number }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.a
      href={partner.discord_link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -8, scale: 1.05 }}
      className="glass-card-hover p-6 text-center group cursor-pointer relative overflow-hidden"
    >
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <motion.div
          className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary border border-border flex items-center justify-center overflow-hidden group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-300"
          whileHover={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.3 }}
        >
          {partner.server_icon_url && !imageError ? (
            <>
              <img
                src={partner.server_icon_url}
                alt={partner.display_name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
                onLoad={() => setImageLoaded(true)}
                style={{ display: imageLoaded ? 'block' : 'none' }}
              />
              {!imageLoaded && (
                <Server className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors duration-300 group-hover:drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)]" />
              )}
            </>
          ) : (
            <Server className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors duration-300 group-hover:drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)]" />
          )}
        </motion.div>
        <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors duration-300">
          {partner.display_name}
        </h4>
      </div>
    </motion.a>
  );
};

export default PartnersSection;
