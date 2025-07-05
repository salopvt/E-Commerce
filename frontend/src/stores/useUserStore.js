import {create} from "zustand";
import axios from "../lib/axios";
import {toast} from "react-hot-toast";

export const useUserStore=create((set)=>({
  user:null,
  loading:false,
  checkingAuth:true,
  signup:async({name,email,password,confirmPassword})=>{
    set({loading:true});
    if(password!=confirmPassword){
        set({loading:false});
       return toast.error("Passwords do not match");
    }
    try {
        const res=await axios.post("/auth/signup",{name,email,password});
        set({user:res.data.user,loading:false});
    } catch (error) {
        set({loading:false});
        const message = error.response?.data?.message || error.message || "An error occurred";
        toast.error(message);
    }
  },
  login: async ({email, password, navigate}) => {
    set({loading:true});
    console.log("login called", email, password);
    try {
    const res = await axios.post("/auth/login", {email, password},{ withCredentials: true});
      set({user:res.data.user,loading:false});
      toast.success("Login successful");
      if(navigate) navigate("/");
    } catch (error) {
      set({loading:false});
      const message = error.response?.data?.message || error.message || "An error occurred";
      toast.error(message);
    }
  },
  logout: async () => {
		try {
			await axios.post("/auth/logout", {}, {
      withCredentials: true
     });
 
			set({ user: null });
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred during logout");
		}
	},
  checkAuth: async () => {
		set({ checkingAuth: true });
		try {
			const response = await axios.get("/auth/profile", {
  withCredentials: true
});

			set({ user: response.data, checkingAuth: false });
		} catch (error) {
			console.log(error.message);
			set({ checkingAuth: false, user: null });
		}
	},
}))

let refreshPromise = null;

axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// If a refresh is already in progress, wait for it to complete
				if (refreshPromise) {
					await refreshPromise;
					return axios(originalRequest);
				}

				// Start a new refresh process
				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

				return axios(originalRequest);
			} catch (refreshError) {
				// If refresh fails, redirect to login or handle as needed
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);