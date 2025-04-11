#!/bin/bash

tmux new-session -d -s mern-dev

tmux send-keys -t mern-dev 'cd server && node index.js' C-m

tmux split-window -h -t mern-dev
tmux send-keys -t mern-dev 'cd client && npm run dev -- --open' C-m

tmux split-window -v -t mern-dev:0.1
tmux send-keys -t mern-dev:0.2 'clear && cat readme.txt' C-m

tmux attach -t mern-dev

