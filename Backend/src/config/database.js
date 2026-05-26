// mongoose connects express server with mongodb
const mongoose = require("mongoose");


// creating a function 
async function connectToDB(){
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");
        return mongoose.connection;
    }catch(error){
        console.log("Database connection failed:", error.message);
        throw error;
    }
}

module.exports = connectToDB;
