import { FileXIcon } from "lucide-react";
import { Link } from "react-router";

const NotFound404 = () => {
  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-8">
      <div className="bg-error/10 border border-error/30 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row items-center p-6">
          <div className="flex-shrink-0 bg-error/20 p-4 rounded-full mb-4 md:mb-0 md:mr-6">
            <FileXIcon className="size-10 text-error" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold mb-2">404 — Page Not Found</h3>
            <p className="text-base-content mb-1">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <p className="text-sm text-base-content/70">
              Check the URL or go back to the homepage.
            </p>
            <Link to={"/"} className="btn btn-error btn-sm mt-4">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound404;
