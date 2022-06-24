import express from 'express';
import cors from 'cors';
import Joi from 'joi';
import dayjs from 'dayjs';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();


const server = express();
server.use(cors());
server.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);
let db;
client.connect().then(() => {
    db = client.db('bate-papoUOL');
});


server.post('/participants', (request, response) => {
    
    //critério de validação do nome
    const nameAuth = Joi.object({
        name: Joi.string().min(1).required()
    });
    
    //valida nome pelo JOI
    const { error } = nameAuth.validate({name : request.body.name});

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
                db.collection('participants').insertOne({name: request.body.name, lastStatus: Date.now()});             
                
                //salva mensagem 'entra na sala'
                const currentTime = returnCurrentTime();          
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
});

server.get('/participants', async(request, response) => {     
    const participants = await db.collection('participants').find().toArray();
    response.send(participants);
});

server.post('/messages', (request, response) => {
    
    //critério de validação de mensagem
    const messageAuth = Joi.object({
        to: Joi.string().min(1).required(),
        text: Joi.string().min(1).required(),
        type: Joi.string().valid('message', 'private_message'),
        from: Joi.string().valid(db.collection('participants').find()),
    });
    
    //captura infos da request
    const { to, text, type } = request.body;
    const from = request.headers.user;

    //verifica erro na mensagem
    const { errorMessage } = messageAuth.validate({ to: to, text: text, type: type, from: from });
    if(Joi.isError(errorMessage)){
        response.status(422).send();
    }else{
        db.collection('messages').insertOne({from, to, text, type, time: returnCurrentTime()});
        response.status(201).send();
    }
});

server.get('/messages', async (request, response) => {
    
    const user = request.headers.user;
    let limit = request.query.limit;
    let messages = await db.collection('messages').find().toArray();
    
    if(typeof limit === 'undefined'){
        response.send(messages);
    }else{
        limit = parseInt(limit)  
        
        messages = messages.filter((m, index) => index >= messages.length-limit);
        messages = messages.filter((m) => m.type === 'message' || m.from === user || m.to === user || m.to === 'Todos');

        response.send(messages);
    }
});

server.post('/status', async (request, response) => {
    const user = await db.collection('participants').find({ name: request.headers.user}).toArray();
    
    if(user.length === 0){
        response.status(404).send();
    }else{
        await db.collection('participants').updateOne({
            name: request.headers.user
        }, { $set: {lastStatus: Date.now()}});
        response.status(200).send();
    }
});




function returnCurrentTime(){
    return dayjs().format('hh:mm:ss');
}

server.listen(5000);
