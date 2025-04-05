#!/bin/bash

sudo apt install tmux
sudo apt install nodejs
sudo apt install npm
sudo npm install -g nodemon

cd server
touch .env
printf "MONGO_URI=mongodb://localhost:27017/course_management_test
PORT=5000\n" >> .env
cd ..
