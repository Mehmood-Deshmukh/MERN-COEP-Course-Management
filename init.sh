#!/bin/bash

sudo apt update
sudo apt install -y gnupg curl tmux nodejs npm

# MongoDB GPG key
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# MongoDB repo in sources list
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org

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