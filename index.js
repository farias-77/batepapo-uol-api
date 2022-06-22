import express from 'express';
import cors from 'cors';
import Joi from 'joi';
import dayjs from 'dayjs';
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

server.post('/participants', (request, response) => {
    
    //valida nome pelo JOI
    const { error } = authSchema.validate({name : request.body.name});

    //validate retorna erro caso o nome esteja vazio
    if(Joi.isError(error)){
        response.status(422).send('O nome não pode ficar em branco');
        return;
    
    }else{
        //busca nome inserido na coleção de participantes (retorna objeto com o nome ou null)
        db.collection('participants').findOne({name: request.body.name}).then((p) => {

            //se o retorno for um objeto com o nome 
            if(p){
                response.status(409).send('este nome já está sendo utilizado');
            
            //se o retorno for null
            }else{
                //salva participante no mongodb
                db.collection('participants').insertOne({name: request.body.name});             
                
                //salva mensagem 'entra na sala'
                const currentTime = dayjs().format('HH:MM:ss');
                
                 db.collection('messages').insertOne({
                     from: request.body.name,
                     to: 'Todos',
                     text: 'entra na sala...',
                     type: 'status',
                     time: currentTime
                });
                           
                response.status(201).send('participante inserido');                          
            }
        })
    }
})

server.get('/participants', (request, response) => {     
   
    db.collection("participants").find().toArray().then(p => {
		response.send(p); 
	});
});





server.listen(5000);
