# How to run
Application is containerized using docker

To run the app, make sure you have docker installed.

### Docker Installation
- Windows - [**Docker Desktop for windows**](https://docs.docker.com/desktop/setup/install/windows-install/)
- MacOS - [**Docker Desktop for MacOs**](https://docs.docker.com/desktop/setup/install/mac-install/)
- Linux - [**Docker for linux distros**](https://docs.docker.com/engine/install/)

**For Debian based distros**:
1. Set up docker's `apt` repository in sources list
    ```
    # gpg key
    sudo apt-get update
    sudo apt-get install ca-certificates curl
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc

    # add repository to sources list
    echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    ```

2. Install docker packages
    ```
    sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    ```

3. Verify Installation by running
    ```
    sudo docker run hello-world
    ```

### How to start the application:
1. Clone the repo
    ```
    git clone https://github.com/Mehmood-Deshmukh/MERN-COEP-Course-Management.git
    cd MERN-COEP-Course-Management
    ```

2. Make sure that you are in the root directory of project.
    ```
    /
    ├── client/ 
    │   └── Dockerfile
    ├── server/ 
    │   └── Dockerfile
    ├── docker-compose.yml
    ```

3. Build everything and start the container
    ```
    docker-compose up --build
    ```

4. Open the app
    - Frontend: http://localhost:5173
    - Backend API: http://localhost:5000/api


On first run, Docker will build all images this may take some time.

### To stop / cleanup 

**To just stop the container or app you can use**:
```
docker-compose down
```

**Setup uses local mongodb setup by default if you wish to delete all the mongodb data as well then you can use**
```
docker-compose down -v
```
