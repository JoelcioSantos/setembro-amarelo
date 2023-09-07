const cam = document.querySelector('#video')

let lastReaction;

Promise.all([ // Retorna apenas uma promisse quando todas já estiverem resolvidas

    faceapi.nets.tinyFaceDetector.loadFromUri('/models'), // É igual uma detecção facial normal, porém menor e mais rapido
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'), // Pegar os pontos de referencia do sue rosto. Ex: olhos, boca, nariz, etc...
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'), // Vai permitir a api saber onde o rosto está localizado no video
    faceapi.nets.faceExpressionNet.loadFromUri('/models') // Vai permitir a api saber suas expressões. Ex: se esta feliz, triste, com raiva, etc...

]).then(startVideo)

async function startVideo() {
    const constraints = { video: true };

    try {
        let stream = await navigator.mediaDevices.getUserMedia(constraints);

        cam.srcObject = stream;
        cam.onloadedmetadata = e => {
            cam.play();
        }

    } catch (err) {
        console.error(err);
    }
}

cam.addEventListener('play', () => {

    const canvas = faceapi.createCanvasFromMedia(video) // Criando canvas para mostrar nossos resultador
    document.body.append(canvas) // Adicionando canvas ao body

    const displaySize = { width: cam.width, height: cam.height } // criando tamanho do display a partir das dimenssões da nossa cam

    faceapi.matchDimensions(canvas, displaySize) // Igualando as dimensões do canvas com da nossa cam

    let fgPessoa = false;

    setInterval(async () => { // Intervalo para detectar os rostos a cada 100ms
        const detections = await faceapi.detectSingleFace(
            cam, // Primeiro parametro é nossa camera
            new faceapi.TinyFaceDetectorOptions() // Qual tipo de biblioteca vamos usar para detectar os rostos
        )
            .withFaceLandmarks() // Vai desenhar os pontos de marcação no rosto
            .withFaceExpressions() // Vai determinar nossas expressões

            // if (!fgPessoa) {
                if (detections) {
                    if (!fgPessoa) {
                        fgPessoa = true;
                        const resizedDetections = faceapi.resizeResults(detections, displaySize) // Redimensionado as detecções
            
                        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height) // Apagando nosso canvas antes de desenhar outro
                
                        // faceapi.draw.drawDetections(canvas, resizedDetections) // Desenhando decções
                        // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections) // Desenhando os pontos de referencia
                        // faceapi.draw.drawFaceExpressions(canvas, resizedDetections) // Desenhando expressões
                
                        if (resizedDetections) {
                            changeTitleByExpression(resizedDetections);
                        }
                    }
                } else {
                    clearMessages();
                    fgPessoa = false;
                    lastReaction = null;
                }
            // } else {
            //     clearMessages();
            //     fgPessoa = false;
            // }

    }, 1000);

    
})

function clearMessages() {
    document.getElementById('titulo').textContent = ""
    document.getElementById('frase').textContent = ""
    document.getElementById('ajuda').textContent = ""
}

    // ['surpreso', 'feliz'];
    // ['desgosto', 'sad', 'fearful'];
    // ['neutro'];
    // ['bravo'];
async function changeTitleByExpression(resizedDetections) {

    const emocao = Object.entries(resizedDetections.expressions).reduce(function(prev, current) { 
        return prev[1] > current[1] ? prev : current; 
    });

    if (emocao[0] === 'sad' || emocao[0] === 'disgusted' || emocao[0] === 'fearful') {
        emocaoFinal = 'sad'
    } else if (emocao[0] === 'happy' || emocao[0] === 'surprised') {
        emocaoFinal = 'happy'
    } else if (emocao[0] === 'angry') {
        emocaoFinal = 'angry'
    } else {
        emocaoFinal = 'neutral'
    }

    if (lastReaction !== emocaoFinal) {
        const res = await fetch("/mensagens.json");
        const data = await res.json();

        document.getElementById('titulo').textContent = data.titulo.filter((item) => item.type === emocaoFinal)[0].msg
    
        const numeroAletorio = Math.floor(Math.random() * (data.mensagens.length - 1));
    
        document.getElementById('frase').textContent = data.mensagens[numeroAletorio]

        document.getElementById('ajuda').textContent = "Veja se isso te ajuda:"
        
    }
    
    lastReaction = emocaoFinal;
}