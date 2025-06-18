#!/bin/bash

sudo apt update
sudo apt install -y gnupg curl tmux nodejs npm

curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg \
   --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

sudo apt-get update
sudo apt-get install -y mongodb-org

# start mongod service
sudo systemctl enable mongod
sudo systemctl start mongod

cd server || exit
touch .env
cat <<EOF > .env
MONGO_URI=mongodb://localhost:27017/course_management_system
PORT=5000
EOF

npm install

cd ../client || exit
npm install

echo "Environment setup complete."
