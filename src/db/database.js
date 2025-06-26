import mongoose from "mongoose";


let databaseconnection = async () => {
    try {
        await mongoose.connect(`mongodb+srv://sayanm085:gvmtil3vRUxN35rR@shotlinx.dux7hje.mongodb.net/Erp-database`)
        .then(() => { console.log("Database connected") })
        .catch((err) => 
        { console.log(err) });
    } catch (err) {
        console.log(err);
    }
};


export default databaseconnection;