function replyMessage (replyToken,message) {
  let postData = {
    "replyToken": replyToken,
    "messages": [{
      "type" : "text",
      "text" : "" + message
    }]
  }
  let options = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    "payload": JSON.stringify(postData)
  }
  UrlFetchApp.fetch(REPLY, options);
}

function pushMessage (userId,message) {
    //deleteTrigger();
  var postData = {
    "to": userId,
    "messages": [{
      "type": "text",
      "text":  ""+message,
    }]
  };
  var headers = {
    "Content-Type": "application/json",
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    muteHttpExceptions: true,
  };

  var options = {
    "method": "post",
    "headers": headers,
    "payload": JSON.stringify(postData),
    "muteHttpExceptions": true
  };
  UrlFetchApp.fetch(PUSH, options);
}

function getDisplayName(userId) {
  let headers = {
    "Authorization" : "Bearer " + CHANNEL_ACCESS_TOKEN
  }
  let options = {
    "method" : "GET",
    "headers" : headers
  }
  GET += userId
  let response = UrlFetchApp.fetch(GET, options)
  let profile = JSON.parse(response)
  return profile.displayName
}

function test () {
   eventLogging("test")
}

function test1 () {
  let str = '未検温'
  console.log(str.length)
}

function dimDate () {
  let date1 = new Date()
  let date2 = new Date('2021/2/15')
  return Math.floor((date1-date2)/(24*60*60*1000))
}
