import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore"; // adjust path if needed

const AuthSuccess = () => {
  const navigate = useNavigate();
  const { checkAuth } = useUserStore(); // ✅ Get auth checker from store

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      localStorage.setItem("token", token);
      checkAuth(); // ✅ Refresh user state after setting token
      navigate("/"); // Redirect to homepage or dashboard
    } else {
      navigate("/login");
    }
  }, []);

  return <p className="text-center text-white mt-10">Logging you in via Google...</p>;
};

export default AuthSuccess;

