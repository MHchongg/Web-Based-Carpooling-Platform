# Getting Started with UniCarpool

UniCarpool is a Carpooling Platform is built using React.js for the frontend, Node.js with Express.js for the backend, and MySQL for the database. It allows students to register, post ride offers, search for available carpools, and communicate in real-time, aiming to simplify the process of finding and arranging shared rides.

## Installation (Prerequisites)

To run this system, you need to have below prerequisites:
* Node.js (v18.18.0 or higher)
* MySQL Database (PhpMyAdmin or MySQL Workbench, or others...)

## Git Clone This Repository

Download this [repository](https://github.com/MHchongg/Web-Based-Carpooling-Platform.git "Repository's link") in zip folder or `git clone https://github.com/MHchongg/Web-Based-Carpooling-Platform.git`

## Setup MySQL Database

You can directly import the sql file in the `database` folder to create the database.
In the database, there is already a created user which is admin.
Admin's email: chongminghong34@gmail.com
Admin's password: adminPassword999

## Install Dependencies for both Frontend and Backend

Navigate to the frontend directory: `cd ./client`. After that, install dependencies: `npm install`
Navigate to the backend directory: `cd ./server`. After that, install dependencies: `npm install`

## Configure Environment Variables for Backend

Create a .env file in the server folder

~~~~
PORT=your_port
SECRET_KEY=your_secret_key
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
USER_EMAIL=your_email
APP_PASSWORD=your_email_app_password
~~~~

## Configure Environment Variables for Frontend

Create a .env file in the client folder

~~~~
REACT_APP_API_URL=your_api_url
REACT_APP_GEOAPIFY_API_KEY=your_geoapify_api_key
~~~~

## Run System

Run Node.js backend by running command: `node index.js`
Run React.js frontend by running command: `npm start`
And you can start using the system!!!