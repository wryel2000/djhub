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
// Configuração do PeerJS
const peer = new Peer({
  host: '0.peerjs.com',
  port: 443,
  path: '/',
  secure: true,
  debug: 3
});

let hostConnection;
let isHost = false;
const connections = []; // Armazena todas as conexões

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

// Função para enviar mensagem para todos os conectados
function broadcast(message) {
  connections.forEach(conn => {
    if (conn.open) {
      conn.send(message);
    }
  });
}

// Iniciar conexão como host
function startAsHost() {
  isHost = true;
  addMessage('Você é o host da sala!');
}

// Conectar ao host
function connectToHost(hostId) {
  hostConnection = peer.connect(hostId);
  hostConnection.on('open', () => {
    addMessage('Conectado à sala!');
    connections.push(hostConnection); // Adiciona a conexão ao host na lista
    hostConnection.on('data', (data) => {
      addMessage(data); // Recebe mensagens do host
    });
  });
}

// Iniciar conexão
peer.on('open', (id) => {
  addMessage(`Seu ID: ${id}`);

  // Verifica se já existe um host na sala
  const urlParams = new URLSearchParams(window.location.search);
  const hostId = urlParams.get('host');

  if (hostId) {
    // Conecta ao host existente
    connectToHost(hostId);
  } else {
    // Torna-se o host da sala
    startAsHost();
    window.history.replaceState({}, '', `?host=${id}`); // Adiciona o ID do host na URL
  }
});

// Receber conexões (apenas para o host)
peer.on('connection', (connection) => {
  if (isHost) {
    connections.push(connection); // Adiciona a nova conexão à lista
    addMessage('Novo usuário conectado!');
    connection.on('data', (data) => {
      addMessage(data); // Recebe mensagens do usuário
      broadcast(data); // Retransmite a mensagem para todos
    });
  }
});

// Enviar mensagem ao pressionar Enter
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && messageInput.value.trim() !== '') {
    const message = messageInput.value.trim();
    const nick = 'Usuário' + Math.floor(Math.random() * 1000); // Nick aleatório
    const fullMessage = `${nick}: ${message}`;

    if (isHost) {
      // Se for o host, envia a mensagem para todos
      broadcast(fullMessage);
      addMessage(fullMessage); // Exibe a mensagem localmente
    } else if (hostConnection && hostConnection.open) {
      // Se não for o host, envia a mensagem para o host
      hostConnection.send(fullMessage);
      addMessage(fullMessage); // Exibe a mensagem localmente
    }

    messageInput.value = ''; // Limpa o campo de input
  }
});
