const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const tokenBlacklistModel = require("../models/blacklist.model")

// we need the jsonwebtoken from a website 
const jwt = require("jsonwebtoken")

// jsDoc comments
/**
 * @name registerUserController 
 * @description Register a new user, expects username, email and password in the required
 * @access Public
 */

async function registerUserController(req, res){
    const { username, email, password } = req.body

    if(!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please provide username, email and password"
        })
    }

    const isUserAlreadyRegistered = await userModel.findOne({
        $or: [{username}, {email}]      // search the user on the basis of username or email
        // either will work
    })

    if(isUserAlreadyRegistered){

        /* isUserAlreadyExists.username == username*/
        return res.status(400).json({
            message: "Account already exists with this email address or username"
        })
    }

    // we will hash the password
    const hash = await bcrypt.hash(password, 10)

    const user = await userModel.create({
        username,
        email,
        password: hash
    })

    const token = jwt.sign(
        {
            id: user._id,
            username: user.username
        },
        process.env.JWT_SECRET,
        {expiresIn: "1d"}
    )

    res.cookie("token", token)

    res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

/**
 * @name loginUsercontroller
 * @description login a user, expects email and password in the request body
 * @access Public
 */

async function loginUserController(req, res){
    const {email, password} = req.body

    const user = await userModel.findOne({email})

    if(!user){
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid){
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const token = jwt.sign(
        {
            id: user._id,
            username: user.username
        },
        process.env.JWT_SECRET,
        {expiresIn: "1d"}
    )

    res.cookie("token", token)
    res.status(200).json({
        message: "User logged in successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */

async function logoutUserController(req, res) {
    const token = req.cookies?.token

    if(token){
        await tokenBlacklistModel.create({token})
    }

    res.clearCookie("token")

    res.status(200).json({
        message : "user logged out successfully"
    })
}

/**
 * @name getMeController
 * @description get the current logged in user detail
 * @access private
 */

async function getMeController (req, res) {
    const user = await userModel.findById(req.user.id)
    res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}
module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}
