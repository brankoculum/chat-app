const http = require('http');
const sockjs = require('sockjs')
const shortid = require('shortid');

var sockServer = sockjs.createServer({
  sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js',
});

function broadcastMessagesToAll() {
  const payload = {
    type: "FETCH_ALL_MESSAGES",
    messageHistory
  }

  Object.keys(users).forEach(id => {
    users[id].conn.write(JSON.stringify(payload))
  })
}

const users = {

}

const messageHistory = [

]

sockServer.on('connection', conn => {
    console.log("Connection established");

    conn.on('data', message => {
        console.log("Message: ", message)

        // If the string is a representation of an object
        if (message[0] === "{") message = JSON.parse(message);

        // If message was parsed as an object
        if (typeof message === 'object') {

          // Different actions based on type of message
          if (message.type === 'NEW_USER') {

            // New users are assigned a UUID
            const id = shortid.generate();
            users[id] = {
              username: message.username,
              conn,
            };

            conn.write(JSON.stringify({
              type: "NEW_USER_ACK",
              username: message.username,
              id
            }))

            broadcastMessagesToAll();

          } else if (message.type === 'NEW_MESSAGE') {
            delete message.type;
            console.log("NEW MESSAGE: ", message)
            messageHistory.push(message)
            console.log(messageHistory)
            broadcastMessagesToAll();
          }
        } else {
          conn.write(message);
        }
    });

    conn.on('close', () => {
      console.log('Connection closed')
    });
});

var server = http.createServer();

server.addListener('upgrade', function(req,res){
    res.end();
});

sockServer.installHandlers(server, { prefix:'/chat' });

console.log(' [*] Listening on 0.0.0.0:9999' );
server.listen(9999)
