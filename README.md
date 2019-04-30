# Pi-Lit Central Server

This code runs the central server for Pi-Lit. Clone this repository using
```
git clone https://github.com/pi-lit/piLitServer.git
```
This server uses [Node.js](https://nodejs.org/en/). After cloning this repository, run the following command to install all of the node packages documented in the package.json file:

```
npm install
```
Once the packages are installed, this project can be run locally running the following command from the root directory. It is currently defaulted to run on port 8080:
```
node server.js
```
This project is currently hosted at http://pi-lit.herokuapp.com/. Any code pushed to the master branch of this project will automatically be hosted and deployed. If you have access to the host herokuapp, you can see the logs (in the case of debugging crashes or data loss) of the hosted server with the following command:
```
heroku logs -a pi-lit
```
If you do not have access to these logs, speak with an owner of this herokuapp.

This express server makes heavy use of [socket.io](https://socket.io/) and [mongoose](https://mongoosejs.com/). Read the linked documentation for more information.
