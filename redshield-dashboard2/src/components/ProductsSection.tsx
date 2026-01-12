import { Check, ArrowRight, Crown, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const products = [
  {
    name: "Pro Shield",
    description: "Advanced protection for growing communities",
    price: "Free",
    icon: Crown,
    features: [
      "Full blacklist access",
      "Automated player checks",
      "Discord bot integration",
      "Real-time notifications",
      "Priority support"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    description: "Complete solution for large networks",
    price: "Custom",
    icon: Building2,
    features: [
      "Everything in Pro",
      "API access",
      "Multiple server support",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee"
    ],
    popular: false
  }
];

const ProductsSection = () => {
  return (
    <section id="tools" className="relative py-32 section-fade overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
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
            PRICING
          </motion.span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-orbitron font-black mb-6">
            Choose Your <span className="gradient-text">Shield</span>
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Select the protection level that fits your community's needs
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {products.map((product, index) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className={`relative glass-card p-8 flex flex-col group ${
                product.popular ? 'border-primary/50 ring-2 ring-primary/20' : ''
              }`}
            >
              {/* Popular badge */}
              {product.popular && (
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2"
                >
                  <span className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-full inline-flex items-center gap-1.5 shadow-lg shadow-primary/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    Most Popular
                  </span>
                </motion.div>
              )}

              {/* Glow effect on hover */}
              {product.popular && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              )}

              <div className="relative z-10">
                {/* Icon and name */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    product.popular
                      ? 'bg-primary/20 border border-primary/40'
                      : 'bg-secondary border border-border'
                  }`}>
                    <product.icon className={`w-7 h-7 ${product.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <h3 className="font-orbitron font-bold text-2xl">{product.name}</h3>
                    <p className="text-muted-foreground text-sm">{product.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <span className="text-5xl font-orbitron font-black gradient-text">{product.price}</span>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-10 flex-grow">
                  {product.features.map((feature, featureIndex) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + featureIndex * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        product.popular ? 'bg-primary/20' : 'bg-secondary'
                      }`}>
                        <Check className={`w-3 h-3 ${product.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className={`w-full group py-6 text-lg font-bold ${
                      product.popular
                        ? 'btn-glow bg-primary hover:bg-primary/90 text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border'
                    }`}
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-2" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
