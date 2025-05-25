import React, { useEffect, useRef, useState } from 'react';
import { Engine, Render, World, Bodies, Events, Runner, Mouse, MouseConstraint, Body } from 'matter-js';
import type { FruitType, GameState } from '../types/game';
import { FRUITS, GAME_CONFIG, getRandomStartingFruit, getNextFruitId } from '../utils/gameLogic';

const Game: React.FC = () => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Engine | null>(null);
    const renderRef = useRef<Render | null>(null);
    const runnerRef = useRef<Runner | null>(null);
    const dropPositionRef = useRef(GAME_CONFIG.width / 2);
    const nextFruitRef = useRef(getRandomStartingFruit()); // Add this new ref

    const [gameState, setGameState] = useState<GameState>({
        score: 0,
        gameOver: false,
        nextFruit: nextFruitRef.current, // Initialize with ref value
        level: 1
    });

    useEffect(() => {
        if (!sceneRef.current) return;

        initializeGame();

        return cleanup;
    }, []);

    const initializeGame = () => {
        // Crear motor de física
        const engine = Engine.create();
        engine.world.gravity.y = GAME_CONFIG.gravity;
        engineRef.current = engine;

        // Crear renderer
        const render = Render.create({
            element: sceneRef.current!,
            engine: engine,
            options: {
                width: GAME_CONFIG.width,
                height: GAME_CONFIG.height,
                wireframes: false,
                background: 'transparent',
                showAngleIndicator: false,
                showVelocity: false
            }
        });
        renderRef.current = render;

        createWalls(engine);
        setupControls(render, engine);
        setupCollisionDetection(engine);

        // Iniciar simulación
        const runner = Runner.create();
        runnerRef.current = runner;
        Runner.run(runner, engine);
        Render.run(render);
    };

    const createWalls = (engine: Engine) => {
        const { width, height, wallThickness } = GAME_CONFIG;

        const ground = Bodies.rectangle(width / 2, height - 10, width, 20, {
            isStatic: true,
            render: { fillStyle: '#8B4513' }
        });

        const leftWall = Bodies.rectangle(10, height / 2, wallThickness, height, {
            isStatic: true,
            render: { fillStyle: '#8B4513' }
        });

        const rightWall = Bodies.rectangle(width - 10, height / 2, wallThickness, height, {
            isStatic: true,
            render: { fillStyle: '#8B4513' }
        });

        // Agregar línea de game over (invisible para la física pero visible para el jugador)
        const gameOverLine = Bodies.rectangle(width / 2, GAME_CONFIG.dropLineY + 50, width - 40, 2, {
            isStatic: true,
            isSensor: true,
            render: {
                fillStyle: 'rgba(255, 0, 0, 0.5)',
                opacity: 0.5
            }
        });

        // Agregar guía de drop
        const dropGuide = Bodies.rectangle(width / 2, GAME_CONFIG.dropLineY, 2, 20, {
            isStatic: true,
            isSensor: true,
            render: {
                fillStyle: 'rgba(0, 255, 0, 0.5)'
            }
        });

        World.add(engine.world, [ground, leftWall, rightWall, gameOverLine, dropGuide]);
    };

    const setupControls = (render: Render, _engine: Engine) => {
        // const mouse = Mouse.create(render.canvas);
        // const mouseConstraint = MouseConstraint.create(engine, {
        //     mouse: mouse,
        //     constraint: {
        //         stiffness: 0.2,
        //         render: { visible: false }
        //     }
        // });
        // World.add(engine.world, mouseConstraint);

        // Controles de mouse
        render.canvas.addEventListener('mousemove', handleMouseMove);
        render.canvas.addEventListener('click', handleClick);
        render.canvas.addEventListener('wheel', (e) => e.preventDefault());
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!renderRef.current || !engineRef.current) return;

        // Obtener la posición del mouse relativa al canvas
        const rect = renderRef.current.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        // Convertir la posición del mouse a coordenadas del juego
        const gameX = (x / rect.width) * GAME_CONFIG.width;

        // Limitar la posición entre los muros
        const clampedX = Math.max(
            GAME_CONFIG.wallThickness + 30,
            Math.min(GAME_CONFIG.width - GAME_CONFIG.wallThickness - 30, gameX)
        );


        dropPositionRef.current = clampedX;  // Actualizar la referencia

        // Actualizar guía visual
        const dropGuide = engineRef.current.world.bodies.find(
            body => body.render.fillStyle === 'rgba(0, 255, 0, 0.5)'
        );
        if (dropGuide) {
            Body.setPosition(dropGuide, {
                x: clampedX,
                y: GAME_CONFIG.dropLineY
            });
        }
    };

    const handleClick = () => {
        if (!gameState.gameOver) {
            dropFruit();
        }
    };

    const dropFruit = () => {
        if (!engineRef.current || gameState.gameOver) return;

        // Use the current nextFruit from ref
        const currentFruit = nextFruitRef.current;

        const fruit = createFruitBody(
            currentFruit,
            dropPositionRef.current,
            GAME_CONFIG.dropLineY
        );

        World.add(engineRef.current.world, [fruit]);

        // Generate new fruit and update both ref and state
        const newNextFruit = getRandomStartingFruit();
        nextFruitRef.current = newNextFruit;

        setGameState(prev => ({
            ...prev,
            nextFruit: newNextFruit
        }));

        setTimeout(() => checkGameOver(fruit), 2000);
    };

    const createFruitBody = (fruitType: FruitType, x: number, y: number) => {
        return Bodies.circle(x, y, fruitType.radius, {
            label: `fruit-${fruitType.id}`,
            render: {
                // sprite: {
                //     texture: fruitType.imagePath,
                //     xScale: (fruitType.radius * 2) / 100,  // Ajustamos la escala para que coincida con el diámetro
                //     yScale: (fruitType.radius * 2) / 100   // Dividimos por 100 asumiendo que la imagen original es de 100x100px
                // }
                fillStyle: fruitType.color,
            },
            restitution: GAME_CONFIG.restitution,
            friction: GAME_CONFIG.friction
        });
    };

    const setupCollisionDetection = (engine: Engine) => {
        Events.on(engine, 'collisionStart', (event) => {
            event.pairs.forEach((pair) => {
                const { bodyA, bodyB } = pair;

                if (bodyA.label === bodyB.label && bodyA.label.startsWith('fruit-')) {
                    const fruitId = parseInt(bodyA.label.split('-')[1]);
                    const nextFruitId = getNextFruitId(fruitId);

                    if (nextFruitId !== null) {
                        mergeFruits(bodyA, bodyB, nextFruitId, engine);
                    }
                }
            });
        });
    };

    const mergeFruits = (bodyA: Matter.Body, bodyB: Matter.Body, newFruitId: number, engine: Engine) => {
        const newX = (bodyA.position.x + bodyB.position.x) / 2;
        const newY = (bodyA.position.y + bodyB.position.y) / 2;

        // Remover frutas originales
        World.remove(engine.world, [bodyA, bodyB]);

        // Crear nueva fruta solo si no es la más grande
        if (newFruitId < FRUITS.length) {
            const newFruitType = FRUITS[newFruitId];
            const newFruit = createFruitBody(newFruitType, newX, newY);
            World.add(engine.world, newFruit);

            // Actualizar puntuación
            setGameState(prev => ({
                ...prev,
                score: prev.score + newFruitType.points
            }));
        }
    };

    const checkGameOver = (fruit: Matter.Body) => {
        if (fruit.position.y < GAME_CONFIG.dropLineY + 50) {
            setGameState(prev => ({ ...prev, gameOver: true }));
        }
    };

    const resetGame = () => {
        if (!engineRef.current) return;

        // Limpiar frutas
        const allBodies = engineRef.current.world.bodies;
        const fruits = allBodies.filter(body => body.label.startsWith('fruit-'));
        World.remove(engineRef.current.world, fruits);

        // Reset next fruit ref and state together
        const initialFruit = getRandomStartingFruit();
        nextFruitRef.current = initialFruit;

        setGameState({
            score: 0,
            gameOver: false,
            nextFruit: initialFruit,
            level: 1
        });
    };

    const cleanup = () => {
        if (runnerRef.current) Runner.stop(runnerRef.current);
        if (renderRef.current) Render.stop(renderRef.current);
        if (engineRef.current) Engine.clear(engineRef.current);
    };

    return (
        <div className="game-container">
            {/* UI del juego */}
            <div className="game-header">
                <div className="score">Puntuación: {gameState.score}</div>
                <div className="next-fruit">
                    <span>Siguiente: </span>
                    <img
                        src={gameState.nextFruit.imagePath}
                        alt={gameState.nextFruit.name}
                        width={40}
                        height={40}
                    />
                </div>
            </div>

            {/* Canvas del juego */}
            <div className="game-area" ref={sceneRef} />

            {/* Game Over Modal */}
            {gameState.gameOver && (
                <div className="game-over-modal">
                    <div className="modal-content">
                        <h2>¡Juego Terminado!</h2>
                        <p>Puntuación final: {gameState.score}</p>
                        <button onClick={resetGame}>Jugar de Nuevo</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Game;