class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    preload() {
        this.load.image('bg_wood', 'assets/bg-wood.jpg');
        this.load.audio('music_menu', 'assets/sounds/menu.mp3');
    }

    create() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        // ── FONDO ────────────────────────────────────────────────────────
        this.add.image(0, 0, 'bg_wood').setOrigin(0, 0).setDisplaySize(W, H);

        // Capa oscura semitransparente para mejorar legibilidad
        this.add.graphics()
            .fillStyle(0x000000, 0.45)
            .fillRect(0, 0, W, H);

        // ── TÍTULO ───────────────────────────────────────────────────────
        this.add.text(W / 2, 140, 'THE LAST ASCEND', {
            fontSize: '52px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 7
        }).setOrigin(0.5);

        this.add.text(W / 2, 210, 'EPN · Proyecto de Juegos', {
            fontSize: '18px',
            fill: '#ffcc00',
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // ── BOTÓN INICIAR ────────────────────────────────────────────────
        const startBtn = this.add.text(W / 2, 340, '▶  INICIAR JUEGO', {
            fontSize: '30px',
            fill: '#ffffff',
            backgroundColor: '#1a0a5e',
            padding: { x: 24, y: 14 },
            fontFamily: 'monospace',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        startBtn.on('pointerover', () => startBtn.setStyle({ fill: '#ffcc00', backgroundColor: '#2e1a99' }));
        startBtn.on('pointerout',  () => startBtn.setStyle({ fill: '#ffffff', backgroundColor: '#1a0a5e' }));
        startBtn.on('pointerdown', () => this.scene.start('CaveScene'));

        // ── MÚSICA ───────────────────────────────────────────────────────
        this.music = this.sound.add('music_menu', { loop: true, volume: 0.5 });
        this.music.play();
        this.events.on('shutdown', () => this.music.stop());

        // ── INSTRUCCIONES ────────────────────────────────────────────────
        this.add.text(W / 2, 450, '← → Moverse   ↑ / ESPACIO Saltar', {
            fontSize: '16px',
            fill: '#cccccc',
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.add.text(W / 2, 480, ' Evita la lava · ¡Escapa!', {
            fontSize: '15px',
            fill: '#aaaaaa',
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
    }
}