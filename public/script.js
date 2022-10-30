const connectionStatus = document.getElementById('connectionStatus');
const leftSensor = document.getElementById('leftSensor');
const middleSensor = document.getElementById('middleSensor');
const rightSensor = document.getElementById('rightSensor');
const currentRobotName = document.getElementById('currentRobotName');

var thisIP = 0;
// let ip
var pubClient = 0;
var globalRobotName = 0;

const  pubPahoConfig = {
    hostname: "52.53.221.162",     //The hostname is the url, under which your FROST-Server resides.
    port: "9001",                   //The port number is the WebSocket-Port,
                                        // not (!) the MQTT-Port. This is a Paho characteristic.
    // clientId: String(ip)   
    // clientId: new String(ip)                  //Should be unique for every of your client connections.
    clientId: thisIP
}

// function getIP(json) {
//     console.log("My public IP address is: ", json.ip);
//     thisIP = json.ip;
//     console.log("ip is :" + thisIP);
//     console.log(String(thisIP));
//     }

var isMQTTConnected = 0;

// // Create a client instance
// // var pubClient = new Paho.MQTT.Client(pubPahoConfig.hostname, Number(pubPahoConfig.port), pubPahoConfig.clientId);
// var pubClient = new Paho.MQTT.Client(pubPahoConfig.hostname, Number(pubPahoConfig.port), client_id=String(thisIP));
// // var pubClient = new Paho.MQTT.Client(pubPahoConfig.hostname, Number(pubPahoConfig.port), '');

// // // Create a client instance
// // var pubClient = new Paho.MQTT.Client(pubPahoConfig.hostname, Number("9001"), pubPahoConfig.clientId);

// // set callback handlers
// pubClient.onConnectionLost = pubOnConnectionLost;
// pubClient.onMessageArrived = pubOnMessageArrived;

// // connect the client
// pubClient.connect({
//     onSuccess:pubOnConnect,
//     userName:"ailas",
//     password:"ailas"
// });

// called when the client connects
function pubOnConnect() {
    // Once a connection has been made, make a subscription and send a message.
    isMQTTConnected = 1;
    console.log("pubClient Connected");
    // console.log("Client ID is " + String(thisIP));
    connectionStatus.innerHTML = 'Server Status: Connected';
    pubClient.subscribe(globalRobotName + "/sensors");
    // pubClient.subscribe("t1/command");
}

function pubCommand(message, topic) {
    thisMessage = new Paho.MQTT.Message(message);
    thisMessage.destinationName = topic;
    thisMessage.qos = 2;
    pubClient.send(thisMessage);
    // console.log(thieMessage);
}

// called when the client loses its connection
// not working yet
function pubOnConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:"+responseObject.errorMessage);
        connectionStatus.innerHTML = 'Server Status: Disconnected';
        while (isMQTTConnected === 0){
            console.log('connecting to mqtt broker');
        }
    }
}

// called when a message arrives
function pubOnMessageArrived(message) {
    console.log("onMessageArrived:"+message.payloadString);
    var thisMessage = message.payloadString;
    var thisMessageArray = thisMessage.split(" ");
    console.log(thisMessageArray);
    leftSensor.innerHTML = "Left Sensor: " + thisMessageArray[0] + "   cm";
    middleSensor.innerHTML = "Middle Sensor: " + thisMessageArray[1] + "   cm";
    rightSensor.innerHTML = "Right Sensor: " + thisMessageArray[2] + "   cm";

}

document.getElementById('sendCommandBtn').addEventListener('click', sendCommand);
document.getElementById('deleteHistory').addEventListener('submit', deleteHistory);
document.getElementById('robotSelected').addEventListener('click', connectToRobot);

