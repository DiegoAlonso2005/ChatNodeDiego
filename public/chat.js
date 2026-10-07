var socket = io();

var persona = document.getElementById('persona'),
    appChat = document.getElementById('app-chat'),
    panelBienvenida = document.getElementById('panel-bienvenida'),
    usuario = document.getElementById('usuario'),
    mensaje = document.getElementById('mensaje'),
    botonEnviar = document.getElementById('enviar'),
    escribiendoMensaje = document.getElementById('escribiendo-mensaje'),
    output = document.getElementById('output'),
    archivoInput = document.getElementById('archivo'),
    nombreArchivo = document.getElementById('nombre-archivo');

var adjuntoData = null;

// Sonido nativo al enviar y recibir mensajes
function reproducirSonido() {
    try {
        var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) { }
}

archivoInput.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (evt) {
        adjuntoData = {
            nombre: file.name,
            tipo: file.type,
            data: evt.target.result
        };
        nombreArchivo.innerHTML = "Archivo: " + file.name;
    };
    reader.readAsDataURL(file);
});

function ingresarAlChat() {
    if (persona.value.trim() !== "") {
        panelBienvenida.style.display = "none";
        appChat.style.display = "block";
        usuario.value = persona.value;
    }
}

function enviarMensaje() {
    if (mensaje.value.trim() !== "" || adjuntoData) {
        socket.emit('chat', {
            mensaje: mensaje.value,
            usuario: usuario.value,
            archivo: adjuntoData
        });
        mensaje.value = '';
        adjuntoData = null;
        archivoInput.value = '';
        nombreArchivo.innerHTML = '';
    }
}

botonEnviar.addEventListener('click', enviarMensaje);

mensaje.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') enviarMensaje();
});

mensaje.addEventListener('keyup', function () {
    if (persona.value) {
        socket.emit('typing', {
            nombre: usuario.value,
            texto: mensaje.value
        });
    }
});

socket.on('chat', function (data) {
    escribiendoMensaje.innerHTML = '';
    reproducirSonido();

    var contenidoArchivo = '';
    if (data.archivo) {
        if (data.archivo.tipo.startsWith('image/')) {
            contenidoArchivo = '<br><img class="img-adjunta" src="' + data.archivo.data + '">';
        } else {
            contenidoArchivo = '<br><a class="link-adjunto" href="' + data.archivo.data + '" download="' + data.archivo.nombre + '">Descargar ' + data.archivo.nombre + '</a>';
        }
    }

    output.innerHTML += '<p><strong>' + data.usuario + ':</strong> ' + data.mensaje + contenidoArchivo + '</p>';
    document.getElementById('ventana-mensajes').scrollTop = document.getElementById('ventana-mensajes').scrollHeight;
});

socket.on('typing', function (data) {
    if (data.texto) {
        escribiendoMensaje.innerHTML = '<p><em>' + data.nombre + ' está escribiendo un mensaje...</em></p>';
    } else {
        escribiendoMensaje.innerHTML = '';
    }
});