class Cloud extends Phaser.GameObjects.Container {
    constructor(scene, x, y, word) {
        super(scene, x, y);
        this.scene = scene;
        this.fullWord = word; // Simpan kata penuh
        
        // Setup Visual Awan dan Teks
        // Pilih tekstur berdasarkan panjang kata
        let colorKey;
        let cloudScale;

        if (word.length >= 7) {
            colorKey = 'cloud_red';
            cloudScale = 1.15; // Lebih besar untuk kata panjang
        } else if (word.length >= 5) {
            colorKey = 'cloud_yellow';
            cloudScale = 1.0; // Ukuran normal
        } else {
            colorKey = 'cloud_green';
            cloudScale = 0.85; // Lebih kecil untuk kata pendek
        }

        // Pilih bentuk secara acak (0 sampai 19)
        const shapeIndex = Phaser.Math.Between(0, 19);
        const textureKey = `${colorKey}_${shapeIndex}`;

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
        // Definisi 9 variasi bentuk awan
        const shapes = [
            // Shape 0 (Original)
            {
                ellipses: [{ x: 100, y: 110, w: 90, h: 30 }, { x: 60, y: 110, w: 90, h: 30 }, { x: 130, y: 110, w: 90, h: 30 }],
                circles: [{ x: 50, y: 95, r: 25 }, { x: 85, y: 75, r: 25 }, { x: 105, y: 95, r: 25 }, { x: 125, y: 85, r: 25 }, { x: 145, y: 95, r: 15 }]
            },
            // Shape 1 (Tinggi/Piramid)
            {
                ellipses: [{ x: 100, y: 120, w: 100, h: 40 }],
                circles: [{ x: 60, y: 110, r: 30 }, { x: 140, y: 110, r: 30 }, { x: 100, y: 80, r: 40 }, { x: 80, y: 100, r: 30 }, { x: 120, y: 100, r: 30 }]
            },
            // Shape 2 (Lebar/Datar)
            {
                ellipses: [{ x: 100, y: 115, w: 140, h: 35 }],
                circles: [{ x: 40, y: 105, r: 25 }, { x: 80, y: 95, r: 30 }, { x: 120, y: 95, r: 30 }, { x: 160, y: 105, r: 25 }]
            },
            // Shape 3 (Besar Kiri)
            {
                ellipses: [{ x: 90, y: 115, w: 110, h: 35 }],
                circles: [{ x: 50, y: 90, r: 40 }, { x: 90, y: 80, r: 35 }, { x: 130, y: 100, r: 25 }, { x: 150, y: 110, r: 20 }]
            },
            // Shape 4 (Besar Kanan)
            {
                ellipses: [{ x: 110, y: 115, w: 110, h: 35 }],
                circles: [{ x: 150, y: 90, r: 40 }, { x: 110, y: 80, r: 35 }, { x: 70, y: 100, r: 25 }, { x: 50, y: 110, r: 20 }]
            },
            // Shape 5 (Padat/Bulat)
            {
                ellipses: [{ x: 100, y: 110, w: 80, h: 40 }],
                circles: [{ x: 75, y: 90, r: 35 }, { x: 125, y: 90, r: 35 }, { x: 100, y: 70, r: 30 }]
            },
            // Shape 6 (Dua Gumpalan Besar)
            {
                ellipses: [{ x: 100, y: 120, w: 120, h: 30 }],
                circles: [{ x: 70, y: 90, r: 35 }, { x: 130, y: 90, r: 35 }, { x: 100, y: 110, r: 25 }]
            },
            // Shape 7 (Berombak Kecil)
            {
                ellipses: [{ x: 100, y: 115, w: 110, h: 35 }],
                circles: [{ x: 50, y: 105, r: 20 }, { x: 75, y: 90, r: 25 }, { x: 100, y: 75, r: 30 }, { x: 125, y: 90, r: 25 }, { x: 150, y: 105, r: 20 }]
            },
            // Shape 8 (Panjang Tipis)
            {
                ellipses: [{ x: 100, y: 115, w: 150, h: 25 }],
                circles: [{ x: 40, y: 110, r: 20 }, { x: 70, y: 105, r: 22 }, { x: 100, y: 100, r: 25 }, { x: 130, y: 105, r: 22 }, { x: 160, y: 110, r: 20 }]
            },
            // Shape 9 (Asimetris Kiri)
            {
                ellipses: [{ x: 100, y: 115, w: 130, h: 30 }],
                circles: [{ x: 50, y: 100, r: 25 }, { x: 85, y: 85, r: 30 }, { x: 120, y: 90, r: 28 }, { x: 155, y: 105, r: 20 }]
            },
            // Shape 10 (Tumpuk Tengah)
            {
                ellipses: [{ x: 100, y: 120, w: 80, h: 35 }],
                circles: [{ x: 75, y: 100, r: 30 }, { x: 125, y: 100, r: 30 }, { x: 100, y: 70, r: 35 }]
            },
            // Shape 11 (Berat Kiri)
            {
                ellipses: [{ x: 90, y: 115, w: 100, h: 30 }],
                circles: [{ x: 50, y: 95, r: 35 }, { x: 90, y: 85, r: 30 }, { x: 125, y: 105, r: 20 }]
            },
            // Shape 12 (Berat Kanan)
            {
                ellipses: [{ x: 110, y: 115, w: 100, h: 30 }],
                circles: [{ x: 150, y: 95, r: 35 }, { x: 110, y: 85, r: 30 }, { x: 75, y: 105, r: 20 }]
            },
            // Shape 13 (Acak/Fluffy)
            {
                ellipses: [{ x: 100, y: 110, w: 110, h: 40 }],
                circles: [{ x: 60, y: 90, r: 30 }, { x: 100, y: 80, r: 30 }, { x: 140, y: 90, r: 30 }, { x: 100, y: 110, r: 30 }]
            },
            // Shape 14 (Datar Panjang)
            {
                ellipses: [{ x: 100, y: 120, w: 140, h: 25 }],
                circles: [{ x: 40, y: 110, r: 20 }, { x: 70, y: 95, r: 25 }, { x: 100, y: 90, r: 25 }, { x: 130, y: 95, r: 25 }, { x: 160, y: 110, r: 20 }]
            },
            // Shape 15 (Piramid Terbalik)
            {
                ellipses: [{ x: 100, y: 110, w: 100, h: 40 }],
                circles: [{ x: 60, y: 100, r: 30 }, { x: 140, y: 100, r: 30 }, { x: 100, y: 65, r: 40 }]
            },
            // Shape 16 (Tiga Puncak)
            {
                ellipses: [{ x: 100, y: 115, w: 120, h: 30 }],
                circles: [{ x: 50, y: 100, r: 25 }, { x: 80, y: 80, r: 30 }, { x: 120, y: 80, r: 30 }, { x: 150, y: 100, r: 25 }]
            },
            // Shape 17 (Empat Puncak Kecil)
            {
                ellipses: [{ x: 100, y: 115, w: 130, h: 30 }],
                circles: [{ x: 45, y: 105, r: 20 }, { x: 75, y: 90, r: 25 }, { x: 105, y: 80, r: 25 }, { x: 135, y: 95, r: 25 }, { x: 160, y: 110, r: 15 }]
            },
            // Shape 18 (Besar Tengah)
            {
                ellipses: [{ x: 100, y: 115, w: 100, h: 35 }],
                circles: [{ x: 60, y: 105, r: 25 }, { x: 140, y: 105, r: 25 }, { x: 100, y: 75, r: 40 }]
            },
            // Shape 19 (Cluster Acak)
            {
                ellipses: [{ x: 100, y: 110, w: 110, h: 35 }],
                circles: [{ x: 50, y: 90, r: 30 }, { x: 90, y: 100, r: 25 }, { x: 110, y: 75, r: 30 }, { x: 150, y: 95, r: 25 }]
            }
        ];

        // Definisi variasi warna shading
        const variants = [
            { key: 'cloud_green', color: 0xdef2de },   // < 5 huruf (Hijau Abu) #def2deff
            { key: 'cloud_yellow', color: 0xf4f4cc },  // 5-6 huruf (Kuning Abu) #f4f4ccff
            { key: 'cloud_red', color: 0xf7d6d6 }      // >= 7 huruf (Merah Abu) #f7d6d6ff
        ];

        // Generate tekstur untuk setiap kombinasi Warna x Bentuk
        variants.forEach(variant => {
            shapes.forEach((shape, index) => {
                let bodyGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
                const bY = 2; // Offset shading internal
                
                // A. Lapisan Dasar (Putih)
                bodyGraphics.fillStyle(0xffffff, 1);
                shape.ellipses.forEach(e => bodyGraphics.fillEllipse(e.x, e.y, e.w, e.h));

                // B. Gumpalan dengan Shading Internal
                shape.circles.forEach(c => {
                    // Shading internal (Warna sesuai varian)
                    bodyGraphics.fillStyle(variant.color, 1);
                    bodyGraphics.fillCircle(c.x - bY, c.y - bY, c.r);
                    
                    // Bagian utama (Putih)
                    bodyGraphics.fillStyle(0xffffff, 1);
                    bodyGraphics.fillCircle(c.x, c.y, c.r);
                });

                // Nama tekstur: cloud_green_0, cloud_green_1, dst.
                bodyGraphics.generateTexture(`${variant.key}_${index}`, 220, 180);
            });
        });

        // 3. TEKSTUR PUFF
        let puffGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
        puffGraphics.fillStyle(0xffffff, 1);
        puffGraphics.fillCircle(15, 15, 15);
        puffGraphics.generateTexture('puff', 30, 30);
    }
}