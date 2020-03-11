const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

//mqtt settings
const mqtt = require('mqtt');
var options = {
  port : 1883,
  keepalive : 60,
  reschedulePings: true,
  recconectPeriod : 1000 
};

//database settings
var mongo = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017";
const port = process.env.PORT || 3001;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const topicId = "ID_Data";
const topicHR = "HR_Data";
const topicSPO2 = "SPO2_Data";
var dataFlag = [-1,-1];
var userId;


app.use(express.static(__dirname + '/public'));

  io.on("connection", socket => {
    const mqtt_client = mqtt.connect('mqtt://test.mosquitto.org', options);
      mqtt_client.on("connect", () =>{ 
        console.log("Subscribe to : " + topicId);
        console.log("Subscribe to: " + topicHR);
        console.log("Subscribe to: " + topicSPO2);
      
        mqtt_client.subscribe(topicId, {qos :2});
        mqtt_client.subscribe(topicHR, {qos :2});
        mqtt_client.subscribe(topicSPO2, {qos :2});
        
        });
        
      console.log("New client connected:" + socket.id);
    
      //fuction to get the most recent data by id
      function getMedicalData() {
        mongo.connect(url,{useNewUrlParser: true,useUnifiedTopology: true},
           function (err, db) {
        var dbo = db.db("bioBase");
        if(err) throw err;

        dbo.collection('bioItems').aggregate([ 
          { $sort: {time: -1 }},
          { $group: {_id: '$userId',
          meas: {$first: '$$ROOT'}, 
          meas_ids: {$push: '$_id'}}}]).toArray((err, docs) => {  
            io.sockets.emit("get_data", docs);
          })
        });
      }
    
      mqtt_client.on('message', (topic, message) => {
        //receive id through mqtt 
        if(topic === 'ID_Data') {
          userId = message.toString();
          console.log("userId is: " + userId);
        }

        //receive heart rate through mqtt 
        if(topic === 'HR_Data') {
            dataFlag[0] = message.toString();
            console.log("heart rate is: " + dataFlag[0]);
        }

        //receive spo2 through mqtt 
        if(topic === 'SPO2_Data') {
            dataFlag[1] = message.toString(); 
            console.log("spo2 is: " + dataFlag[1]);
        }

        //add received data to database bioBase
        if(dataFlag[0] != -1 && dataFlag[1] != -1) { 
          if(dataFlag[0] != '-1' && dataFlag[1] != '-1'){ // valid values of heart rate and spo2
            if(dataFlag[0] > 50 && dataFlag[0] < 140){ //acceptable values of heart rate
            console.log("Both values received");
            mongo.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, db) {
              if(err) throw err;
              var dbo = db.db("bioBase");        
              var data1 = dataFlag[0];
              var data2 = dataFlag[1]; 

              //create a timestamp for the current data
              var date_ob = new Date();
              let date = ("0" + date_ob.getDate()).slice(-2);
              let month = ("0" + date_ob.getMonth() +1).slice(-2);
              let year = date_ob.getFullYear();
              let hours = ("0" + date_ob.getHours()).slice(-2);
              let minutes = ("0" + date_ob.getMinutes()).slice(-2);
              let seconds = ("0" + date_ob.getSeconds()).slice(-2);
              let nTime = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
              
              dbo.collection('bioItems', function (err, collection) {
                collection.insertOne({ userId: userId, hr : data1, spo2 : data2, time : nTime })}); 
              dataFlag[0]=-1; 
              dataFlag[1]=-1; 
              getMedicalData(); 
              
              }); 
              }}
            }
          });
          
          //clear whole database
          socket.on("clear_db", () => {
            mongo.connect(url, {useNewUrlParser: true, useUnifiedTopology: true},
              function (err, db) {
              if(err) throw err;
              var dbo = db.db("bioBase");
              dbo.collection('bioItems', function (err , collection) {
                collection.drop();
              })
            });
          });
          
          //clear user1 data
          socket.on("clear_user1", () => {
            mongo.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, db) {
              if(err) throw err;
              var dbo = db.db("bioBase");
              dbo.collection('bioItems', function (err , collection) {
                collection.deleteMany({userId: "1"});
              })
            });
          });

          //clear user2 data
          socket.on("clear_user2", () => {
            mongo.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, db) {
              if(err) throw err;
              var dbo = db.db("bioBase");
              dbo.collection('bioItems', function (err , collection) {
                collection.deleteMany({UserId: "2"});
              })
            });
          });

          //clear user3 data
          socket.on("clear_user3", () => {
            mongo.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, db) {
              if(err) throw err;
              var dbo = db.db("bioBase");
              dbo.collection('bioItems', function (err , collection) {
                collection.deleteMany({userId: "3"});
              })
            });
          });

          //clear user4 data
          socket.on("clear_user4", () => {
            mongo.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, db) {
              if(err) throw err;
              var dbo = db.db("bioBase");
              dbo.collection('bioItems', function (err , collection) {
                collection.deleteMany({userId: "4"});
              })
            });
          });

          socket.on("disconnect", () => {
              console.log("user disconnected");
          });
        
        });

  app.use(express.static("build"));
  app.use("/", express.static("build"));
  server.listen(port, () => console.log(`Listening on port ${port}`));
