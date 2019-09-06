
function Watson() { }

let tokenWatson = {
    token: "",
    expirationDate: ""
}

Watson.prototype.detectIntent = function (req, res) {
    return new Promise(function (resolve, reject) {
        var message = req.objRequest.message
        var user = req.objRequest
        var workspaceID = req.objRequest.server.nlp.watson.workspace
        var nlpURL = req.objRequest.server.nlp.watson.url
        var apikey = req.objRequest.server.nlp.watson.apikey
        token(apikey)
            .then(function (retorno) {
                let _body = {
                    input: { text: message },
                    alternate_intents: true
                }
                if (user.context) {
                    _body.context = user.context
                }
                const objRequest = {
                    url: nlpURL + workspaceID + '/message?version=2018-09-20&nodes_visited_details=true',
                    method: 'POST',
                    json: true,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Authorization': 'Bearer ' + tokenWatson.token
                    },
                    body: _body
                }
                request(objRequest, (error, response) => {
                    if (error) {
                        console.error("ERRO - Watson.prototype.detectIntent", error)
                        reject(error);
                    } else if (response.statusCode != 200 || (response.body.output && response.body.output.error)) {
                        console.warn("warning - Watson.prototype.detectIntent", response.body)
                        reject(response.body);
                    } else {
                        //TODO: voltar aqui
                        var title = response.body.output.nodes_visited_details ? response.body.output.nodes_visited_details[0].title : ""
                        //salva no contexto de para proxima volta
                        response.body.context.from = title
                        resolve({
                            actions: response.body.actions,
                            from: user.context.from ? user.context.from : "",
                            to: title,
                            intent: response.body.intents.length > 0 ? response.body.intents[0].intent : "",
                            entity: response.body.entities.length > 0 ? response.body.entities : "",
                            messages: FormatTextMessage(response.body),
                            contexts: response.body.context
                        })
                    }
                });
            })
    });
}

Watson.prototype.eventContext = function (req, res) {
    return new Promise(function (resolve, reject) {
        console.log("WATSON eventContext")
        var user = req.objRequest
        var workspaceID = req.objRequest.server.nlp.watson.workspace
        var nlpURL = req.objRequest.server.nlp.watson.url
        var apikey = req.objRequest.server.nlp.watson.apikey
        token(apikey)
            .then(function (retorno) {
                let _body = {
                    input: { text: " " },
                    context: user.context,
                    alternate_intents: true
                }
                const objRequest = {
                    url: nlpURL + workspaceID + '/message?version=2018-09-20&nodes_visited_details=true',
                    method: 'POST',
                    json: true,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Authorization': 'Bearer ' + tokenWatson.token
                    },
                    body: _body
                }
                request(objRequest, (error, response) => {
                    if (error) {
                        console.error("ERRO ", error)
                        reject(error);
                    } else if (response.statusCode != 200 || (response.body.output && response.body.output.error)) {
                        console.warn("warning ", response.body)
                        reject(response.body);
                    } else {
                        //TODO: voltar aqui
                        var title = response.body.output.nodes_visited_details ? response.body.output.nodes_visited_details[0].title : ""
                        //salva no contexto de para proxima volta
                        response.body.context.from = title
                        resolve({
                            from: user.context.from,
                            to: title,
                            intent: response.body.intents.length > 0 ? response.body.intents[0].intent : "",
                            entity: response.body.entities.length > 0 ? response.body.entities : "",
                            messages: FormatTextMessage(response.body),
                            contexts: response.body.context
                        })
                    }
                });
            })
    });
}

function token(apikey) {
    return new Promise(function (resolve, reject) {
        if (tokenWatson.token == "" || tokenWatson.expirationDate == "" || moment().unix() >= tokenWatson.expirationDate) {

            const objRequest = {
                url: 'https://iam.bluemix.net/identity/token',
                method: 'POST',
                json: true,
                headers: {
                    "Content-Type": "x-www-form-urlencoded"
                },
                form: {
                    "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                    "apikey": apikey
                }
            }
            request(objRequest, (error, response) => {
                if (error) {
                    console.error("token - ", error)
                    reject(error);
                } else if (response.statusCode != 200) {
                    console.warn("token - ", response.body)
                    reject(response.body);
                } else {
                    tokenWatson.token = response.body.access_token;
                    tokenWatson.expirationDate = response.body.expiration;
                    resolve()
                }
            });

        } else {
            resolve();
        }

    });
};

function FormatTextMessage(retorno) {
    //console.log("FormatTextMessage")
    var messages = retorno.output.generic;
    var newMessages = [];

    //Tratamento só de generic
    messages.forEach(function (item, index) {

        if (item == undefined) {
            return;
        } else if (item.text == "{}") {
            return;
        } else if (item.text) {
            new_item = {
                "text": item.text.trim()
            }
            newMessages.push(new_item);
        } else {
            newMessages.push(item);
        }
    })

    //Trata os outros tipos
    if (retorno.output && retorno.output.messages)
        newMessages = newMessages.concat(retorno.output.messages);

    return newMessages;
}

module.exports = new Watson();