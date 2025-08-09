import { Game } from './core/Game.js';

// Global game instance for debugging
window.game = null;

async function main() {
    try {
        console.log('Starting Boy and His Dog...');
        
        // Create game instance
        console.log('Creating game instance...');
        const game = new Game();
        window.game = game;
        console.log('Game instance created successfully');
        
        // Initialize the game
        console.log('Initializing game...');
        await game.init();
        console.log('Game initialized successfully');
        
        // Start the game loop
        console.log('Starting game loop...');
        game.start();
        
        console.log('Game started successfully!');
        
        // Handle page unload
        window.addEventListener('beforeunload', () => {
            game.dispose();
        });
        
    } catch (error) {
        console.error('Failed to start game:', error);
        
        // Show error message to user
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div style="color: #ff6666;">
                    <h3>Failed to Load Game</h3>
                    <p>${error.message}</p>
                    <p>Please refresh the page to try again.</p>
                </div>
            `;
        }
    }
}

// Start the game when the page is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}
