const socket = io()

const play = document.querySelector('#play')
const pause = document.querySelector('#pause')

let localstream
let peerConnection

//servidor stun publico do google
// const servers = {
// iceServers: [
//         { urls: 'stun:stun.l.google.com:19302' }
//     ]
// }

//iniciar a captura do audio e inicializa a sinalizacao para o server
play.addEventListener('click', async () => {
    
    //habilitar captura de audio
    localstream = await navigator.mediaDevices.getUserMedia({audio:true})

    // peerConnection = new RTCPeerConnection(servers)
    peerConnection = new RTCPeerConnection()

    // Adicionar o fluxo de mídia local ao peerConnection
    localstream.getTracks().forEach(track => peerConnection.addTrack(track, localstream))

    // Lidar com eventos de ICE - fica ouvindo o evento icecandidate
    peerConnection.onicecandidate = (event) => {
        if(event.candidate){
            socket.emit('candidate', event.candidate);
        }
    }

    // Criar oferta e configurá-la como descrição local
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    //enviar oferta para o back
    socket.emit('offer', offer );
})

//finalizar chamada
pause.addEventListener('click', () => {
    //fechar conexao p2p
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    //parar a captura de audio
    if (localstream) {
        localstream.getTracks().forEach(track => track.stop());
    }
})

//lidar com sinais recebidos
socket.on('offer', async (offer) => {

    if(offer){
        // peerConnection = new RTCPeerConnection(servers);
        peerConnection = new RTCPeerConnection();
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('candidate', event.candidate);
            }
        }


        peerConnection.ontrack = (event) => {
            console.log('recebeu o audio do back')
            const [remoteStream] = event.streams;
            const audio = new Audio();
            audio.srcObject = remoteStream;
            console.log('tocando o audio')
            audio.play();
        }

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        //envia o answer para o back
        socket.emit('answer', answer );

    }
})

//recebe o answer do back end
socket.on('answer', async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

//recebe o candidate do back end
socket.on('candidate', async (candidate) => {
    await peerConnection.addIceCandidate(candidate);
});