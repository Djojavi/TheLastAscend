// =======================================================================
// LA ESCENA DEL JUEGO: EscenaLaboratorio
// =======================================================================
class EscenaLaboratorio extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaLaboratorio' });
    }

    preload() {
        // 1. Carga el mapa JSON y sus tilesets correspondientes
        this.load.tilemapTiledJSON('mapa_lab', 'assets/laboratorio.json');
        this.load.image('tiles_artifacts', 'assets/artifacts.png');
        this.load.image('walls', 'assets/walls.png'); // Cargamos walls por si tu JSON lo requiere

        // 2. CORRECCIÓN DE LA LLAVE: Usamos el archivo individual key.png
        this.load.image('key_img', 'assets/key.png'); 

        // 3. CORRECCIÓN DEL CIENTÍFICO: Asset webp directo sin subdivisiones
        this.load.image('cientifico_prota', 'assets/cientifico.webp');
    }

    create() {
        // 1. Inicializar el mapa
        const map = this.make.tilemap({ key: 'mapa_lab' });
        
        // 2. Vincular los conjuntos de patrones con sus imágenes reales
        const tilesetArtifacts = map.addTilesetImage('artifacts', 'tiles_artifacts');
        const tilesetImages = map.addTilesetImage('images', 'key_img'); 
        const tilesetWalls = map.addTilesetImage('walls', 'walls');

        // Reunimos todos los tilesets cargados para las capas
        const capasPreparadas = [tilesetArtifacts, tilesetImages, tilesetWalls];

        // 3. Crear las capas en el orden correcto
        const capaSuelo = map.createLayer('suelo', capasPreparadas, 0, 0);
        const capaColisiones = map.createLayer('colisiones', capasPreparadas, 0, 0);

        // Configurar los límites reales del mundo usando las dimensiones de Tiled
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // Activamos colisiones en la capa designada
        if (capaColisiones) {
            capaColisiones.setCollisionByExclusion([-1]);
        }

        // =======================================================================
        // MUESTREO Y EXTRACCIÓN DE OBJETOS DESDE TILED (Sensible a Mayúsculas)
        // =======================================================================
        const spawnPlayer = map.findObject('objetos', obj => obj.name === 'player');
        // Tu Tiled muestra el nombre como "Key" con mayúscula inicial
        const spawnKey = map.findObject('objetos', obj => obj.name === 'Key' || obj.name === 'key');
        const spawnPuerta = map.findObject('objetos', obj => obj.name === 'puerta');

        // 4. Instanciar la Puerta Física
        if (spawnPuerta) {
            this.puerta = this.physics.add.sprite(spawnPuerta.x + 16, spawnPuerta.y - 16, null);
            this.puerta.setSize(32, 32); 
            this.puerta.setImmovable(true);
            this.puerta.setVisible(false); 
        }

        // 5. Instanciar la Llave en su posición exacta
        if (spawnKey) {
            this.key = this.physics.add.sprite(spawnKey.x + 16, spawnKey.y - 16, 'key_img');
            this.key.setSize(32, 32);
            this.key.setDisplaySize(32, 32);
        } else {
            // Respawn de emergencia si Tiled no lee el objeto
            this.key = this.physics.add.sprite(700, 100, 'key_img');
            this.key.setSize(32, 32);
            this.key.setDisplaySize(32, 32);
        }
        
        // 6. Instanciar al Científico con su sprite correcto
        if (spawnPlayer) {
            this.cientifico = this.physics.add.sprite(spawnPlayer.x + 16, spawnPlayer.y - 16, 'cientifico_prota');
        } else {
            this.cientifico = this.physics.add.sprite(150, 150, 'cientifico_prota'); 
        }
        
        // Ajustamos la caja de impacto del científico a un tamaño de bloque estándar
        this.cientifico.setSize(32, 32);
        this.cientifico.setDisplaySize(32, 32);
        this.cientifico.setCollideWorldBounds(true); 

        // Estado inicial de la misión
        this.tieneLlave = false;
        this.mensajePuertaMostrado = false;

        // =======================================================================
        // ENLACE DE INTERACCIONES Y COLISIONES
        // =======================================================================
        if (capaColisiones) {
            this.physics.add.collider(this.cientifico, capaColisiones);
        }
        if (this.puerta) {
            this.physics.add.collider(this.cientifico, this.puerta, this.intentarAbrirPuerta, null, this);
        }
        if (this.key) {
            // Usamos overlap para que al tocar la llave se active la recolección
            this.physics.add.overlap(this.cientifico, this.key, this.recogerLlave, null, this);
        }

        // Controles de movimiento
        this.cursors = this.input.keyboard.createCursorKeys();

        // Configuración de la Cámara para el seguimiento del jugador
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.cientifico, true, 0.1, 0.1);
    }

    update() {
        this.cientifico.setVelocity(0);
        const velocidad = 150;

        if (this.cursors.left.isDown) {
            this.cientifico.setVelocityX(-velocidad);
        } else if (this.cursors.right.isDown) {
            this.cientifico.setVelocityX(velocidad);
        }

        if (this.cursors.up.isDown) {
            this.cientifico.setVelocityY(-velocidad);
        } else if (this.cursors.down.isDown) {
            this.cientifico.setVelocityY(velocidad);
        }

        // Reseteo del trigger de proximidad para el mensaje de la puerta bloqueada
        if (this.puerta && Phaser.Math.Distance.Between(this.cientifico.x, this.cientifico.y, this.puerta.x, this.puerta.y) > 50) {
            this.mensajePuertaMostrado = false;
        }
    }

    recogerLlave(cientifico, key) {
        key.destroy(); 
        this.tieneLlave = true;
        console.log("¡Tienes la llave! Dirígete a la salida.");
    }

    intentarAbrirPuerta(cientifico, puerta) {
        if (this.tieneLlave) {
            console.log("¡Puerta abierta! Laboratorio completado.");
            puerta.destroy(); 
        } else if (!this.mensajePuertaMostrado) {
            console.log("Acceso denegado. Se necesita la tarjeta llave.");
            this.mensajePuertaMostrado = true; 
        }
    }
}