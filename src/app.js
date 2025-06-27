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
import dealerRoutes from './routes/dealerRoutes.js';
import sales from './routes/Sales&Purchase.routes.js';

// Using routes
app.use('/api/items', itemRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/sales', sales);












export default app;