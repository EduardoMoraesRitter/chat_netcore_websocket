window.onload = function () {
	socket = null;
	nome_usuario = "Usuario";
	url_server = "localhost:80"//"169.57.153.116:8080"//"dominio.com.br"

	let head = document.getElementsByTagName('head')[0]
	let body = document.getElementsByTagName('body')[0]
	//document.querySelector('chat')

	var scriptJQ = document.createElement('script');
	scriptJQ.type = 'text/javascript';
	scriptJQ.src = "https://code.jquery.com/jquery-3.3.1.min.js";
	head.appendChild(scriptJQ);

	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = "https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.2.0/socket.io.js";
	head.appendChild(script);

	var linkfont = document.createElement('link');
	linkfont.setAttribute("rel", "stylesheet");
	linkfont.setAttribute("href", "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css");
	head.appendChild(linkfont);

	var link = document.createElement('link');
	link.setAttribute("rel", "stylesheet");
	link.setAttribute("href", "http://" + url_server + "/public/styles.css");
	head.appendChild(link);


	//TODO:voltar aqui remover o jquery
	setTimeout(function () {
		appendSDKWindow();

		var input = document.getElementById("chat_msg");
		input.addEventListener("keyup", function (event) {
			if (event.keyCode === 13) {
				event.preventDefault();
				document.getElementById("enviarMsg").click();
			}
		})
	}, 1000);
};

function openDialog() {
	document.getElementById("chatbotDialog").style.display = "block";
	createSocket();
	EnviaMsgInicio();
	$('#chat_msg').focus();
	document.getElementById("botao_chat").setAttribute( "onClick", "closeDialog();" );
	}

function closeDialog() {
	document.getElementById("chatbotDialog").style.display = "none";
	document.getElementById("botao_chat").setAttribute( "onClick", "openDialog();" );
}

function botao_texto(mensagem) {
	event.preventDefault();
	if (mensagem != "" || mensagem != undefined) {
		$('input[name=chat_msg]').val(mensagem);
		$('#enviarMsg').click()
	}
}

function appendSDKWindow() {

	$(document.body).append("<button class='botao_chat' id='botao_chat' onclick='openDialog()'> <i class='fa fa-commenting'></i> </button>");
	//$(document.body).append("<div class='botao_chat' id='botao_chat' onclick='openDialog()' style='display:none;'> <img src='https://dominio.com.br/public/images/icone.png'> </div>");
	$(document.body).append("<div class='chat-popup' id='chatbotDialog' style='display:none;'></div>");

	$('#chatbotDialog').append("<div id='titulo' class='chat_titulo'> <div id='titulo_texto'></div> <div id='divFechaChat' class='fecha_chat' onclick='closeDialog()'> <i class='material-icons'>clear</i>	</div> </div>");

	$('#chatbotDialog').append("<div id='corpo'>" +
		"<div id='div_chat_messages' class='sdk_webchatbot_message'></div>" +
		"<div class='sdk_webchatbot_controle'><div class='box'>" +

		"<input type='text' id='chat_msg' name='chat_msg' placeholder='Digite sua menssagem' class='sdk_webchatbot_text' autocomplete='off' disabled> " +

		"<div class='sdk_webchatbot_anexo'><i class='fa fa-paperclip' ></i><input type='file' id='fileUpload' class='sdk_webchatbot_anexo_input'></div>" +
		"<div class='sdk_webchatbot_envio'><i class='fa fa-paper-plane-o' ></i><input type='button' id='enviarMsg' class='sdk_webchatbot_envia_input'></div>"+

		"</div></div></div>");
}

