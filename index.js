import app from "./src/app.js";
import databaseconnection from "./src/db/database.js";


databaseconnection()
.then(() => {
    app.listen(8080, () => {
        console.log(`Server is running on http://localhost:8080 `);
    });
})
.catch((error) => {
    console.log("error in db connection" , error);
    process.exit(1);
});