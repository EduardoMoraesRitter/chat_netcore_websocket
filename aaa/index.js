express = require('express');
cors = require('cors');
app = express();
request = require('request');
fs = require('file-system');
async = require("async");
moment = require('moment');
https = require('https');
http = require('http');
Promise = require("bluebird");
const bodyParser = require('body-parser');
require('dotenv').config();

require('./controller/mongooseController');
serverController = require('./controller/serverController');
userController = require('./controller/userController');
transbordoController = require('./controller/transbordoController');
nlpController = require('./controller/nlpController');
historicoController  = require('./controller/historicoController');

apiController = require("./api/apiController");


app.enable('trust proxy');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//QUANDO API DE TERCEIRO NAO TEM HTTPS CONFIGURADO CORRETAMENTE, E PRECISA IGNORAR
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

if (process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'homolog') {    
    var options = {        
        pfx: fs.readFileSync('./certificate/certificado.pfx')
    };
    connected = https.createServer(options, app).listen(process.env.PORT, startRoutes);
} else {
    connected = app.listen(process.env.PORT, startRoutes);
}

function startRoutes() {
    console.log("SERVIDO LIGADO EM", process.env.NODE_ENV, " PORTA ", process.env.PORT);

    router = express.Router();
    require("./routes/telegramRoutes");
    require("./routes/whatsappRoutes");
    require("./routes/webchatRoutes");
    require("./routes/facebookRoutes");    
    require("./routes/dashboardRoutes");

    //require("./routes/clientRoutes");

    //Colocar o diretorio das imagens das carteirinhas como publico para ser acessado pelo bot.
    // app.use('/.well-known/pki-validation', express.static(
    //     "C:/Framework/Webhook/hhh"
    //     //__dirname+"/hhh"
    // ));
    // app.use('/aaa', (req, res)=>{
    //     res.send("aaaa " + __dirname)
    // });    
    app.use('/', router);
}

//testear httpProxy
// var httpProxy = require('http-proxy');

// var proxy = httpProxy.createServer({
//   target: {
//     host: 'github.com',
//     port: 443,
//     https: true
//   }
// }).listen(8080);

// router.get('/dash', (req, res) => {
//     request("https://app.powerbi.com/reportEmbed?reportId=6d4c732e-03c8-4363-af27-80a44c88698f&autoAuth=true&ctid=9507fc1f-4bd4-4056-9c47-cdbad1db3245", function (error, response, body) {
//         if (!error && response.statusCode == 200) {
//             res.redirect(JSON.stringify(body))
//         }
//     });
//     //res.redirect("https://app.powerbi.com/reportEmbed?reportId=6d4c732e-03c8-4363-af27-80a44c88698f&autoAuth=true&ctid=9507fc1f-4bd4-4056-9c47-cdbad1db3245");
// }) 
