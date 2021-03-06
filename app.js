const express = require('express');
const app = express();
const XAPI = require('vtc-lrs');
const uuid = require('uuid');

let lrs = new XAPI.LRS(); 
  
  let xapi = new XAPI( {
    lrs: lrs,
    getUser: function(req, username, password) {
      return new XAPI.Account(username, //The name of the agent for the Authority
        true,  //this account has read access to the API
        true,   //this account has write access to the API
        true,   //this account can only retreive data it posted 
        false   //this account can use the advanced search apis
      ); 
    },
    connectionString: process.env.connectionString || "mongodb://localhost",
    baseUrl: process.env.host || "http://localhost:9000/xapi"
  } );

  app.use('/xapi', xapi);
  app.use("/lrs-ui", xapi.simpleUI());

  //a batch of statements was stored. A single POSTed statement is treated as an array with one item  
  lrs.on("statementStored", function(ids)
  {
      console.log("The IDs of the stored statements are " + ids.join(","));
      
      lrs.getStatement(ids[0]).then(statement => {
          console.log(statement);
      });
      
  });

  lrs.on("clientError", function(e)
  {
        console.log("The client sent an invalid xAPI request");
  });

  const baseStmt = {
    "id": uuid(),
    "timestamp": new Date().toISOString(),
    "authority": {
        mbox: "mailto:paul.sijpkes@newcastle.edu.au",
        objectType: "Agent"
    },
    "actor": {
      "name": "LRS Server",
      "mbox": "mailto:server@bold.newcastle.edu.au"
    },
    "verb": {
      "id": "http://adlnet.gov/expapi/verbs/experienced",
      "display": { "en-AU": "experienced" }
    },
    "object": {
      "id": "http://example.com/activities/start-server",
      "definition": {
        "name": { "en-AU": "Starting the server" }
      }
    }
  };

  lrs.on('ready', function(){
       console.log("The lrs is attached to the database and ready. You can now use the programmatic API.");
       console.log(`HOST: ${process.env.host}`);
       console.log(`MONGODB: ${process.env.connectionString}`);
       
    lrs.insertStatement(baseStmt).then( ()=>{
       console.log("The statement was stored");
    }).catch( (e)=>{
       console.log("There was some problem with the statement.", e)
    });
  });

module.exports = app;
