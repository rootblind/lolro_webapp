import Navbar from "../components/Navbar";
import { useSessionContext } from "../context/SessionContext";
import Footer from "../components/Footer";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";


const MainLayout = ({ children }) => {
  const {loading, isRateLimited} = useSessionContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if(!loading && isRateLimited && location.pathname !== "/rate-limited") {
      navigate("/rate-limited", {replace: true});
    }
    
  }, [isRateLimited, loading, navigate, location.pathname]);

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