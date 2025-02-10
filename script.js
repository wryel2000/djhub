// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, serverTimestamp, onSnapshot, query, orderBy, addDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

// Configuração do Firebase com suas credenciais
const firebaseConfig = {
  apiKey: "AIzaSyAB7-bISq2XHqTu2VTGtsihD9RDg21Z4tU",
  authDomain: "djhubbing.firebaseapp.com",
  projectId: "djhubbing",
  storageBucket: "djhubbing.firebasestorage.app",
  messagingSenderId: "713077795174",
  appId: "1:713077795174:web:4721fa2513decb9c83c0a7",
  measurementId: "G-VCSTRFC25K"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Elementos do chat
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');

// Função para adicionar mensagem ao chat
function addMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight; // Rola para a última mensagem
}

// Autenticação anônima
signInAnonymously(auth)
  .then((userCredential) => {
    console.log('Usuário autenticado anonimamente.');

    // Ouvir novas mensagens
    const q = query(collection(db, 'messages'), orderBy('timestamp'));
    onSnapshot(q, (snapshot) => {
      messagesDiv.innerHTML = ''; // Limpa as mensagens atuais
      snapshot.forEach((doc) => {
        const data = doc.data();
        addMessage(`${data.nick}: ${data.message}`);
      });
    });

    // Enviar mensagem ao pressionar Enter
    messageInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter' && messageInput.value.trim() !== '') {
        const message = messageInput.value.trim();
        const nick = 'Usuário' + Math.floor(Math.random() * 1000); // Nick aleatório

        try {
          // Salva a mensagem no Firestore
          await addDoc(collection(db, 'messages'), {
            nick,
            message,
            timestamp: serverTimestamp()
          });

          messageInput.value = ''; // Limpa o campo de input
        } catch (error) {
          console.error('Erro ao enviar mensagem:', error);
          addMessage('Erro ao enviar mensagem. Tente novamente.');
        }
      }
    });

    // Inicializa o Phaser após a autenticação
    initializePhaser(userCredential.user.uid);
  })
  .catch((error) => {
    console.error('Erro na autenticação anônima:', error);
    addMessage('Erro ao conectar ao chat. Recarregue a página.');
  });

// Configuração do Phaser (Grid 20x20)
function initializePhaser(userId) {
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    parent: 'game-container',
    scene: {
      preload: preload,
      create: create,
      update: update
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    }
  };

  const game = new Phaser.Game(config);

  let avatar;
  let otherAvatars = {}; // Armazena os avatares de outros usuários

  // Função para gerar uma posição aleatória no grid
  function getRandomPosition() {
    const gridSize = 20;
    const cellSize = 40;
    const x = Math.floor(Math.random() * gridSize) * cellSize + cellSize / 2;
    const y = Math.floor(Math.random() * gridSize) * cellSize + cellSize / 2;
    return { x, y };
  }

  function preload() {
    // Carrega o sprite do avatar
    this.load.image('avatar', 'assets/avatar.png');
  }

  function create() {
    // Cria o grid 20x20
    const gridSize = 20;
    const cellSize = 40; // Tamanho de cada célula do grid

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = i * cellSize;
        const y = j * cellSize;
        this.add.rectangle(x, y, cellSize, cellSize, 0x444444).setOrigin(0);
      }
    }

    // Adiciona o avatar do usuário atual em uma posição aleatória
    const randomPosition = getRandomPosition();
    avatar = this.physics.add.sprite(randomPosition.x, randomPosition.y, 'avatar').setScale(0.5);
    avatar.setCollideWorldBounds(true);

    // Salva a posição inicial do avatar no Firestore
    const avatarsRef = collection(db, 'avatars');
    const userAvatarRef = doc(avatarsRef, userId);
    setDoc(userAvatarRef, {
      x: randomPosition.x,
      y: randomPosition.y
    }, { merge: true });

    // Ouvir mudanças na posição dos avatares
    onSnapshot(avatarsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const id = change.doc.id;

        if (change.type === 'added' || change.type === 'modified') {
          // Adiciona ou atualiza o avatar de outro usuário
          if (!otherAvatars[id]) {
            otherAvatars[id] = this.add.sprite(data.x, data.y, 'avatar').setScale(0.5);
          } else {
            otherAvatars[id].setPosition(data.x, data.y);
          }
        }

        if (change.type === 'removed') {
          // Remove o avatar de outro usuário
          if (otherAvatars[id]) {
            otherAvatars[id].destroy();
            delete otherAvatars[id];
          }
        }
      });
    });
  }

  function update() {
    // Movimentação do avatar com WASD
    const cursors = this.input.keyboard.createCursorKeys();
    const velocity = 100;

    if (cursors.left.isDown) {
      avatar.setVelocityX(-velocity);
    } else if (cursors.right.isDown) {
      avatar.setVelocityX(velocity);
    } else {
      avatar.setVelocityX(0);
    }

    if (cursors.up.isDown) {
      avatar.setVelocityY(-velocity);
    } else if (cursors.down.isDown) {
      avatar.setVelocityY(velocity);
    } else {
      avatar.setVelocityY(0);
    }

    // Atualiza a posição do avatar no Firestore
    const avatarsRef = collection(db, 'avatars');
    const userAvatarRef = doc(avatarsRef, userId);
    setDoc(userAvatarRef, {
      x: avatar.x,
      y: avatar.y
    }, { merge: true });
  }
}
// Função para entrar na fila
async function joinQueue(userId) {
  const queueRef = collection(db, 'djQueue');
  await addDoc(queueRef, {
    userId,
    timestamp: serverTimestamp()
  });
}

// Função para obter a fila
async function getQueue() {
  const queueRef = collection(db, 'djQueue');
  const snapshot = await getDocs(queueRef);
  const queue = snapshot.docs.map(doc => doc.data());
  return queue;
}

// Função para escolher a música do SoundCloud
async function chooseSong(userId, songUrl) {
  // Aqui você pode armazenar a música escolhida em uma coleção
  const songRef = doc(db, 'currentSong', 'playing'); // Exemplo de documento
  await setDoc(songRef, {
    userId,
    songUrl,
    timestamp: serverTimestamp()
  });
}
