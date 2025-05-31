import React, { useRef, useEffect, useState } from 'react';
import Phaser from 'phaser';
// Asegúrate de tener Tailwind CSS configurado en tu proyecto React.
// No necesitas importar './style.css' si toda tu estilización es con Tailwind,
// a menos que contenga estilos base o específicos que quieras mantener.
// import './style.css'; 

// --- El tipo Fruit y el array fruits permanecen igual ---
type Fruit = {
  name: string;
  radius: number;
};

const fruits: Fruit[] = [
  { name: 'fruit1', radius: 30 }, { name: 'fruit2', radius: 35 },
  { name: 'fruit3', radius: 40 }, { name: 'fruit4', radius: 50 },
  { name: 'fruit5', radius: 65 }, { name: 'fruit6', radius: 70 },
  { name: 'fruit7', radius: 80 }, { name: 'fruit8', radius: 90 },
  { name: 'fruit9', radius: 100 }, { name: 'fruit10', radius: 110 },
  { name: 'fruit11', radius: 120 },
];

// --- La clase Main de Phaser permanece igual ---
class Main extends Phaser.Scene {
  score = 0;
  dropper!: Phaser.GameObjects.Image;
  group!: Phaser.GameObjects.Group;
  ceiling!: MatterJS.BodyType;
  gameOver = false;
  renderTexture!: Phaser.GameObjects.RenderTexture;
  nextFruit!: Fruit;

  constructor() {
    super({ key: 'Main' });
  }

  preload() {
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
      .setBounce(0.5)
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

    // Draw box-like background with borders matching collision boundaries
    const graphics = this.add.graphics();
    // Main background
    graphics.fillStyle(0x222222, 1);
    graphics.fillRect(0, 0, width, height);

    // Play area background (lighter inside the box)
    graphics.fillStyle(0x333333, 1);
    graphics.fillRect(65, 100, width - 130, height - 100);

    // Draw borders to match collision boundaries
    graphics.fillStyle(0x444444, 1);
    // Top border
    graphics.fillRect(65, 100, width - 130, 5);
    // Left border
    graphics.fillRect(65, 100, 5, height - 100);
    // Right border
    graphics.fillRect(width - 65, 100, 5, height - 100);
    // Bottom border
    graphics.fillRect(65, height - 5, width - 130, 5);
    graphics.setPipeline('Light2D');

    graphics.setDepth(-2);

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

    this.nextFruit = fruits[Math.floor(Math.random() * 5)];
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
    this.game.events.emit('nextFruitChanged', this.nextFruit);

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

      this.updateDropper(this.nextFruit);
      this.nextFruit = fruits[Math.floor(Math.random() * 5)];
      this.game.events.emit('nextFruitChanged', this.nextFruit);
    });

    this.matter.world.on(
      'collisionstart',
      (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
        for (const pair of event.pairs) {
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

// --- La configuración de Phaser permanece igual ---
const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
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
      enableSleeping: true,
    },
  },
};

// Componente de React (Modificado con Tailwind)
const App: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);
  const [nextFruit, setNextFruit] = useState<Fruit | null>(null);

  const handleRestart = () => {
    if (gameInstance.current) {
      const scene = gameInstance.current.scene.getScene('Main') as Main;
      scene.score = 0;
      scene.gameOver = false;
      scene.scene.restart();
    }
  };

  useEffect(() => {
    if (gameRef.current && !gameInstance.current) {

      const handleNextFruit = (fruit: Fruit) => {
        setNextFruit(fruit);
      };

      gameInstance.current = new Phaser.Game({
        ...phaserConfig,
        parent: gameRef.current,
      });

      gameInstance.current.events.on('nextFruitChanged', handleNextFruit);
    }

    return () => {
      if (gameInstance.current) {
        gameInstance.current.events.off('nextFruitChanged');
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, []);

  return (
    <div className='grid grid-cols-3 items-center justify-center place-items-center h-screen'>
      <div className="  items-center w-50 p-5 border-2 mt-4 border-gray-300 rounded-lg text-center bg-gray-50 shadow-md">
        <h4 className="text-lg font-semibold mb-3 text-gray-700">Progresión de Frutas</h4>
        <div className="grid grid-cols-2 gap-2">
          {fruits.map((fruit, index) => (
            <div key={fruit.name} className="flex items-center gap-2 justify-center ">
              <span className="text-xs text-gray-500">{index + 1}.</span>
              <img
                src={`/${fruit.name}.png`}
                alt={fruit.name}
                className="w-[50px] h-[50px] object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      <div className=" justify-center items-start gap-5 h-[100vh] ">

        {/* Contenedor del juego Phaser */}
        <div ref={gameRef} id="phaser-game-container" className='h-[100vh]' />


      </div>
      {/* Contenedor para la siguiente fruta con clases de Tailwind */}
      <div className="w-50 p-5 border-2 mt-4 border-gray-300 rounded-lg text-center bg-gray-50 shadow-md">
        <h4 className="text-lg font-semibold mb-3 text-gray-700">Siguiente Fruta:</h4>
        {nextFruit ? (
          <img
            src={`/${nextFruit.name}.png`}
            alt={`Siguiente fruta: ${nextFruit.name}`}
            // Usamos style para tamaños dinámicos, pero añadimos clases de Tailwind
            className="block mx-auto max-w-[50px] max-h-[50px]" // Centra la imagen

          />
        ) : (
          <p className="text-gray-500">...</p>
        )}

        <button
          onClick={handleRestart}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Reiniciar Juego
        </button>
      </div>
    </div>
  );
};

export default App;