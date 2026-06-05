class Scene2 extends Phaser.Scene {
    constructor() {
        super('Scene2');
    }

    preload() {
        this.load.tilemapTiledJSON('mapa2', 'assets/cave_map2.json');
        this.load.image('texturas2', 'assets/free.png');
        this.load.image('lava_tiles', 'assets/BL-lava-tileset-itch.png');
        this.load.image('lava2_tiles', 'assets/xgxwkH.png');
        this.load.image('fondo_lava', 'assets/Gemini_Generated_Image_ap6o6hap6o6hap6o.png');
        this.load.image('oficinista', 'assets/oficinista.png');
        this.load.image('oficinistaleft', 'assets/oficinista-left.png');
        this.load.audio('music_lava', 'assets/sounds/lava.mp3');
    }

    create() {
    // ── MAPA ────────────────────────────────────────────────────────
    const map = this.make.tilemap({ key: 'mapa2' });

    // ── FONDO ────────────────────────────────────────────────────────
    const bg = this.add.image(0, 0, 'fondo_lava').setOrigin(0, 0);
    bg.setDisplaySize(map.widthInPixels, map.heightInPixels);

    // ── TILESETS ─────────────────────────────────────────────────────
   // ── TILESETS ─────────────────────────────────────────────────────
    const tileset1 = map.addTilesetImage('free', 'texturas2');
    const tileset2 = map.addTilesetImage('free', 'texturas2'); 
    const tileset3 = map.addTilesetImage('lava', 'lava2_tiles');
    const tileset4 = map.addTilesetImage('lava', 'lava2_tiles'); 

    const allTilesets = [tileset1, tileset2, tileset3, tileset4].filter(t => t !== null);

    // ── CAPAS DE TILES ───────────────────────────────────────────────
    // Todo tu mapa está aquí
    const sueloLayer = map.createLayer('Capa de patrones 2', allTilesets, 0, 0);
    sueloLayer.setCollisionByExclusion([-1]);

    // ── JUGADOR ──────────────────────────────────────────────────────
    this.player = this.physics.add.sprite(100, 400, 'oficinista');
    this.player.setCollideWorldBounds(true);
    this.player.setScale(0.15);
    this.playerBig = false;
    this.isDead = false;

    // ── ENEMIGO VOLADOR ──────────────────────────────────────────────
    const gfxBird = this.make.graphics({ x: 0, y: 0, add: false });
    gfxBird.fillStyle(0xff0000);
    gfxBird.fillCircle(16, 16, 16);
    gfxBird.generateTexture('bird', 32, 32);
    gfxBird.destroy();

    this.bird = this.physics.add.sprite(400, 400, 'bird');
    this.bird.setCollideWorldBounds(true);
    this.bird.setBounceX(1);
    this.bird.setVelocityX(120);
    this.bird.body.setAllowGravity(false);

    this.physics.add.overlap(this.player, this.bird, () => {
        if (!this.isDead) this.playerDie();
    });

    // ── UNICA MATRIZ DE COLISIÓN (SUELO PRINCIPAL) ───────────────────
    this.physics.add.collider(this.player, sueloLayer, (player, tile) => {
        if (this.isDead) return;

        console.log("COLISIONANDO CON TILE INDEX:", tile.index);

        // 1. Detectar lava por rango de IDs reales según tu JSON (Tileset 2, 3 y 4)
        if (tile.index >= 97) {
            console.log("¡Muerte por ID de lava!");
            this.playerDie();
            return;
        }

        // 2. Detectar por propiedad booleana de Tiled (por si acaso)
        if (tile.properties?.deadly === true || tile.properties?.deadly) {
            console.log("¡Muerte por propiedad deadly!");
            this.playerDie();
            return;
        }

        if (tile.properties?.win) { 
            this.playerWin(); 
            return; 
        }

        // MECÁNICA DE DERRUMBE
        if (tile.properties?.crumble && !tile.data?.get('crumbling')) {
            if (!tile.data) tile.data = new Phaser.Data.DataManager(tile);
            tile.data.set('crumbling', true);
            this.tweens.addCounter({
                from: 0, to: 10, duration: 1500,
                onUpdate: (tween) => {
                    tile.setAlpha(Math.floor(tween.getValue()) % 2 === 0 ? 0.3 : 1);
                },
                onComplete: () => {
                    tile.setCollision(false);
                    tile.setAlpha(0);
                }
            });
        }
    }, null, this);

    // ── POWER-UPS Y DEMÁS LÓGICA (Se mantiene igual...) ────────────────
    const gfxTime = this.make.graphics({ x: 0, y: 0, add: false });
    gfxTime.fillStyle(0x00ff44);
    gfxTime.fillCircle(16, 16, 16);
    gfxTime.generateTexture('time_apple2', 32, 32);
    gfxTime.destroy();

    const gfxBig = this.make.graphics({ x: 0, y: 0, add: false });
    gfxBig.fillStyle(0xff4400);
    gfxBig.fillCircle(16, 16, 16);
    gfxBig.generateTexture('big_apple2', 32, 32);
    gfxBig.destroy();

    this.timeApples = this.physics.add.staticGroup();
    this.bigApples  = this.physics.add.staticGroup();

    const itemsLayer = map.getObjectLayer('Capa de Objetos 1');
    if (itemsLayer) {
        itemsLayer.objects.forEach(obj => {
            const kind = obj.type || obj.class || '';
            if (kind === 'time_apple') {
                this.timeApples.create(obj.x, obj.y, 'time_apple2').setScale(0.8).refreshBody();
            } else if (kind === 'big_apple') {
                this.bigApples.create(obj.x, obj.y, 'big_apple2').setScale(0.8).refreshBody();
            }
        });
    }

    this.physics.add.overlap(this.player, this.timeApples, this.collectTimeApple, null, this);
    this.physics.add.overlap(this.player, this.bigApples,  this.collectBigApple,  null, this);

    this.timeLeft = 60;
    this.timerText = this.add.text(16, 16, 'TIEMPO: 15', {
        fontSize: '28px', fill: '#ff4400', fontFamily: 'monospace', fontWeight: 'bold', stroke: '#000000', strokeThickness: 4
    }).setScrollFactor(0);

    this.add.text(400, 16, '🔥 NIVEL 2', {
        fontSize: '22px', fill: '#ffaa00', fontFamily: 'monospace', fontWeight: 'bold', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5, 0).setScrollFactor(0);

    this.timeEvent = this.time.addEvent({
        delay: 1000, callback: this.updateTimer, callbackScope: this, loop: true
    });

    // ── DETECTAR ZONA DE VICTORIA (META) ─────────────────────────────
this.winZones = this.physics.add.staticGroup();

    const metaLayer = map.getObjectLayer('Capa de Objetos Meta');
    if (metaLayer) {
        metaLayer.objects.forEach(obj => {
            const kind = obj.type || obj.class || '';
            if (kind === 'meta_zone') {
                // Creamos un objeto invisible en la física para usarlo de detector
                let zone = this.add.zone(obj.x + (obj.width / 2), obj.y + (obj.height / 2), obj.width, obj.height);
                this.physics.add.existing(zone, true); // true lo hace estático
                this.winZones.add(zone);
            }
        });
    }

    // Cuando el jugador toque la zona invisible, ¡GANA!
    this.physics.add.overlap(this.player, this.winZones, this.playerWin, null, this);

        // ── CÁMARA Y CONTROLES ───────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

    this.cursors = this.input.keyboard.createCursorKeys();

    // ── MÚSICA ───────────────────────────────────────────────────────
    this.music = this.sound.add('music_lava', { loop: true, volume: 0.5 });
    this.music.play();
    this.events.on('shutdown', () => this.music.stop());

    // 1. Creamos una variable para contar los saltos actuales
    this.jumpCount = 0;

    // 2. Escuchamos el teclado para la barra espaciadora (se ejecuta una sola vez por pulsación)
    this.input.keyboard.on('keydown-SPACE', () => {
        if (this.isDead) return;

        // Si el jugador está tocando el suelo, reiniciamos el contador a 0 justo antes de saltar
        if (this.player.body.blocked.down) {
            this.jumpCount = 0;
        }

        // Permitimos el salto si lleva menos de 2 saltos realizados
        if (this.jumpCount < 2) {
            this.player.setVelocityY(-350); // Fuerza del salto
            this.jumpCount++;               // Sumamos un salto al contador
            console.log("Salto número:", this.jumpCount);
        }
    });
}

    collectTimeApple(player, apple) {
        apple.destroy();
        this.timeLeft += 10;
        this.timerText.setText('TIEMPO: ' + this.timeLeft);
        this.timerText.setStyle({ fill: '#00ff00' });
        this.time.delayedCall(500, () => this.timerText.setStyle({ fill: '#ff4400' }));
        this.showFloatingText(player.x, player.y - 40, '+10s ⏱', '#00ff00');
    }

    collectBigApple(player, apple) {
        apple.destroy();
        if (!this.playerBig) {
            this.playerBig = true;
            this.player.setScale(this.player.scaleX * 2);
            this.time.delayedCall(5000, () => {
                this.player.setScale(this.player.scaleX / 2);
                this.playerBig = false;
            });
        }
        this.showFloatingText(player.x, player.y - 40, '¡GRANDE! 🔴', '#ffaa00');
    }

    showFloatingText(x, y, message, color) {
        const txt = this.add.text(x, y, message, {
            fontSize: '22px', fill: color,
            fontFamily: 'monospace', fontWeight: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);
        this.tweens.add({
            targets: txt, y: y - 50, alpha: 0,
            duration: 800, onComplete: () => txt.destroy()
        });
    }

    playerWin() {
    if (this.isDead) return;
    this.isDead = true; // Bloquea muertes o movimientos adicionales

    if (this.timeEvent) this.timeEvent.destroy(); // Detiene el temporizador de 15s

    // Detener al jugador por completo
    this.player.setVelocity(0, 0);
    this.player.body.setEnable(false);
    this.player.setTint(0x00ff00); // Tinte verde de victoria

    // ── CARTEL DE FELICITACIONES ─────────────────────────────────────
    // Fondo oscuro translúcido para que resalte el texto
    let overlay = this.add.graphics().setScrollFactor(0);
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    // Texto de felicitaciones principal
    this.add.text(400, 250, '🎉 ¡NIVEL COMPLETADO!\nEscapaste de la lava con éxito', {
        fontSize: '32px',
        fill: '#00ff00',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0);

    // Botón interactivo para Volver al Menú Principal
    let volverBtn = this.add.text(400, 400, 'Volver al Menú', {
        fontSize: '20px',
        fill: '#ffffff',
        backgroundColor: '#ff4400',
        padding: { x: 15, y: 10 },
        fontFamily: 'monospace',
        fontWeight: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });

    // Efecto visual hover para el botón
    volverBtn.on('pointerover', () => volverBtn.setStyle({ fill: '#220e76' }));
    volverBtn.on('pointerout', () => volverBtn.setStyle({ fill: '#ffffff' }));

    // Acción para cambiar de escena al pulsarlo
    volverBtn.on('pointerdown', () => {
        this.scene.start('MainMenuScene'); // Cambia al nombre exacto de tu escena de menú
    });
}

    updateTimer() {
        this.timeLeft--;
        this.timerText.setText('TIEMPO: ' + this.timeLeft);
        if (this.timeLeft <= 0) this.playerDie();
    }

    playerDie() {
        if (this.isDead) return;
        this.isDead = true;
        this.player.setVelocity(0, 0);
        this.player.body.setEnable(false);
        this.player.setTint(0xff0000);
        this.cameras.main.shake(300, 0.02);
        this.time.delayedCall(1000, () => {
            this.isDead = false;
            this.scene.restart();
        });
    }

    update() {
        if (this.isDead) return;
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
    }
}