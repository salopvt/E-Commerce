import mongoose from "mongoose";
import bcrypt from "bcryptjs"; //for hashing of password

const userSchema=new mongoose.Schema({
name:{
    type:String,
    required:[true,"Name is required"]
},

email:{
    type:String,
    required:[true, "Email is required"],
    unique:true,
    lowercase:true,
    trim:true
},
password:{
    type:String,
    minlength:[6,"Password must be at least 6 characters long"]
},

googleId: {
    type: String,
    unique: true,
    sparse: true,
  },

  avatar: {
    type: String
  },

cartItems:[
    {
      quantity:{
        type:Number,
        default:1
      } ,
      product:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Product"
      }
    }
],
role:{
    type:String,
    enum: ["customer","admin"],
    default:"customer",
},
   
},{
    //created at,updated at
    timestamps:true
});



//pre-save hook to hash password before saving to database
userSchema.pre("save",async function(next){
    if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error); // <-- ✅ handle any error that occurs during hashing
  }
})

//comapare password
userSchema.methods.comparePassword=async function (password) {
    return bcrypt.compare(password,this.password);
}

const User= mongoose.model("User",userSchema);
export default User; 