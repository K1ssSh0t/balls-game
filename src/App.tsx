import React, { useRef, useEffect } from 'react';
import Phaser from 'phaser';
//import './style.css'; // Asegúrate de que este archivo CSS esté accesible en tu proyecto React

// Definición del tipo Fruit
type Fruit = {
  name: string;
  radius: number;
};

// Array de frutas
const fruits: Fruit[] = [
  { name: 'fruit1', radius: 30 },
  { name: 'fruit2', radius: 35 },
  { name: 'fruit3', radius: 40 },
  { name: 'fruit4', radius: 50 },
  { name: 'fruit5', radius: 65 },
  { name: 'fruit6', radius: 70 },
  { name: 'fruit7', radius: 80 },
  { name: 'fruit8', radius: 90 },
  { name: 'fruit9', radius: 100 },
  { name: 'fruit10', radius: 110 },
  { name: 'fruit11', radius: 120 },
];

// La escena principal del juego (tu código original)
class Main extends Phaser.Scene {
  score = 0;
  dropper!: Phaser.GameObjects.Image;
  group!: Phaser.GameObjects.Group;
  ceiling!: MatterJS.BodyType;
  gameOver = false;
  renderTexture!: Phaser.GameObjects.RenderTexture;

  constructor() {
    super({ key: 'Main' });
  }

  preload() {
    // Asegúrate de que estas imágenes estén en tu carpeta 'public' o
    // configuradas para ser servidas correctamente en tu proyecto React.
    this.load.image('headstone', 'Headstone.png');
    this.load.image('newgame', 'New Game Button.png');

    for (let i = 0; i <= 9; i++) {
      this.load.image(`${i}`, `${i}.png`);
    }

    for (const fruit of fruits) {
      this.load.image(`${fruit.name}`, `${fruit.name}.png`);
    }
  }

  updateDropper(fruit: Fruit) {
    this.dropper
      .setTexture(fruit.name)
      .setName(fruit.name)
      .setDisplaySize(fruit.radius * 2, fruit.radius * 2)
      .setY(fruit.radius + 205);
    this.setDropperX(this.input.activePointer.x);

    this.group.getChildren().forEach((gameObject) => {
      if (gameObject instanceof Phaser.GameObjects.Image) {
        gameObject.postFX.clear();
        if (gameObject.name === fruit.name) {
          gameObject.postFX.addShine();
        }
      }
    });
  }

  setDropperX(x: number) {
    const p = 65;
    const r = this.dropper.displayWidth / 2;
    const width = +this.game.config.width;
    if (x < r + p) {
      x = r + p;
    } else if (x > width - r - p) {
      x = width - r - p;
    }
    this.dropper.setX(x);
  }

  addFruit(x: number, y: number, fruit: Fruit) {
    return this.matter.add
      .image(x, y, fruit.name)
      .setName(fruit.name)
      .setDisplaySize(fruit.radius * 2, fruit.radius * 2)
      .setCircle(fruit.radius)
      .setFriction(0.005)
      .setBounce(0.2)
      .setDepth(-1)
      .setOnCollideWith(this.ceiling, () => {
        this.events.emit('ceilinghit');
      });
  }

  drawScore() {
    this.renderTexture.clear();
    const scoreStr = this.score.toString();
    const textWidth = scoreStr
      .split('')
      .reduce((acc, c) => acc + this.textures.get(c).get().width, 0);
    let x = this.renderTexture.width / 2 - textWidth / 2;
    for (const c of scoreStr) {
      this.renderTexture.drawFrame(c, undefined, x, 0);
      x += this.textures.get(c).get().width;
    }
  }

  create() {
    const width = +this.game.config.width;
    const height = +this.game.config.height;

    this.add
      .nineslice(0, 0, 'headstone')
      .setOrigin(0)
      .setDisplaySize(width, height)
      .setPipeline('Light2D')
      .setDepth(-2);

    this.matter.world.setBounds(65, 0, width - 130, height - 1);
    this.group = this.add.group();

    const light = this.lights
      .addLight(this.input.activePointer.x, this.input.activePointer.y, 1000, 0x99ffff, 0.75)
      .setScrollFactor(0);
    this.lights.enable().setAmbientColor(0xdddddd);

    const emitter = this.add.particles(0, 0, fruits[0].name, {
      lifespan: 1000,
      speed: { min: 200, max: 350 },
      scale: { start: 0.1, end: 0 },
      rotate: { start: 0, end: 360 },
      alpha: { start: 1, end: 0 },
      gravityY: 200,
      emitting: false,
    });

    this.renderTexture = this.add
      .renderTexture(width / 2, 150, width, 100)
      .setScale(0.8);
    this.drawScore();

    const button = this.add
      .image(width / 2, height / 2, 'newgame')
      .setScale(0.4)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);
    button.postFX.addGlow(0x000000, 0.75);
    button.on('pointerover', () => {
      this.tweens.add({ targets: button, scale: 0.425, ease: 'Linear', duration: 100 });
    });
    button.on('pointerout', () => {
      this.tweens.add({ targets: button, scale: 0.4, ease: 'Linear', duration: 100 });
    });
    button.on('pointerup', () => {
      this.score = 0;
      this.gameOver = false;
      this.scene.restart();
    });

