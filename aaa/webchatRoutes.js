
const webchatIn = require("../canais/webchatIn");
const webchatOut = require("../canais/webchatOut");

router.post('/webchat',
    webchatIn.recebe,
    serverController.pegaConfig,
    userController.consultaContexto,
    //transbordoController.verificacao,
    nlpController.query,
    nlpController.action,
    userController.atualizaContexto,
    webchatOut.envia,
    (req, res) => {
        res.send();
    }
);

app.use(express.static(__dirname + '/public'));

//let messages = [];
connections = [];

var permissionList = ['http://www.dominio.com.br']
function corsOptionsDelegate(req, callback) {
    req.corsOptions = {}
    //errado o headers
    if (req.headers.referer && permissionList.indexOf(req.headers.referer) !== -1 || true) {
        req.corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
        callback(null, req.corsOptions) // callback expects two parameters: error and options
    } else {
        req.corsOptions = { origin: false } // disable CORS for this request
        console.log("NAO AUTORIZADO", req.headers)
        callback(null, req.corsOptions)
    }
}

router.get('/sdkwebchat', cors(corsOptionsDelegate),
    (req, res) => {
        if (req.corsOptions.origin == true || true) {
            res.sendFile(__dirname + '/public/javascript.js')
        } else {
            res.status(404);
            res.send();
        }
    })

app.use('/public', express.static(__dirname + '/public'));

router.get('/site', (req, res) => {
    res.sendFile(__dirname + '/public/site.html')
})

router.post('/webchatSendAnswer/', (req, res) => {
    res.send();

    //messages.push(req.body);

    //Gera um JSON com apenas as informações importantes de serem enviadas. (nao pode enviar IP, IDs etc...)
    //TODO:voltar aqui erro no sockt
    //var content = createContent(req.body);

    // var socketId = connections.filter(a => {
    //     if(a.socketId)
    //     a.chatSession = req.body.userID
    // })[0].socketId;

    //var socketId = connections.filter(a => a.chatSession = req.body.userID)[0].socketId;

    connections.forEach(a => {
        if (a.chatSession == req.body.userID) {
            io.to(a.socketId).emit("receivedMessage", req.body);
        }
    })
}
);

io = require('socket.io').listen(connected);

//Limita qual url pode acessar o serviço
io.origins((origin, callback) => {
    if (permissionList.indexOf(origin) !== -1 || true) {
        callback(null, true)
    } else {
        console.log('Socket conectado: ', origin);
        callback('not authorized', false)
    }
})

//Conecta no Socket.IO
io.on('connection', socket => {

    console.log("Socket conectado - ", socket.id);

    var cookie = socket.handshake.query['name'];
    if (cookie != undefined) {
        //TODO:voltar aqui melhorar esssa logica, se alguem conectar no mesmo PC eu desconecto um das sessos
        // if (connections.length>0 && connections.filter(x => x.chatSession == cookie)) {
        //     for (let index = 0; index < connections.length; index++) {
        //         if (connections.filter(x => x.chatSession == cookie)) {
        //             connections[index].chatSession = cookie
        //         }
        //     }
        // } else {
        //     connections.unshift({
        //         socketId: socket.id,
        //         chatSession: cookie
        //     })
        // }


        connections.unshift({
            socketId: socket.id,
            chatSession: cookie
        })

    }

    //var socketList = io.sockets.server.io.clients;

    //Quando uma mensagem for enviada pelo cliente
    socket.on('sendMessage', data => {

        //Salvando o chatSession gerado automaticamente para buscar mensagens  antigas. (Apenas enquanto a session estiver ativa no browser)
        data.socketID = socket.id;
        data.serverID = process.env.WEBCHAT_ID

        //messages.push(data);

        //Manda para o socket
        socket.emit('receivedMessage', data);

        // //webchatController.sendToClient(data, socket.id)

        //TODO: voltar aqui
        /*
        io.use(function(socket, next) {
            // execute some code
            next();
            })
        */
        const objRequest = {
            url: "http://localhost:80/webchat",
            method: 'POST',
            json: true,
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: data
        }
        request(objRequest,
            (error, response) => {
                if (error) {
                    console.error("ERRO - callAPIApplication ", error)
                } else if (response.statusCode != 200) {
                    console.warn("warning - callAPIApplication ", response.body)
                } else {
                    console.log("sucesso")
                }
            })
    });

    socket.on('disconnect', data => {
        connections.forEach(function (item, index, object) {
            if (item.socketId === socket.id) {
                object.splice(index, 1);
            }
        });

        console.log(`Socket DESCONECTADO: ${socket.id}, ${io.engine.clientsCount} sockets connected`);
    });

    socket.on('returnPreviousMessages', data => {
        messages_filter = messages.filter(item => item.chatsession == data);
        socket.emit('previousMessages', messages_filter)
    });

});

// function createContent(body) {
//     var content = {};

//     if (body.image) {
//         content = {
//             image: body.image
//         }
//     }
//     else if (body.message) {
//         content = {
//             message: body.message
//         }
//     }
//     else if (body.button) {
//         content = {
//             button: body.button
//         }
//     }
//     else if (body.quick_reply) {
//         content = {
//             quick_reply: body.quick_reply
//         }
//     }

//     content.author = body.author;
//     content.origin = body.origin;
//     return content;
// }