function createSocket() {
	var chatSession = sessionStorage['chatSession'];
	if (!chatSession) {
		var key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		sessionStorage['chatSession'] = key;
		chatSession = sessionStorage['chatSession'];
	}

	if (socket == null) {
		socket = io.connect('ws://' + url_server, { transports: ['websocket'], upgrade: false, query: 'name=' + chatSession });
		
		socket.on('connect', function () {
			console.log('Connected');
		});
		socket.on('disconnect', function () {

			console.warn('Disconnected');
		});
		socket.on('connect_error', function () {
			console.error("Error Connected");
		});

		socket.on('receivedMessage', message => appendMessage(message))

		$('#fileUpload').change(function (arquivo) {

			var file = arquivo.target.files[0];
			var reader = new FileReader();
			reader.onload = (file) => {

				let fileArray = file.target.result.split(",")
				let type = fileArray[0].split("/")[0].replace("data:", "")
				let extencao = fileArray[0].split("/")[1].replace(";base64", "")
				var messageObject = {
					origin: "client",
					author: nome_usuario,
					type: type,
					extencao: extencao,
					anexo: fileArray[1],
					chatSession: chatSession
				};
				socket.emit('sendMessage', messageObject);
				$("#fileUpload").val('');
			}
			reader.readAsDataURL(file);
		});

		//$(document).on("click", "#enviarMsg", function (event) {
		$("#enviarMsg").click(function (event) {
			event.preventDefault();

			var msg = $('input[name=chat_msg]').val();
			if (msg.length == 0) {
				return;
			}
			var messageObject = {
				origin: "client",
				author: nome_usuario,
				message: msg,
				chatSession: chatSession
			};
			socket.emit('sendMessage', messageObject);
			$('input[name=chat_msg]').val("");
		});
	}
}

function EnviaMsgInicio() {
	var texto_chat = $('#div_chat_messages').text();

	if (texto_chat == "") {
		if (socket != null) {
			var chatSession = sessionStorage['chatSession'];

			var messageObject = {
				origin: "client",
				author: nome_usuario,
				message: "**oi**",
				chatSession: chatSession
			};
			socket.emit('sendMessage', messageObject);
		}
	}
}

function appendMessage(message) {

	$('#chat_typing').remove();

	if (message.message) {
		var msg = message.message.replace(new RegExp('\r?\n', 'g'), '<br>');

		var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		msg = msg.replace(exp, "<a href='$1' target='_blank'>$1</a>");

		//Nao mostrar a mensagem automatica de inicio de conversa.
		if (msg == "**oi**") {
			//Desabilitar o botao por alguns segundos, para esperar o "oi" do BOT
			setTimeout(function () {
				$('#chat_msg').prop("disabled", false);
				$('#enviarMsg').prop("disabled", false);
			}, 4500);
			return;
		}

		if (message.origin == "client")
			$('#div_chat_messages').append('<div class="message balao cliente">' + msg + '</div>');
		else if (message.origin == "bot")
			$('#div_chat_messages').append('<div class="message balao atendente">' + msg + '</div>');

	} else if (message.button) {
		var button_text = message.button.text.replace(/(?:\\[rn])+/g, "<br>");
		$('#div_chat_messages').append('<div id="div_button_text"><a href="' + message.button.url + '" class="chat_button" target="_blank" >' + button_text + '</a></div>');
	} else if (message.quick_reply) {
		var quick_reply_text = message.quick_reply.text.replace(/[\n\r]+/g, '<br>')
		var quick_reply_cmd = message.quick_reply.text.replace(/[\n\r]+/g, '')
		quick_reply_cmd = quick_reply_cmd.replace(/\s{2,10}/g, ' ');
		$('#div_chat_messages').append("<div id='div_quick_reply' ><a onClick=\"botao_texto('" + quick_reply_cmd + "')\" class='chat_button' >" + quick_reply_text + "</a></div>");
	} else if (message.image != undefined && message.image != "") {
		$('#div_chat_messages').append("<div class='sdk_webchat_image'><a href='" + message.image + "' download='image.jpg'> <img class='chat_image' src='" + message.image + "' alt='image'> </a></div>");
	} else if (message.type == "image") {

		if (message.origin == "client")
			$('#div_chat_messages').append("<div class='message balao cliente'> <img class='chat_image' src='data:image/" + message.extencao + ";base64, " + message.anexo + "' alt='image'> </div>");
		else if (message.origin == "bot")
			$('#div_chat_messages').append("<div class='message balao atendente'> <img class='chat_image' src='data:image/" + message.extencao + ";base64, " + message.anexo + "' alt='image'> </div>");

	} else if (message.typing == "typing") {
		$('#div_chat_messages').append('<div id="chat_typing" ><img class="chat_typing" src="http://' + url_server + '/public/images/typing.gif" alt=image22"></div>');
	}
	var elem = document.getElementById('div_chat_messages');
	elem.scrollTop = elem.scrollHeight;

}