    this.dropper = this.add.image(this.input.activePointer.x, 0, fruits[0].name);
    const glow = this.dropper.postFX.addGlow(0x99ddff);
    this.tweens.addCounter({
      yoyo: true,
      repeat: -1,
      from: 1,
      to: 3,
      duration: 1000,
      onUpdate: (tween) => {
        glow.outerStrength = tween.getValue() ?? 1;
      },
    });
    this.updateDropper(fruits[0]);

    this.ceiling = this.matter.add.rectangle(width / 2, 100, width, 200, { isStatic: true });

    const line = this.add
      .rectangle(160, 200, width - 320, 2, 0xccccff)
      .setOrigin(0)
      .setAlpha(0.1)
      .setDepth(-2);
    line.postFX.addShine();
    line.postFX.addGlow();

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.setDropperX(pointer.x);
      light.setPosition(pointer.x, pointer.y);
    });

    this.input.on('pointerup', () => {
      if (!this.dropper.visible || this.gameOver) {
        return;
      }

      this.dropper.setVisible(false);
      this.time.delayedCall(500, () => this.dropper.setVisible(!this.gameOver));

      const currentFruit = fruits.find((fruit) => fruit.name === this.dropper.name)!;
      const gameObject = this.addFruit(this.dropper.x, this.dropper.y, currentFruit);
      this.group.add(gameObject);

      const nextFruit = fruits[Math.floor(Math.random() * 5)];
      this.updateDropper(nextFruit);
    });

    this.matter.world.on(
      'collisionstart',
      (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
        for (const pair of event.pairs) {
          // Asegurarnos de que ambos GameObjects existen antes de acceder a 'name'
          const gameObjectA = pair.bodyA.gameObject as Phaser.GameObjects.Image;
          const gameObjectB = pair.bodyB.gameObject as Phaser.GameObjects.Image;

          if (gameObjectA && gameObjectB && gameObjectA.name === gameObjectB.name) {
            const fruitIndex = fruits.findIndex((fruit) => fruit.name === gameObjectA.name);

            if (fruitIndex === -1) {
              continue;
            }

            this.score += (fruitIndex + 1) * 2;
            this.drawScore();

            gameObjectA.destroy();
            gameObjectB.destroy();

            emitter.setTexture(fruits[fruitIndex].name);
            emitter.emitParticleAt(pair.collision.supports[0].x, pair.collision.supports[0].y, 10);

            const newFruit = fruits[fruitIndex + 1];

            if (!newFruit) {
              continue;
            }

            const newGameObject = this.addFruit(
              pair.collision.supports[0].x,
              pair.collision.supports[0].y,
              newFruit
            );
            this.group.add(newGameObject);

            return;
          }
        }
      }
    );

    this.events.on('ceilinghit', () => {
      this.gameOver = true;
      button.setVisible(true);
      this.dropper.setVisible(false);
    });
  }
}

// Configuración del juego Phaser
const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // O Phaser.WEBGL o Phaser.CANVAS
  scene: [Main],
  width: 600,
  height: 1000,
  scale: {
    mode: Phaser.Scale.ScaleModes.FIT,
    autoCenter: Phaser.Scale.Center.CENTER_HORIZONTALLY,
  },
  transparent: true,
  physics: {
    default: 'matter',
    matter: {
      debug: false,
      // Habilitar 'enableSleeping' puede ayudar con el rendimiento
      enableSleeping: true,
    },
  },
  // parent: 'phaser-game-container', // Se establecerá dinámicamente
};

// Componente de React
const App: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current && !gameInstance.current) {
      // Crea la instancia del juego Phaser
      gameInstance.current = new Phaser.Game({
        ...phaserConfig,
        parent: gameRef.current, // Asigna el div como padre
      });
    }

    // Función de limpieza para destruir el juego cuando el componente se desmonte
    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, []); // El array vacío asegura que esto se ejecute solo una vez (al montar)

  return <div ref={gameRef} id="phaser-game-container" className='h-[100vh]' />;
};

export default App; 