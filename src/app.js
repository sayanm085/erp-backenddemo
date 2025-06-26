import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors());



app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.get('/', (req, res) => {
    res.send("Hello World");
}
);


// Importing routes     
import itemRoutes from './routes/Items.routes.js';
import searchRoutes from "./routes/search.routes.js";

// Using routes
app.use('/api/items', itemRoutes);
app.use('/api/search', searchRoutes);












export default app;