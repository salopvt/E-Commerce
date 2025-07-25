import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateTokens= (userId) =>{
    const accessToken = jwt.sign({userId},process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:"15m" ,
    })
    const refreshToken = jwt.sign({userId},process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:"7d" ,
    })

    return { accessToken, refreshToken};
};

const setCookies=(res, accessToken , refreshToken) =>{
    res.cookie("accessToken",accessToken,{
        httpOnly: true, //prevent XSS attacks, cross site scripting attack
        secure:process.env.NODE_ENV === "production",
        sameSite:"strict", //prevents CSRF attack, cross-site request forgery attack
        maxAge: 15*60*1000, //15 minutes
    });
    res.cookie("refreshToken",refreshToken,{
        httpOnly: true, //prevent XSS attacks
        secure:process.env.NODE_ENV === "production",
        sameSite:"strict",
        maxAge: 7*24*3600*1000,
    });
    
}

// export const signup =async(req,res) =>{
//     const {email,password,name}=req.body;
//     try{
//     const userExists= await User.findOne({ email });
    
//     if(userExists){
//         return res.status(400).json({message:"User already exists"});        
//     }
//     const user= await User.create({name,email,password});
//     //authenticate user

//     const {accessToken ,refreshToken}= generateTokens(user._id);
//     // await storeRefreshToken(user._id,refreshToken);

//     setCookies(res,accessToken,refreshToken);

//     res.status(201).json({ 
//         user: {
//             _id: user._id,
//             name: user.name,
//             email: user.email,
//             role: user.role,
//         }
//     });
// } catch(error){
//     console.log("Error in signup controller", error.message);
//     res.status(500).json({message: error.message});
// }
// };

export const signup = async (req, res) => {
  try {
    console.log("Received body:", req.body);

    let { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Missing fields" });
    }

    email = email.trim().toLowerCase();

    const userExists = await User.findOne({ email });
    console.log("Checking email:", email);
    console.log("User found:", userExists);

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    const { accessToken, refreshToken } = generateTokens(user._id);
    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const login=async(req,res)=>{
   try{
    const{email,password} =req.body //user will enter this credentials
    const user= await User.findOne({email}) //find this in the database

    if(user && (await user.comparePassword(password))){
        const {accessToken,refreshToken}=generateTokens(user._id)

        // await storeRefreshToken(user._id,refreshToken)
        setCookies(res,accessToken,refreshToken)

        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } else{
        res.status(401).json({message:"Invalid email or password"});
    }
   } catch(error) {
    console.log("Error in login controller", error.message); // to easliy debug

   }
};

export const logout=async(req,res) =>{
   try{
    const refreshToken = req.cookies.refreshToken;
    if(refreshToken){
        const decoded=jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
        // await redis.del(`refresh_token:${decoded.userId}`)
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({message:"Logged out sucessfully"})
   } catch(error){
    console.log("Error in logout controller", error.message);
    res.status(500).json({message:"Server error",error: error.message});
   }
};

//to recreate access token
export const refreshToken =async(req,res) =>{
    try{
        const refreshToken= req.cookies.refreshToken;

        if(!refreshToken){
             return res.status(401).json({message:"No refresh token provided"});
        }

        const decoded =jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
        // const storedToken= await redis.get(`refresh_token:${decoded.userId}`);

        // if(storedToken!= refreshToken){
        //     return res.status(401).json({message: "Invalid refresh token"});
        // }
        console.log("here")
        const accessToken =jwt.sign({userId:decoded.userId},process.env.ACCESS_TOKEN_SECRET,{ expiresIn:"15m"});

        res.cookie("accessToken",accessToken,{
            httpOnly: true, //prevent XSS attacks, cross site scripting attack
            secure:process.env.NODE_ENV === "production",
            sameSite:"strict", //prevents CSRF attack, cross-site request forgery attack
            maxAge: 15*60*1000, //15 minutes
        });

        res.json({ accessToken, message: "Token refreshed successfully" });
        
    }

     catch(error) {
        console.log("Error in refreshToken controller" , error.message);
        res.status(500).json({message:"Server error",error: error.message});
    }
};

export const getProfile=async(req,res)=>{
    try {
        res.json(req.user);
    } catch (error) {
        res.error(500).json({message:"Server error",error:error.message});
    }
}