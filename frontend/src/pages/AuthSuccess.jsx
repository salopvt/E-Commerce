import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      localStorage.setItem("token", token);
      navigate("/"); // ✅ Redirect to home or dashboard
    } else {
      navigate("/login");
    }
  }, []);

  return <p className="text-center text-white mt-10">Logging you in via Google...</p>;
};

export default AuthSuccess;

