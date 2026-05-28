export class CaveScene extends Phaser.Scene {
    constructor() {
        super('LevelOneScene');
    }

    preload() {
        // Aquí cargarás tu JSON de Tiled y tus imágenes más adelante
    }

    create() {
        this.add.text(400, 300, 'Escenario 1: Cueva\n(Aquí se renderizará tu mapa de Tiled)', { 
            fontSize: '24px', 
            fill: '#00ff00', 
            align: 'center',
            fontFamily: 'monospace' 
        }).setOrigin(0.5);

        // Botón rápido para regresar al menú
        let volver = this.add.text(400, 500, 'Volver al Menú', { fontSize: '16px', fill: '#fff' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        volver.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }
}