function connectToRobot(e){
    var robotName = document.getElementById('robotSelection').value;
    console.log('connectToRobot')
    if (robotName === ''){
        //pass
        console.log('Please enter robot name');
    } else {
        localStorage.setItem('robotName', robotName);
        console.log('Robot name is set to ' + robotName);
        currentRobotName.innerHTML = 'Robot Name: ' + localStorage.getItem('robotName');
        globalRobotName = robotName;
        // pubClient.subscribe(robotName + "/sensors");
        // pubClient.subscribe(robotName + "/command");
        pubClient = new Paho.MQTT.Client(pubPahoConfig.hostname, Number(pubPahoConfig.port), client_id=robotName + String(Math.floor(100000000 + Math.random() * 900000000)));
        // var pubClient = new Paho.MQTT.Client(pubPahoConfig.hostname, Number(pubPahoConfig.port), '');

        // // Create a client instance
        // var pubClient = new Paho.MQTT.Client(pubPahoConfig.hostname, Number("9001"), pubPahoConfig.clientId);

        // set callback handlers
        pubClient.onConnectionLost = pubOnConnectionLost;
        pubClient.onMessageArrived = pubOnMessageArrived;

        // connect the client
        pubClient.connect({
            onSuccess:pubOnConnect,
            userName:"ailas",
            password:"ailas"
        });
    }
    // forOnload();
    e.preventDefault();
}


function forOnload(){
    var robotName = document.getElementById('robotSelection');

    connectionStatus.innerHTML = 'Server Status: Disconnected';

    // if (localStorage.getItem('robotName') === null){
    //     //pass
    // }else{
    //     robotName.defaultValue = localStorage.getItem('robotName');
    //     currentRobotName.innerHTML = 'Robot Name: ' + localStorage.getItem('robotName');
    //     pubClient.subscribe(robotName + "/sensors");
    // }
    // pubOnConnectionLost();
    updateCommandHistory();
    // connectionStatus.innerHTML = 'Connecting';
}

function sendCommand(e){
    console.log("Send Command button is pressed");
    var command = document.getElementById('commandInput').value;
    var direction = document.getElementById('selectDirection').value;
    var robotName = document.getElementById('robotSelection').value;
    var thisRobotName;
    console.log(robotName);

    if (robotName === ''){
        thisRobotName = 'admin';
        console.log('null name');
    } else {
        thisRobotName = robotName;
        localStorage.setItem('robotName', thisRobotName);
    }

    var thisCommandSet = {
        thisCommand: command,
        thisDirection: direction
    }

    if (localStorage.getItem('commandList') === null){
        var commandList = [];
        commandList.push(thisCommandSet);
        localStorage.setItem('commandList', JSON.stringify(commandList));
    }else{
        var commandList = JSON.parse(localStorage.getItem('commandList'));
        commandList.push(thisCommandSet);
        localStorage.setItem('commandList', JSON.stringify(commandList));
    }

    pubCommand(direction + ' ' + command, thisRobotName + '/' + 'command');
    document.getElementById('command').reset();
    updateCommandHistory();
    e.preventDefault();
    console.log(thisRobotName);
    // forOnload();
}

function updateCommandHistory(){
    console.log(1)
    var commandList = JSON.parse(localStorage.getItem('commandList'));
    var commandHistory = document.getElementById('commandHistory');

    commandHistory.innerHTML = '';

    try{
        for (var i = 0; i < commandList.length; i++){
            var command = commandList[i].thisCommand;
            var direction = commandList[i].thisDirection;
    
            commandHistory.innerHTML += '<div class="well">' + 
                                        '<p>Command is :' + command + ' ' + 'Direction is :' + direction + '</p>'
                                        // '<p>' + command + '                 ' + direction +'</p>'
                                        '</div>'
        }
    } catch {
        //pass
    }
    
}

function deleteHistory(e){
    console.log("Delete History button is pressed");
    localStorage.removeItem('commandList');
    // localStorage.removeItem('robotName');
    commandHistory.innerHTML = '';
    updateCommandHistory();
    e.preventDefault();
}


