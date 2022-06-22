import express from 'express';
import cors from 'cors';
import Joi from 'joi';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const authSchema = Joi.object({
    name: Joi.string().min(1).required(),
})

const client = new MongoClient(process.env.MONGO_URI);
let db;
client.connect().then(() => {
    db = client.db('bate-papoUOL');
});

const server = express();
server.use(cors());
server.use(express.json());

server.post('/participants', (req, res) => {
    
    const { error } = authSchema.validate({name : req.body.name});
    if(Joi.isError(error)){
        res.status(422);
        return;
    }else{
        //db.collection('participants').insertOne({name: req.body.name});
        db.collection('participants').findOne({name: re1.body.name}).then((p) => {
            
        })
    }
})




server.listen(5000);
