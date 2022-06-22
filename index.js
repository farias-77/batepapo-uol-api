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
    
    //valida nome pelo JOI
    const { error } = authSchema.validate({name : req.body.name});

    //validate retorna erro caso o nome esteja vazio
    if(Joi.isError(error)){
        res.status(422).send('O nome não pode ficar em branco');
        return;
    
    }else{
        //busca nome inserido na coleção de participantes (retorna objeto com o nome ou null)
        db.collection('participants').findOne({name: req.body.name}).then((p) => {

            //se o retorno for um objeto com o nome 
            if(p){
                res.status(409).send('este nome já está sendo utilizado');
            
            //se o retorno for null
            }else{
                db.collection('participants').insertOne({name: req.body.name});         //insere participante
                res.status(201).send("participante inserido");                          
            }
        })
    }
})

server.get('/participants', (req, res) => {
    db.collection("participants").find().toArray().then(p => {
		res.send(p); 
	});
});





server.listen(5000);
