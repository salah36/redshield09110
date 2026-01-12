import { Zap, Shield, Users, MessageSquare, RefreshCw, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Zap,
    title: "Lightning Performance",
    description: "Blazing-fast checks with zero impact on your server. Optimized for high-traffic environments."
  },
  {
    icon: Shield,
    title: "Military Security",
    description: "End-to-end encryption protects all data. Your server information remains fully confidential."
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Built and maintained by the community. Every report strengthens the entire network."
  },
  {
    icon: MessageSquare,
    title: "Discord Sync",
    description: "Seamless Discord integration syncs bans across platforms. One ban, universal protection."
  },
  {
    icon: RefreshCw,
    title: "Real-time Checks",
    description: "Instant verification against our blacklist. Block threats before they cause damage."
  },
  {
    icon: TrendingUp,
    title: "Always Evolving",
    description: "Regular updates with new features and improved detection. Always ahead of threats."
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-32 section-fade overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
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
            FEATURES
          </motion.span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-orbitron font-black mb-6">
            Powerful <span className="gradient-text">Features</span>
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
            Everything you need to protect your community from cheaters
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card-hover p-8 group cursor-default relative overflow-hidden"
            >
              {/* Hover glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />

              <div className="relative z-10">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/50 transition-all duration-300">
                    <feature.icon className="w-8 h-8 text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)] group-hover:drop-shadow-[0_0_20px_hsl(var(--primary)/0.8)] transition-all duration-300" />
                  </div>
                  <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-500" />
                </div>

                <h3 className="font-orbitron font-bold text-xl mb-3 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>

                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
