class Cloud extends Phaser.GameObjects.Container {
    constructor(scene, x, y, word) {
        super(scene, x, y);
        this.scene = scene;
        this.fullWord = word; // Simpan kata penuh
        
        // Setup Visual Awan dan Teks
        // Pilih tekstur berdasarkan panjang kata
        let textureKey;
        let cloudScale;

        if (word.length >= 7) {
            textureKey = 'cloud_red';
            cloudScale = 1.15; // Lebih besar untuk kata panjang
        } else if (word.length >= 5) {
            textureKey = 'cloud_yellow';
            cloudScale = 1.0; // Ukuran normal
        } else {
            textureKey = 'cloud_green';
            cloudScale = 0.85; // Lebih kecil untuk kata pendek
        }

        let bodyImage = scene.add.image(0, 0, textureKey).setAlpha(0.9).setScale(cloudScale);
        
        const styleBlack = { fontSize: '20px', fill: '#000', fontWeight: 'bold' };
        const styleBlue = { fontSize: '20px', fill: '#0000ff', fontWeight: 'bold' };

        // Text bagian kiri (sudah diketik - Biru)
        this.leftText = scene.add.text(0, 20, "", styleBlue).setOrigin(0, 0.5);
        
        // Text bagian kanan (belum diketik - Hitam)
        this.rightText = scene.add.text(0, 20, word, styleBlack).setOrigin(0, 0.5);

        this.add([bodyImage, this.leftText, this.rightText]);
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

        // Mulai gerakan mengambang (floating)
        this.startFloating();
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

    startFloating() {
        this.initialX = this.x;
        this.initialY = this.y;
        this.moveRandomly();
    }

    moveRandomly() {
        if (!this.scene) return; // Cek jika objek sudah dihancurkan

        // Gerakan random lambat di sekitar posisi awal
        const targetX = this.initialX + Phaser.Math.Between(-30, 30);
        const targetY = this.initialY + Phaser.Math.Between(-20, 20);
        const duration = Phaser.Math.Between(10000, 15000); // 10-15 detik

        this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            duration: duration,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                if (this.scene) this.moveRandomly();
            }
        });
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
        // Definisi bentuk-bentuk dasar awan (Ellipses untuk dasar, Circles untuk gumpalan)
        const ellipses = [
            { x: 100, y: 110, w: 90, h: 30 },
            { x: 60, y: 110, w: 90, h: 30 },
            { x: 130, y: 110, w: 90, h: 30 }
        ];

        const circles = [
            { x: 50, y: 95, r: 25 },
            { x: 85, y: 75, r: 25 },
            { x: 105, y: 95, r: 25 },
            { x: 125, y: 85, r: 25 },
            { x: 145, y: 95, r: 15 }
        ];

        // Definisi variasi warna shading
        const variants = [
            { key: 'cloud_green', color: 0xdef2de },   // < 5 huruf (Hijau Abu) #def2deff
            { key: 'cloud_yellow', color: 0xf4f4cc },  // 5-6 huruf (Kuning Abu) #f4f4ccff
            { key: 'cloud_red', color: 0xf7d6d6 }      // >= 7 huruf (Merah Abu) #f7d6d6ff
        ];

        // Generate 3 tekstur berbeda (Hijau, Kuning, Merah)
        variants.forEach(variant => {
            let bodyGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
            const bY = 2; // Offset shading internal
            
            // A. Lapisan Dasar (Putih)
            bodyGraphics.fillStyle(0xffffff, 1);
            ellipses.forEach(e => bodyGraphics.fillEllipse(e.x, e.y, e.w, e.h));

            // B. Gumpalan dengan Shading Internal
            circles.forEach(c => {
                // Shading internal (Warna sesuai varian)
                bodyGraphics.fillStyle(variant.color, 1);
                bodyGraphics.fillCircle(c.x - bY, c.y - bY, c.r);
                
                // Bagian utama (Putih)
                bodyGraphics.fillStyle(0xffffff, 1);
                bodyGraphics.fillCircle(c.x, c.y, c.r);
            });

            bodyGraphics.generateTexture(variant.key, 200, 160);
        });

        // 3. TEKSTUR PUFF
        let puffGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
        puffGraphics.fillStyle(0xffffff, 1);
        puffGraphics.fillCircle(15, 15, 15);
        puffGraphics.generateTexture('puff', 30, 30);
    }
}