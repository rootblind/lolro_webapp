import Navbar from "../components/Navbar";
import RateLimitedUI from "../components/RateLimitedUI";
import { useSessionContext } from "../context/SessionContext";
import Footer from "../components/Footer";

const MainLayout = ({ children }) => {
    const {loading, isRateLimited} = useSessionContext();

    if (isRateLimited) return <RateLimitedUI />;

    if (loading) {
      return (
        <div className="text-center text-primary py-10">
          <h1>Loading...</h1>
          <span className="loading loading-spinner loading-xl"></span>
        </div>
      );
    }

  return (
    <div>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;