#!/bin/bash

tmux new-session -d -s client "cd client && npm i && npm run dev"

tmux new-session -d -s server "cd server && npm i && nodemon index.js"

tmux ls

tmux attach -t client
tmux attach -t server
