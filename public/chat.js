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

// Sonido estilo "Pop / Campana retro" más fuerte y con cuerpo
function reproducirSonido() {
    try {
        var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        var osc1 = audioCtx.createOscillator();
        var osc2 = audioCtx.createOscillator();
        var gainNode = audioCtx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sine';

        // Frecuencias ascendentes estilo videojuego/burbuja
        osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // Do
        osc1.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.12); // La

        osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // Mi
        osc2.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.12); // Do agudo

        // Volumen alto y caída suave
        gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.28);
        osc2.stop(audioCtx.currentTime + 0.28);
    } catch (e) { }
}

archivoInput.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (evt) {
        adjuntoData = {
            nombre: file.name,
            tipo: file.type || file.name.split('.').pop(),
            data: evt.target.result
        };
        nombreArchivo.innerHTML = "📎 Listo para enviar: <strong>" + file.name + "</strong>";
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
        var tipo = data.archivo.tipo.toLowerCase();
        var ext = data.archivo.nombre.split('.').pop().toLowerCase();

        // Imagen
        if (tipo.startsWith('image/')) {
            contenidoArchivo = '<br><img class="img-adjunta" src="' + data.archivo.data + '">';
        }
        // Audio (reproductor integrado para m4a, mp3, ogg, wav)
        else if (tipo.startsWith('audio/') || ['m4a', 'mp3', 'ogg', 'wav'].includes(ext)) {
            contenidoArchivo = '<br><audio controls style="margin-top:8px; max-width: 100%;"><source src="' + data.archivo.data + '">Tu navegador no soporta el reproductor de audio.</audio><br><small>' + data.archivo.nombre + '</small>';
        }
        // Video (reproductor integrado para mp4, webm, mov)
        else if (tipo.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext)) {
            contenidoArchivo = '<br><video controls style="margin-top:8px; max-width: 280px; border-radius: 6px;"><source src="' + data.archivo.data + '"></video>';
        }
        // PDF (visor incrustado y botón de lectura)
        else if (tipo.includes('pdf') || ext === 'pdf') {
            contenidoArchivo = '<br><iframe src="' + data.archivo.data + '" style="width: 100%; height: 250px; border: 1px solid #ccc; margin-top: 8px; border-radius: 4px;"></iframe><br><a class="link-adjunto" href="' + data.archivo.data + '" target="_blank">📄 Abrir ' + data.archivo.nombre + ' en pantalla completa</a>';
        }
        // Otros documentos
        else {
            contenidoArchivo = '<br><a class="link-adjunto" href="' + data.archivo.data + '" download="' + data.archivo.nombre + '" target="_blank">📎 Descargar / Abrir ' + data.archivo.nombre + '</a>';
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