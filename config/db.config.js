const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function main() {
    await mongoose.connect(MONGO_URI);
    console.log('Debug: Connect to mongodb succesfully');
}

main().catch((err) => console.log(err));
