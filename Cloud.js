class Cloud extends Phaser.GameObjects.Container {
    constructor(scene, x, y, word) {
        super(scene, x, y);
        this.scene = scene;
        this.fullWord = word; // Simpan kata penuh
        
        // Setup Visual Awan dan Teks
        let cloudImage = scene.add.image(0, 0, 'cloud').setAlpha(0.8);

        // Warnai awan berdasarkan panjang kata
        if (word.length >= 7) {
            cloudImage.setTint(0xffaaaa); // Merah muda (>= 7 huruf)
        } else if (word.length >= 5) {
            cloudImage.setTint(0xffffaa); // Kuning muda (5-6 huruf)
        } else {
            cloudImage.setTint(0xaaffaa); // Hijau muda (2-4 huruf)
        }
        
        const styleBlack = { fontSize: '30px', fill: '#000', fontWeight: 'bold' };
        const styleBlue = { fontSize: '30px', fill: '#0000ff', fontWeight: 'bold' };

        // Text bagian kiri (sudah diketik - Biru)
        this.leftText = scene.add.text(0, 0, "", styleBlue).setOrigin(0, 0.5);
        
        // Text bagian kanan (belum diketik - Hitam)
        this.rightText = scene.add.text(0, 0, word, styleBlack).setOrigin(0, 0.5);

        this.add([cloudImage, this.leftText, this.rightText]);
        this.updateLayout(); // Atur posisi awal

        this.setAlpha(0);

        // Tambahkan container ini ke scene
        scene.add.existing(this);

        // Animasi muncul (Fade In)
        scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 500
        });
    }

    getWord() {
        return this.fullWord;
    }

    updateProgress(typedString) {
        if (this.fullWord.startsWith(typedString)) {
            this.leftText.setText(typedString);
            this.rightText.setText(this.fullWord.substring(typedString.length));
        } else {
            this.leftText.setText("");
            this.rightText.setText(this.fullWord);
        }
        this.updateLayout();
    }

    updateLayout() {
        let w1 = this.leftText.width;
        let w2 = this.rightText.width;
        let totalW = w1 + w2;
        let startX = -totalW / 2;
        
        this.leftText.x = startX;
        this.rightText.x = startX + w1;
    }

    explode() {
        let x = this.x;
        let y = this.y;
        let scene = this.scene; // Simpan referensi scene sebelum destroy
        
        // Hancurkan objek awan ini
        this.destroy();

        // Buat efek pecahan (8 partikel kecil) menyebar
        for (let i = 0; i < 8; i++) {
            let puff = scene.add.image(x, y, 'puff');
            
            let angle = Phaser.Math.Between(0, 360);
            let distance = Phaser.Math.Between(40, 80);
            let targetX = x + Math.cos(Phaser.Math.DegToRad(angle)) * distance;
            let targetY = y + Math.sin(Phaser.Math.DegToRad(angle)) * distance;

            scene.tweens.add({
                targets: puff,
                x: targetX,
                y: targetY,
                alpha: 0,
                scale: { from: 1, to: 0.5 },
                duration: 300,
                onComplete: () => puff.destroy()
            });
        }
    }

    static createTextures(scene) {
        // Buat tekstur awan secara programatis
        let graphics = scene.make.graphics({ x: 0, y: 0, add: false });
        
        // 1. Lapisan Bayangan (Abu-abu)
        graphics.fillStyle(0xcccccc, 1); 
        graphics.fillCircle(55, 70, 40);
        graphics.fillCircle(95, 65, 50);
        graphics.fillCircle(135, 70, 40);
        graphics.fillCircle(75, 45, 35);
        graphics.fillCircle(115, 45, 35);

        // 2. Lapisan Utama (Putih)
        graphics.fillStyle(0xffffff, 1); 
        graphics.fillCircle(50, 65, 40);
        graphics.fillCircle(90, 60, 50);
        graphics.fillCircle(130, 65, 40);
        graphics.fillCircle(70, 40, 35);
        graphics.fillCircle(110, 40, 35);
        graphics.generateTexture('cloud', 200, 140);

        // Buat tekstur partikel pecahan (puff)
        let puffGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
        puffGraphics.fillStyle(0xffffff, 1);
        puffGraphics.fillCircle(15, 15, 15);
        puffGraphics.generateTexture('puff', 30, 30);
    }
}