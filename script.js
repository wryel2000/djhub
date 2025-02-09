const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 800,
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

  // Adiciona o avatar no centro do grid
  avatar = this.physics.add.sprite(400, 400, 'avatar').setScale(0.5);
  avatar.setCollideWorldBounds(true);
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
}
// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

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
    }
  }
});
