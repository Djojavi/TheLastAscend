class CaveScene extends Phaser.Scene {
    constructor() {
        super('CaveScene');
    }

    preload() {
        this.load.tilemapTiledJSON('mapa_cueva', 'assets/cave_map.json');
        this.load.image('texturas_bloques', 'assets/free.png');
        this.load.image('fondo_oscuro', 'assets/background4a.png');
        this.load.image('oficinista', 'assets/oficinista.png');
        this.load.image('oficinistaleft', 'assets/oficinista-left.png');
        this.load.audio('music_cave', 'assets/sounds/sounds-cave.mp3');
        this.load.audio('new_level', 'assets/sounds/newLevel.mp3');
        this.load.image('time_apple', 'assets/watch.png');
        this.load.image('big_apple', 'assets/powerup.png');
    }

    create() {
        // ── MAPA ────────────────────────────────────────────────────────
        const map = this.make.tilemap({ key: 'mapa_cueva' });

        let bg = this.add.image(0, 0, 'fondo_oscuro').setOrigin(0, 0);
        bg.setDisplaySize(map.widthInPixels, map.heightInPixels);

        const nombreInternoTiled = map.tilesets[0].name;
        const tileset = map.addTilesetImage(nombreInternoTiled, 'texturas_bloques');
        const sueloLayer = map.createLayer('ground', tileset, 0, 0);
        sueloLayer.setCollisionByExclusion([-1]);

        // ── JUGADOR ─────────────────────────────────────────────────────
        this.player = this.physics.add.sprite(100, 100, 'oficinista');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.15);
        this.playerBig = false;
        this.levelCompleted = false;

        // ── COLISIÓN CON TILES MORTALES / WIN ───────────────────────────
        this.physics.add.collider(this.player, sueloLayer, (player, tile) => {
            let isDeadly = false;
            let isWin = false;
            if (tile.properties) {
                if (tile.properties.deadly !== undefined) isDeadly = tile.properties.deadly;
                if (tile.properties.win    !== undefined) isWin    = tile.properties.win;
            }
            if (isDeadly) this.playerDie();
            else if (isWin) this.playerWin();
        }, null, this);

        // ── POWER-UPS ────────────────────────────────────────────────────

        this.timeApples = this.physics.add.staticGroup();
        this.bigApples  = this.physics.add.staticGroup();

        const itemsLayer = map.getObjectLayer('items');
        if (itemsLayer) {
            itemsLayer.objects.forEach(obj => {
                const kind = obj.type || obj.class || '';
                if (kind === 'time_apple') {
                    this.timeApples.create(obj.x, obj.y, 'time_apple').setScale(0.3).refreshBody();
                } else if (kind === 'big_apple') {
                    this.bigApples.create(obj.x, obj.y, 'big_apple').setScale(0.3).refreshBody();
                }
            });
        }

        this.physics.add.overlap(this.player, this.timeApples, this.collectTimeApple, null, this);
        this.physics.add.overlap(this.player, this.bigApples,  this.collectBigApple,  null, this);

        // ── TEMPORIZADOR ────────────────────────────────────────────────
        this.timeLeft = 20;
        this.timerText = this.add.text(16, 16, 'TIEMPO: 20', {
            fontSize: '28px', fill: '#ff0000', fontFamily: 'monospace', fontWeight: 'bold'
        }).setScrollFactor(0);

        this.timeEvent = this.time.addEvent({
            delay: 1000, callback: this.updateTimer, callbackScope: this, loop: true
        });

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        this.cursors = this.input.keyboard.createCursorKeys();

        // ── MÚSICA ───────────────────────────────────────────────────────
        this.music = this.sound.add('music_cave', { loop: true, volume: 0.5 });
        this.music.play();
        this.events.on('shutdown', () => this.music.stop());
    }

    collectTimeApple(player, apple) {
        apple.destroy();
        this.timeLeft += 4;
        this.timerText.setText('TIEMPO: ' + this.timeLeft);
        this.timerText.setStyle({ fill: '#00ff00' });
        this.time.delayedCall(500, () => this.timerText.setStyle({ fill: '#ff0000' }));
        this.showFloatingText(player.x, player.y - 40, '+4s ⏱', '#00ff00');
    }

    collectBigApple(player, apple) {
        apple.destroy();
        if (!this.playerBig) {
            this.playerBig = true;
            this.player.setScale(this.player.scaleX * 2);
            this.bigBar = this.add.graphics().setScrollFactor(0);
            this.bigBarDuration = 5000;
            this.bigBarStart = this.time.now;
            this.time.delayedCall(5000, () => {
                this.player.setScale(this.player.scaleX / 2);
                this.playerBig = false;
                if (this.bigBar) { this.bigBar.destroy(); this.bigBar = null; }
            });
        }
        this.showFloatingText(player.x, player.y - 40, '¡GRANDE! 🔴', '#ffaa00');
    }

    showFloatingText(x, y, message, color) {
        const txt = this.add.text(x, y, message, {
            fontSize: '22px', fill: color, fontFamily: 'monospace', fontWeight: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);
        this.tweens.add({ targets: txt, y: y - 50, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
    }

    playerWin() {
        if (this.levelCompleted) return;
        this.levelCompleted = true;

        if (this.timeEvent) this.timeEvent.destroy();
        this.sound.stopAll();
        this.sound.play('new_level', { volume: 0.9 });
        this.player.setVelocity(0, 0);
        this.player.body.setEnable(false);
        this.player.setTint(0x00ff00);
        this.add.text(400, 300, '¡NIVEL COMPLETADO!\nLograste escapar...', {
            fontSize: '40px', fill: '#00ff00', fontFamily: 'monospace',
            fontWeight: 'bold', align: 'center'
        }).setOrigin(0.5).setScrollFactor(0);
        this.time.delayedCall(3000, () => this.scene.start('Scene2'));
    }

    updateTimer() {
        this.timeLeft--;
        this.timerText.setText('TIEMPO: ' + this.timeLeft);
        if (this.timeLeft <= 0) this.playerDie();
    }

    playerDie() {
        this.player.setVelocity(0, 0);
        this.player.body.setEnable(false);
        this.player.setTint(0xff0000);
        this.cameras.main.shake(300, 0.02);
        this.time.delayedCall(1000, () => this.scene.restart());
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.setTexture('oficinistaleft');
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.setTexture('oficinista');
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown && this.player.body.blocked.down)
            this.player.setVelocityY(-350);

        if (this.playerBig && this.bigBar) {
            const elapsed = this.time.now - this.bigBarStart;
            const ratio = Math.max(0, 1 - elapsed / this.bigBarDuration);
            this.bigBar.clear();
            this.bigBar.fillStyle(0xff4400, 0.8);
            this.bigBar.fillRect(16, 50, 150 * ratio, 12);
            this.bigBar.lineStyle(2, 0xffffff, 1);
            this.bigBar.strokeRect(16, 50, 150, 12);
        }
    }
}