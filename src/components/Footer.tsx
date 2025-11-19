import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Shop */}
          <div>
            <h3 className="font-heading text-sm mb-4">SHOP</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/collection" className="hover:text-accent transition-colors">
                  Collection
                </Link>
              </li>
              <li>
                <Link to="/custom-lab" className="hover:text-accent transition-colors">
                  Custom Lab
                </Link>
              </li>
              <li>
                <Link to="/jager-pro" className="hover:text-accent transition-colors">
                  Jäger Pro
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-heading text-sm mb-4">SUPPORT</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contact" className="hover:text-accent transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-accent transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-accent transition-colors">
                  Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-heading text-sm mb-4">LEGAL</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="hover:text-accent transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-accent transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Large Logo */}
        <div className="border-t border-background/20 pt-8">
          <h2 className="text-6xl md:text-8xl font-heading tracking-widest">JÄGER</h2>
        </div>
      </div>
    </footer>
  );
};
