#!/bin/bash

sudo apt update
sudo apt install -y tmux nodejs npm mongodb

cd server || exit
touch .env
cat <<EOF > .env
MONGO_URI=mongodb://localhost:27017/course_management_test
PORT=5000
EOF

npm install

cd ../client || exit
npm install

echo "Environment setup complete."

