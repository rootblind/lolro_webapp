import { Link } from "react-router";

const Footer = () => {
  return (
    <footer className="bg-base-200 border-t border-base-content/10 mt-10">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left side */}
          <p className="text-sm opacity-75">
            © {new Date().getFullYear()} LOLRO. All rights reserved.
          </p>

          {/* Right side */}
          <div className="flex gap-4 text-sm">
            <Link to="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:underline">
              Terms of Service
            </Link>
            <a href="https://github.com/rootblind/lolro_webapp" target="_blank" className="hover:underline">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
