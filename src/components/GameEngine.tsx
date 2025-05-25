import React, { useEffect, useRef, useState } from 'react';
import { Engine, Render, World, Bodies, Body, Events, Runner, Mouse, MouseConstraint } from 'matter-js';

interface FruitType {
    id: number;
    name: string;
    radius: number;
    color: string;
    points: number;
    emoji: string; // Placeholder para tus imágenes
}

const FRUITS: FruitType[] = [
    { id: 0, name: 'Cereza', radius: 15, color: '#FF6B6B', points: 1, emoji: '🍒' },
    { id: 1, name: 'Fresa', radius: 20, color: '#FF8E8E', points: 3, emoji: '🍓' },
    { id: 2, name: 'Uva', radius: 25, color: '#9B59B6', points: 6, emoji: '🍇' },
    { id: 3, name: 'Naranja', radius: 30, color: '#F39C12', points: 10, emoji: '🍊' },
    { id: 4, name: 'Limón', radius: 35, color: '#F1C40F', points: 15, emoji: '🍋' },
    { id: 5, name: 'Manzana', radius: 40, color: '#E74C3C', points: 21, emoji: '🍎' },
    { id: 6, name: 'Pera', radius: 45, color: '#27AE60', points: 28, emoji: '🍐' },
    { id: 7, name: 'Durazno', radius: 50, color: '#E67E22', points: 36, emoji: '🍑' },
    { id: 8, name: 'Piña', radius: 55, color: '#F39C12', points: 45, emoji: '🍍' },
    { id: 9, name: 'Melón', radius: 60, color: '#2ECC71', points: 55, emoji: '🍈' },
    { id: 10, name: 'Sandía', radius: 70, color: '#27AE60', points: 66, emoji: '🍉' }
];

