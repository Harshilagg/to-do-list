const express =require('express')
const router= new express.Router()
const User= require('../models/user')
const auth= require('../middleware/auth')
const multer= require('multer')
const sharp=require('sharp')

const upload = multer({
    limits:{
        fileSize:1000000
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match('\.(jpg|jpeg|png)$')){
            return cb(new Error('file must be an image')) 
        }
        
        cb(undefined, true)
    }
}) 

router.post('/users/signup',async (req,res)=>{ 
    const user = new User(req.body)

    try{
        await user.save()
        const token= await user.generateToken() 
        res.send({ user , token })  
    }catch(e){
        res.status(400)
        res.send(e)
    }
    
})

router.post('/users/login', async (req,res)=>{ 
    try{
        const user= await User.findByCredentials(req.body.email,req.body.password)
        const token= await user.generateToken() 
        res.send({ user , token }) 
    }catch(e){
        res.status(400).send(e)   
    }
})  

router.post('/users/logout',auth,async(req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500)
    }
})

router.post('/users/logout/all',auth,async(req,res)=>{
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500)
    }
})

router.get('/users/me',auth, async(req,res)=>{
    res.send(req.user)
})

router.get('/users',auth, async (req,res)=>{

    try{
        const users= await User.find({})
        res.send(users)
    }catch(e){ 
        res.status(500).send(e)
    } 
})

router.get('/users/:id',async (req,res)=>{
    const _id= req.params.id
    try{
        const user= await User.findById(_id)
        if(!user){
            return res.status(404).send()
        }
        res.send(user) 
    }catch(e){
        res.status(400).send(e) 
    }

})

router.patch('/users/me',auth, async (req,res)=>{
    const updates=Object.keys(req.body)
    const allowupdates=['name','email','password','age']
    const validopr=updates.every((update)=>{
        return allowupdates.includes(update)
    })
    if(!validopr){
        return res.status(400).send({error:'Invalid update'})
    }

    try{ 
        updates.forEach((update)=>{
            req.user[update]=req.body[update] 
        })
        await req.user.save()
        res.send(req.user) 
    }catch(e){
        res.status(501).send(e)
    }
}) 

router.delete('/users/me',auth, async(req,res)=>{
    try{
        await req.user.remove()
        res.send(req.user)
    }catch(e){
        res.status(501).send(e)
    }
})


router.post('/users/me/avatar',auth,upload.single('avatar'),async(req,res)=>{
    
    const buffer= await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer() 

    req.user.avatar=buffer
    await req.user.save()

    res.send('profile photo uploaded successfully')
},(error,req,res,next)=>{
    res.status(400).send({error: error.message})
}) 

router.delete('/users/me/avatar',auth,async(req,res)=>{
    req.user.avatar=undefined
    await req.user.save()
    res.send()

})

router.get('/users/:id/avatar',async(req,res)=>{
    try{
        const user= await User.findById(req.params.id)
        if(!user|| !user.avatar){
            throw new Error()
        }
        res.set('Content-Type','image/png')
        res.send(user.avatar)

    }catch(e){
        res.status(404).send()
    }
})


module.exports= router