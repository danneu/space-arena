
# space-arena

- **Live Demo:** <http://space-arena.herokuapp.com/>

A simple online multiplayer game with an ultra-naive 
websocket networking implementation.

A successor to the more simplified [squarewars](https://github.com/danneu/squarewars) 
since my ultimate goal as I learn gamedev is to build a spaceship arena game
inspired by Continuum/Subspace.

Each player is a space ship. Arrow keys to move.

![screenshot](https://dl.dropboxusercontent.com/spa/quq37nq1583x0lf/y4m_wyh0.png)

Dependencies: [Node.js](https://nodejs.org/) + [Socket.io](http://socket.io/)

## Development

    git clone git@github.com:danneu/space-arena.git
    cd space-arena
    npm install
    browserify client.js -o bundle.js
    npm start-dev

Navigate to <http://localhost:3000>

## Deploy

    git checkout prod
    git merge master
    browserify client.js -o bundle.js
    git commit -am 'Compile'
    git push heroku prod:master

