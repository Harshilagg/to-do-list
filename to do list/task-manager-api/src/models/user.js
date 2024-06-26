const mongoose =require('mongoose')
const validator= require('validator')
const bcrypt= require('bcryptjs')
const jwt= require('jsonwebtoken')
const Task = require('./task')
require('dotenv').config()

const userSchema = new mongoose.Schema({ 
    name: {
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        unique:true, 
        required: true,
        trim:true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Invalid Email')
            }
        }
    },
    password:{
        type: String,
        required:true,
        trim:true,
        validate(value){
            if(value.length<6){
                throw new Error('password too short')
            }
            if(value.includes("password")){
                throw new Error('password too weak')
            }
        }
    },
    tokens:[{
        token : {
            type:String,
            required:true
        }
    }],
    avatar:{
        type:Buffer
    }
    
},{
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: 'Task', 
    localField:'_id',
    foreignField:'owner'
})

userSchema.methods.toJSON = function () {
    const user= this
    const userData=user.toObject()

    delete userData.password
    delete userData.tokens 
    delete userData.avatar
    return userData
}

userSchema.methods.generateToken = async function(){
    const user= this
    const token=jwt.sign({ _id:user._id.toString() }, process.env.JWT_SECRET) 
    user.tokens= user.tokens.concat({ token }) 
    await user.save()

    return token 
} 

userSchema.statics.findByCredentials= async (email,password)=>{
    const user= await User.findOne({email})
    if(!user){
        throw new Error('Unable to login')
    }

    const match = await bcrypt.compare(password,user.password)
    if(!match){
        throw new Error('Unable to login')
    }
    return user
}

userSchema.pre('save',async function(next){
    const user =this

    if(user.isModified('password')){
        user.password=await bcrypt.hash(user.password,8) 
    } 

    next()
}) 
userSchema.pre('remove',async function(next){
    const user=this
    await Task.deleteMany({ owner:user._id })
    next()
})
const User = mongoose.model('users', userSchema)

module.exports= User 