const SuikaGame: React.FC = () => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Engine | null>(null);
    const renderRef = useRef<Render | null>(null);
    const runnerRef = useRef<Runner | null>(null);

    const [score, setScore] = useState(0);
    const [nextFruit, setNextFruit] = useState<FruitType>(FRUITS[0]);
    const [gameOver, setGameOver] = useState(false);
    const [dropPosition, setDropPosition] = useState(400);

    const GAME_WIDTH = 800;
    const GAME_HEIGHT = 600;
    const WALL_THICKNESS = 20;
    const DROP_LINE_Y = 100;

    useEffect(() => {
        if (!sceneRef.current) return;

        // Crear motor de física
        const engine = Engine.create();
        engine.world.gravity.y = 0.8;
        engineRef.current = engine;

        // Crear renderer
        const render = Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                wireframes: false,
                background: '#87CEEB',
                showAngleIndicator: false,
                showVelocity: false
            }
        });
        renderRef.current = render;

        // Crear paredes y suelo
        const ground = Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 10, GAME_WIDTH, 20, {
            isStatic: true,
            render: { fillStyle: '#8B4513' }
        });

        const leftWall = Bodies.rectangle(10, GAME_HEIGHT / 2, 20, GAME_HEIGHT, {
            isStatic: true,
            render: { fillStyle: '#8B4513' }
        });

        const rightWall = Bodies.rectangle(GAME_WIDTH - 10, GAME_HEIGHT / 2, 20, GAME_HEIGHT, {
            isStatic: true,
            render: { fillStyle: '#8B4513' }
        });

        World.add(engine.world, [ground, leftWall, rightWall]);

        // Control del mouse
        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false }
            }
        });
        World.add(engine.world, mouseConstraint);

        // Prevenir scroll en el canvas
        render.canvas.addEventListener('wheel', (e) => e.preventDefault());

        // Manejar movimiento del mouse para preview
        render.canvas.addEventListener('mousemove', (e) => {
            const rect = render.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const clampedX = Math.max(nextFruit.radius + WALL_THICKNESS,
                Math.min(GAME_WIDTH - nextFruit.radius - WALL_THICKNESS, x));
            setDropPosition(clampedX);
        });

        // Manejar clicks para soltar frutas
        render.canvas.addEventListener('click', () => {
            if (!gameOver) {
                dropFruit();
            }
        });

        // Detector de colisiones para merge
        Events.on(engine, 'collisionStart', (event) => {
            event.pairs.forEach((pair) => {
                const { bodyA, bodyB } = pair;

                // Verificar si ambos cuerpos son frutas del mismo tipo
                if (bodyA.label === bodyB.label && bodyA.label.startsWith('fruit-')) {
                    const fruitId = parseInt(bodyA.label.split('-')[1]);

                    if (fruitId < FRUITS.length - 1) {
                        // Calcular posición promedio
                        const newX = (bodyA.position.x + bodyB.position.x) / 2;
                        const newY = (bodyA.position.y + bodyB.position.y) / 2;

                        // Remover frutas originales
                        World.remove(engine.world, [bodyA, bodyB]);

                        // Crear nueva fruta más grande
                        const newFruitType = FRUITS[fruitId + 1];
                        const newFruit = Bodies.circle(newX, newY, newFruitType.radius, {
                            label: `fruit-${newFruitType.id}`,
                            render: {
                                fillStyle: newFruitType.color,
                                strokeStyle: '#333',
                                lineWidth: 2
                            },
                            restitution: 0.4,
                            friction: 0.5
                        });

                        World.add(engine.world, newFruit);

                        // Actualizar puntuación
                        setScore(prev => prev + newFruitType.points);
                    }
                }
            });
        });

        // Iniciar simulación
        const runner = Runner.create();
        runnerRef.current = runner;
        Runner.run(runner, engine);
        Render.run(render);

        // Seleccionar primera fruta aleatoria
        setNextFruit(FRUITS[Math.floor(Math.random() * 5)]); // Solo las 5 primeras frutas pueden aparecer

        return () => {
            if (runnerRef.current) Runner.stop(runnerRef.current);
            if (renderRef.current) Render.stop(renderRef.current);
            if (engineRef.current) Engine.clear(engineRef.current);
        };
    }, []);

    const dropFruit = () => {
        if (!engineRef.current || gameOver) return;

        const fruit = Bodies.circle(dropPosition, DROP_LINE_Y, nextFruit.radius, {
            label: `fruit-${nextFruit.id}`,
            render: {
                fillStyle: nextFruit.color,
                strokeStyle: '#333',
                lineWidth: 2
            },
            restitution: 0.4,
            friction: 0.5
        });

        World.add(engineRef.current.world, fruit);

        // Seleccionar siguiente fruta
        setNextFruit(FRUITS[Math.floor(Math.random() * 5)]);

        // Verificar game over (fruta por encima de la línea)
        setTimeout(() => {
            if (fruit.position.y < DROP_LINE_Y + 50) {
                setGameOver(true);
            }
        }, 2000);
    };

    const resetGame = () => {
        if (!engineRef.current) return;

        // Limpiar todas las frutas
        const allBodies = engineRef.current.world.bodies;
        const fruits = allBodies.filter(body => body.label.startsWith('fruit-'));
        World.remove(engineRef.current.world, fruits);

        setScore(0);
        setGameOver(false);
        setNextFruit(FRUITS[Math.floor(Math.random() * 5)]);
    };

    return (
        <div className="flex flex-col items-center p-4 bg-gradient-to-b from-blue-200 to-green-200 min-h-screen">
            <h1 className="text-4xl font-bold text-blue-800 mb-4">🍎 Suika Game Personalizado</h1>

            <div className="flex items-center gap-8 mb-4">
                <div className="text-2xl font-semibold text-green-800">
                    Puntuación: {score}
                </div>

                <div className="flex items-center gap-2 text-lg">
                    <span>Siguiente:</span>
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 border-gray-600"
                        style={{ backgroundColor: nextFruit.color }}
                    >
                        {nextFruit.emoji}
                    </div>
                    <span className="font-medium">{nextFruit.name}</span>
                </div>
            </div>

            {gameOver && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg text-center">
                        <h2 className="text-3xl font-bold text-red-600 mb-4">¡Juego Terminado!</h2>
                        <p className="text-xl mb-4">Puntuación final: {score}</p>
                        <button
                            onClick={resetGame}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors"
                        >
                            Jugar de Nuevo
                        </button>
                    </div>
                </div>
            )}

            <div className="relative border-4 border-brown-600 rounded-lg overflow-hidden shadow-2xl">
                <div ref={sceneRef} className="relative" />

                {/* Línea de drop preview */}
                <div
                    className="absolute w-1 bg-red-500 opacity-50 z-10"
                    style={{
                        left: dropPosition - 2,
                        top: 0,
                        height: DROP_LINE_Y
                    }}
                />

                {/* Preview de la fruta */}
                <div
                    className="absolute border-2 border-dashed border-gray-600 rounded-full opacity-60 z-10 flex items-center justify-center text-lg"
                    style={{
                        left: dropPosition - nextFruit.radius,
                        top: DROP_LINE_Y - nextFruit.radius,
                        width: nextFruit.radius * 2,
                        height: nextFruit.radius * 2,
                        backgroundColor: nextFruit.color
                    }}
                >
                    {nextFruit.emoji}
                </div>
            </div>

            <div className="mt-6 text-center max-w-2xl">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Cómo jugar:</h3>
                <p className="text-gray-600">
                    Mueve el mouse para posicionar la fruta y haz click para soltarla.
                    Cuando dos frutas del mismo tipo se tocan, se combinan en una fruta más grande.
                    ¡Trata de crear la sandía más grande sin que las frutas lleguen arriba!
                </p>

                <div className="mt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Evolución de frutas:</h4>
                    <div className="flex flex-wrap justify-center gap-2">
                        {FRUITS.map((fruit, index) => (
                            <div key={fruit.id} className="flex items-center gap-1 text-sm">
                                <span
                                    className="w-6 h-6 rounded-full text-xs flex items-center justify-center"
                                    style={{ backgroundColor: fruit.color }}
                                >
                                    {fruit.emoji}
                                </span>
                                <span>{fruit.name}</span>
                                {index < FRUITS.length - 1 && <span>→</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuikaGame;