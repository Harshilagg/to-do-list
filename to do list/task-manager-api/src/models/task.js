const mongoose =require('mongoose')
const validator= require('validator')


const taskSchema = new mongoose.Schema({
    task:{
        type: String,
        required:true,
        trim:true
    },
    status:{
        type:Boolean,
        default: false
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        require:true,
        ref: 'User'
     }
    
},{
    timestamps: true
}) 

const Task = mongoose.model('Task', taskSchema)
module.exports = Task 