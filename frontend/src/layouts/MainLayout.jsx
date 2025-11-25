import Navbar from "../components/Navbar";
import { useSessionContext } from "../context/SessionContext";
import Footer from "../components/Footer";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import LoadingComponent from "../components/LoadingComponent";


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
      <LoadingComponent />
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