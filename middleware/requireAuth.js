const jwt = require('jsonwebtoken')
const User = require('../models/userModel.js')


const requireAuth = async (req,res, next) =>{

    const {authorization} = req.headers
    if(!authorization)
    {
        return res.status(401).json({error:"Authorization Token Required"})
    }

    //get the token out of the header
    const token = authorization.split(" ")[1]

    try{
        
        const {id} = jwt.verify(token,process.env.JWT_String)

        const user = await User.findOne({_id:id})

        if(!user){
            throw Error("Invalid User Token")
        }

        if (user.banned){
            throw Error ("User Token Has Been Banned")
        }

        next()
    }catch(error)
    {   
        res.status(400).json({error:error.message})
    }

}

module.exports = requireAuth