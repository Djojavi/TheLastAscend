class CaveScene extends Phaser.Scene {
    constructor() {
        super('CaveScene');
    }

    preload() {
        // El mapa lúgubre que ya tienes exportado
        this.load.tilemapTiledJSON('mapa_cueva', 'assets/cave_map.json');

        // 1. Cargamos la imagen que usaste para dibujar las plataformas/bloques
        this.load.image('texturas_bloques', 'assets/free.png');

        // 2. Cargamos la imagen que usaste como fondo visual
        this.load.image('fondo_oscuro', 'assets/background4a.png');

        // El protagonista
        // Change this in preload() to test if the image shows uffp at all:
        this.load.image('oficinista', 'assets/oficinista.png');
    }

    create() {
        // Paso A: Crear el mapa lógico del JSON
        const map = this.make.tilemap({ key: 'mapa_cueva' });

        // 1. DIBUJAR EL FONDO PRIMERO (Para que quede detrás de todo)
        // Lo centramos en el origen (0,0) y lo hacemos del tamaño del mapa de Tiled
        let bg = this.add.image(0, 0, 'fondo_oscuro').setOrigin(0, 0);
        // Opcional: Si tu fondo es más pequeño que el mapa, puedes hacer que se estire:
        bg.setDisplaySize(map.widthInPixels, map.heightInPixels);
        const nombreInternoTiled = map.tilesets[0].name;
        // Paso B: Vincular la imagen de los bloques con Tiled
        // RECUERDA: 'Nombre_En_Tiled' es el nombre exacto de la pestaña "Tilesets" dentro de Tiled
        const tileset = map.addTilesetImage(nombreInternoTiled, 'texturas_bloques');

        // 2. DIBUJAR LOS BLOQUES ENCIMA DEL FONDO
        // 'ground' es el nombre de la capa donde dibujaste tus plataformas sólidas en Tiled
        const sueloLayer = map.createLayer('ground', tileset, 0, 0);

        // Activar colisiones en las plataformas
        sueloLayer.setCollisionByExclusion([-1]);

        // 3. CREAR AL JUGADOR (Caminará por delante del fondo y sobre los bloques)
        this.player = this.physics.add.sprite(100, 100, 'oficinista');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.15);

        // Colisión física entre el oficinista y las plataformas
        this.physics.add.collider(this.player, sueloLayer, (player, tile) => {
            let isDeadly = false;
            let isWin = false;

            if (tile.properties) {
                // Evaluamos si es un bloque mortal
                if (tile.properties.deadly !== undefined) isDeadly = tile.properties.deadly;
                else if (tile.properties.customproperties && tile.properties.customproperties.deadly !== undefined) {
                    isDeadly = tile.properties.customproperties.deadly;
                }

                // Evaluamos si es el bloque de victoria
                if (tile.properties.win !== undefined) isWin = tile.properties.win;
                else if (tile.properties.customproperties && tile.properties.customproperties.win !== undefined) {
                    isWin = tile.properties.customproperties.win;
                }
            }

            // Ejecutar la acción lógica correspondiente
            if (isDeadly) {
                this.playerDie();
            } else if (isWin) {
                this.playerWin();
            }
        }, null, this);

        this.timeLeft = 20; // Inicializamos los 20 segundos

        // Creamos el elemento visual del texto fijado en la pantalla
        this.timerText = this.add.text(16, 16, 'TIEMPO: 20', {
            fontSize: '28px',
            fill: '#ff0000', // Rojo de alerta
            fontFamily: 'monospace',
            fontWeight: 'bold'
        });

        // Importante: Hacemos que el texto siga a la cámara para que no se quede estancado al inicio del mapa
        this.timerText.setScrollFactor(0);

        // Creamos el bucle de tiempo: se ejecuta cada 1000ms (1 segundo) de manera infinita
        this.timeEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        // Ajustar cámaras y teclado (lo que ya tenías)
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        this.cursors = this.input.keyboard.createCursorKeys();
    }
    playerWin() {
        // 1. Detenemos el reloj de inmediato
        if (this.timeEvent) {
            this.timeEvent.destroy();
        }

        // 2. Apagamos las físicas del jugador para que no se mueva más
        this.player.setVelocity(0, 0);
        this.player.body.setEnable(false);

        // 3. Pintamos al personaje de verde brillante para indicar éxito
        this.player.setTint(0x00ff00);

        // 4. Desplegamos el aviso de victoria centrado en la pantalla
        let winText = this.add.text(400, 300, '¡NIVEL COMPLETADO!\nLograste escapar...', {
            fontSize: '40px',
            fill: '#00ff00',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        // Lo fijamos a la cámara para que se vea directo en el centro del HUD
        winText.setScrollFactor(0);

        // 5. Reiniciamos el nivel tras 3 segundos (más adelante aquí cargarás la escena 2)
        this.time.delayedCall(3000, () => {
            this.scene.restart();
        });
    }

    updateTimer() {
        this.timeLeft--; // Restamos 1 al contador
        this.timerText.setText('TIEMPO: ' + this.timeLeft); // Actualizamos el texto en pantalla

        // Si el tiempo llega a cero, el oficinista muere por falta de tiempo
        if (this.timeLeft <= 0) {
            this.playerDie();
        }
    }

    playerDie() {
        // Disable player physics so they stop moving/falling
        this.player.setVelocity(0, 0);
        this.player.body.setEnable(false);

        // Turn the player red to visually show damage
        this.player.setTint(0xff0000);

        // Camera shake effect for impact (duration in ms, intensity)
        this.cameras.main.shake(300, 0.02);

        // Wait 1 second (1000ms), then restart the scene
        this.time.delayedCall(1000, () => {
            this.scene.restart();
        });
    }

    update() {
        // Movimiento horizontal básico
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
        } else {
            this.player.setVelocityX(0);
        }

        // Mecánica de salto (Detecta si estás pisando el suelo de Tiled)
        if (this.cursors.up.isDown && this.player.body.blocked.down) {
            this.player.setVelocityY(-350);
        }
    }
}

// Configuración de arranque del juego
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: true // Te permite ver las líneas de colisión aunque falten sprites de arte finales
        }
    },
    scene: [CaveScene]
};

const game = new Phaser.Game(config);