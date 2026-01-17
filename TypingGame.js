import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
//import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";

// KONFIGURASI FIREBASE (Ganti dengan config dari Firebase Console kamu)
const firebaseConfig = {
    apiKey: "AIzaSyAi_W4Mgw_zjNzOPBOPMF2oJZQWU0-dp2w",
    authDomain: "poptyping.firebaseapp.com",
    projectId: "poptyping",
    storageBucket: "poptyping.firebasestorage.app",
    messagingSenderId: "15268605692",
    appId: "1:15268605692:web:7815c84835926ec0c17179",
    measurementId: "G-BBD8LS4XCX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
//const analytics = getAnalytics(app);

class TypingGame extends Phaser.Scene {
    constructor() {
        super({ key: 'TypingGame' });
    }

    preload() {
        this.load.json('wordData', 'indonesian_words.json');
        this.load.audio('typing', 'typing-sound.mp3');
        this.load.audio('wind', 'blowing-wind.mp3');
        this.load.audio('wrong', 'wrong-sound.mp3');
        this.load.image('background', 'background.png');
    }

    create() {
        // Tambahkan background sesuai gambar tampilan
        this.add.image(400, 300, 'background');

        this.words = this.cache.json.get('wordData');
        this.score = 0;
        this.timeLeft = 60; // Timer 60 detik
        this.activeWords = []; // Array untuk menyimpan banyak kata aktif
        this.inputBuffer = ""; // Menyimpan apa yang sedang diketik
        this.isGameRunning = false; // Status game belum mulai
        this.playerName = "";

        // Panggil fungsi static dari Cloud.js untuk membuat tekstur
        Cloud.createTextures(this);

        // Buat UI Box untuk Score dan Time agar mirip tampilan.png
        let uiGraphics = this.add.graphics();
        uiGraphics.fillStyle(0x5D9CEC, 1); // Warna biru muda
        uiGraphics.lineStyle(4, 0x4A89DC, 1); // Garis tepi biru tua
        
        // Kotak Score (Kiri Atas)
        uiGraphics.fillRoundedRect(20, 20, 200, 50, 10);
        uiGraphics.strokeRoundedRect(20, 20, 200, 50, 10);
        this.scoreText = this.add.text(120, 45, 'Score: 0', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        // Kotak Time (Kanan Atas)
        uiGraphics.fillRoundedRect(580, 20, 200, 50, 10);
        uiGraphics.strokeRoundedRect(580, 20, 200, 50, 10);
        this.timeText = this.add.text(680, 45, 'Time: 60', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        this.playerNameText = this.add.text(400, 45, '', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        
        this.startNameInput();
    }

    startNameInput() {
        this.inputOverlay = this.add.graphics();
        this.inputOverlay.fillStyle(0x000000, 0.8);
        this.inputOverlay.fillRect(0, 0, 800, 600);

        this.namePrompt = this.add.text(400, 200, 'MASUKKAN NAMA:', { fontSize: '40px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        this.nameDisplay = this.add.text(400, 300, '_', { fontSize: '60px', fill: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5);
        this.nameInstruction = this.add.text(400, 450, 'Tekan ENTER untuk Mulai', { fontSize: '20px', fill: '#ccc' }).setOrigin(0.5);

        this.input.keyboard.on('keydown', this.handleNameInput, this);
    }

    handleNameInput(event) {
        if (event.keyCode === 8) { // Backspace
            if (this.playerName.length > 0) this.playerName = this.playerName.slice(0, -1);
        } else if (event.keyCode === 13) { // Enter
            if (this.playerName.trim().length > 0) this.submitName();
        } else if (event.key.length === 1 && /[a-zA-Z0-9 ]/.test(event.key)) {
            if (this.playerName.length < 12) this.playerName += event.key;
        }
        this.nameDisplay.setText(this.playerName + '_');
    }

    submitName() {
        this.input.keyboard.off('keydown', this.handleNameInput, this);
        this.inputOverlay.destroy();
        this.namePrompt.destroy();
        this.nameDisplay.destroy();
        this.nameInstruction.destroy();

        this.playerNameText.setText('Player: ' + this.playerName);
        this.startCountdown();

        this.input.keyboard.on('keydown', (event) => {
            if (this.isGameRunning && this.timeLeft > 0) {
                this.handleInput(event);
            }
        });
    }

    startCountdown() {
        let count = 3;
        let text = this.add.text(400, 300, count, { 
            fontSize: '120px', 
            fill: '#ffffff', 
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        this.time.addEvent({
            delay: 1000,
            callback: () => {
                count--;
                if (count > 0) {
                    text.setText(count);
                } else if (count === 0) {
                    text.setText('MULAI!');
                } else {
                    text.destroy();
                    this.startGame();
                }
            },
            repeat: 3
        });
    }

    startGame() {
        this.isGameRunning = true;
        
        // Reset Statistik Pengetikan
        this.totalKeystrokes = 0;
        this.correctKeystrokes = 0;
        this.wrongKeystrokes = 0;
        this.startTime = Date.now();

        // Munculkan 7 kata sekaligus
        for (let i = 0; i < 7; i++) {
            this.spawnWord();
        }

        // Timer event loop
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timeLeft--;
                this.timeText.setText('Time: ' + this.timeLeft);
                if (this.timeLeft <= 0) {
                    this.endGame();
                }
            },
            loop: true
        });
    }

    update() {
        // Logika game over sekarang ditangani oleh tween di spawnWord
    }

    endGame() {
        this.timerEvent.remove();
        this.activeWords.forEach(word => word.destroy());
        this.activeWords = [];

        // Tampilkan UI Game Over dengan background gelap transparan
        let graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.9);
        graphics.fillRect(0, 0, 800, 600);

        // Hitung Statistik
        let timeMinutes = (Date.now() - this.startTime) / 60000;
        if (timeMinutes <= 0) timeMinutes = 0.001; // Mencegah pembagian nol

        let grossWPM = Math.round((this.totalKeystrokes / 5) / timeMinutes);
        let netWPM = Math.round(((this.totalKeystrokes - this.wrongKeystrokes) / 5) / timeMinutes);
        if (netWPM < 0) netWPM = 0;
        let cpm = Math.round(this.totalKeystrokes / timeMinutes);
        let accuracy = this.totalKeystrokes > 0 ? ((this.correctKeystrokes / this.totalKeystrokes) * 100).toFixed(1) : 0;

        // --- HEADER ---
        this.add.text(400, 60, 'TIME UP!', { fontSize: '50px', fill: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 110, 'Final Score: ' + this.score, { fontSize: '36px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

        // --- STATS BOX ---
        let statsBg = this.add.graphics();
        statsBg.fillStyle(0x333333, 0.8);
        statsBg.fillRoundedRect(150, 140, 500, 80, 10);
        
        this.add.text(400, 165, `Gross WPM: ${grossWPM}   |   Net WPM: ${netWPM}`, { fontSize: '20px', fill: '#00ff00' }).setOrigin(0.5);
        this.add.text(400, 195, `CPM: ${cpm}   |   Accuracy: ${accuracy}%`, { fontSize: '20px', fill: '#00ff00' }).setOrigin(0.5);
        
        // Teks Loading
        let loadingText = this.add.text(400, 350, 'Saving & Loading Leaderboard...', { 
            fontSize: '24px', 
            fill: '#ffff00', 
            align: 'center',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Proses Async ke Firebase
        this.handleLeaderboard(loadingText);
    }

    async handleLeaderboard(loadingText) {
        await this.saveHighScore();
        let highScores = await this.getHighScores();

        loadingText.destroy();

        // --- LEADERBOARD BOX ---
        let lbBg = this.add.graphics();
        lbBg.fillStyle(0x222222, 0.9);
        lbBg.lineStyle(2, 0xffd700); // Gold border
        lbBg.fillRoundedRect(200, 260, 400, 250, 10);
        lbBg.strokeRoundedRect(200, 260, 400, 250, 10);

        this.add.text(400, 290, '🏆 GLOBAL LEADERBOARD 🏆', { fontSize: '24px', fill: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);

        let startY = 330;
        highScores.forEach((data, index) => {
            let color = index === 0 ? '#ffd700' : '#ffffff'; // Emas untuk juara 1
            let yPos = startY + (index * 35);
            
            // Nama (Align Left di dalam box)
            this.add.text(230, yPos, `${index + 1}. ${data.name}`, { fontSize: '20px', fill: color }).setOrigin(0, 0.5);
            
            // Skor (Align Right di dalam box)
            this.add.text(570, yPos, `${data.score}`, { fontSize: '20px', fill: color }).setOrigin(1, 0.5);
        });

        this.add.text(400, 560, 'Click to Restart', { fontSize: '20px', fill: '#888' }).setOrigin(0.5);
        this.input.once('pointerdown', () => this.scene.restart());
    }

    async getHighScores() {
        try {
            const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(5));
            const querySnapshot = await getDocs(q);
            let scores = [];
            querySnapshot.forEach((doc) => scores.push(doc.data()));
            return scores;
        } catch (e) {
            console.error("Error getting scores: ", e);
            return [];
        }
    }

    async saveHighScore() {
        try {
            await addDoc(collection(db, "leaderboard"), {
                name: this.playerName,
                score: this.score
            });
        } catch (e) {
            console.error("Error adding score: ", e);
        }
    }

    spawnWord() {
        if (this.timeLeft <= 0) return;

        let randomWord = this.words[Math.floor(Math.random() * this.words.length)];
        
        let xPos, yPos;
        let validPosition = false;
        let attempts = 0;

        // Coba cari posisi yang tidak bertumpukan
        while (!validPosition && attempts < 100) {
            xPos = Phaser.Math.Between(100, 700); // Perluas area spawn
            yPos = Phaser.Math.Between(80, 520);
            
            validPosition = true;
            for (let word of this.activeWords) {
                // Kurangi jarak aman agar muat 7 awan (boleh sedikit overlap di pinggir)
                if (Math.abs(xPos - word.x) < 150 && Math.abs(yPos - word.y) < 110) {
                    validPosition = false;
                    break;
                }
            }
            attempts++;
        }
        
        // Gunakan Class Cloud yang baru
        let newCloud = new Cloud(this, xPos, yPos, randomWord);
        this.activeWords.push(newCloud);
    }

    handleInput(event) {
        let char = event.key.toUpperCase();

        // Pastikan hanya huruf A-Z yang diproses dan mengurangi skor
        if (char.length !== 1 || !/[A-Z]/.test(char)) return;

        this.totalKeystrokes++;

        this.sound.play('typing');
        this.score -= 1; // Kurangi 1 skor setiap mengetik huruf
        this.scoreText.setText('Score: ' + this.score);

        let nextBuffer = this.inputBuffer + char;
        
        // Cari kata-kata yang cocok dengan input sejauh ini
        let matches = this.activeWords.filter(cloud => cloud.getWord().startsWith(nextBuffer));

        if (matches.length > 0) {
            this.correctKeystrokes++;
            this.inputBuffer = nextBuffer;

            // Update visual: yang cocok jadi biru, yang tidak jadi hitam
            this.activeWords.forEach(cloud => {
                if (matches.includes(cloud)) {
                    cloud.updateProgress(this.inputBuffer);
                } else {
                    cloud.updateProgress("");
                }
            });

            // Cek jika ada kata yang selesai diketik
            let completedWord = matches.find(cloud => cloud.getWord() === this.inputBuffer);
            if (completedWord) {
                // Skor: 2 pangkat panjang kata
                this.score += Math.pow(2, completedWord.getWord().length);
                this.scoreText.setText('Score: ' + this.score);
                
                // Hapus kata yang selesai dan spawn baru
                this.activeWords = this.activeWords.filter(w => w !== completedWord);
                this.sound.play('wind');
                completedWord.explode(); // Panggil efek pecah dari class Cloud
                this.inputBuffer = ""; // Reset buffer
                this.activeWords.forEach(w => w.updateProgress("")); // Reset warna sisa
                this.spawnWord();
            }
        } else {
            // Salah ketik
            this.wrongKeystrokes++;
            this.sound.play('wrong');
            this.inputBuffer = "";
            this.activeWords.forEach(w => w.updateProgress("")); // Reset semua ke hitam
        }
    }
}

window.TypingGame = TypingGame;