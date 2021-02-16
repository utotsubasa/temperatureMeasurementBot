///*
const CHANNEL_ACCESS_TOKEN = 'hi4wNecJfKdEk8QO/nt7+Rmx8YJZPUhBshSEIPShYShwGZ1tMkCB0AbMPfBP224UZtDg5KawXbxBPddulWkzgTLPqANiksYGIGWRLkPWDXA7X5EJNvU6WyCHx3Se20br6p9UDP/yfQddlKumUCTGIAdB04t89/1O/w1cDnyilFU='
const NAME_ID = '1MHe4rxIIcHoAM3F4t07jYTBsaoLVEhq1cZGNuTkJYsU'
const TEMP_ID = '1hpkQ_hem3pDbT_4AaMDeNJ5OMRcHFKhi9s_IwMDFnjg'//検温記録
const LOG_ID = '1KN2pkIFzpYdbXiIFmDmNN9Bfipak7dKJ344BfxwZie4'//ログ
const TALKLOG_ID = '1eDDW7NJlre1jxijsE36TS113G6z3xzEbH-YiMJbWWBk'//トークログ
const EVENTLOG_ID = '1a5ZI2S0fizsrRh_WrNrgknf1s3Nr1lwUx7Awmxtpyvc'
const MANAGER_USERID = 'Ueaa88c1751f4326fe60e7903ecda3811'
//*/
/* //webhookerrorの原因
const settingSheet = SpreadsheetApp.openById('1YX4jC4u5nbUHOCKOIdlAZSD1HFQlRJUaH7ZXoZhEgjk').getSheetByName('シート1')
const CHANNEL_ACCESS_TOKEN = settingSheet.getRange(6,2).getValue()
const NAME_ID = settingSheet.getRange(2,2).getValue()
const TEMP_ID = settingSheet.getRange(3,2).getValue()
const LOG_ID = settingSheet.getRange(4,2).getValue()
const TALKLOG_ID = settingSheet.getRange(5,2).getValue()
//const EVENTLOG_ID = settingSheet.getRange(10,2).getValue()
const MANAGER_USERID = settingSheet.getRange(8,2).getValue()
*/
const REPLY = 'https://api.line.me/v2/bot/message/reply'
const PUSH = 'https://api.line.me/v2/bot/message/push'
var GET = 'https://api.line.me/v2/bot/profile/'
const ERROR_MESSAGE = '正しく入力されていません'//エラー用メッセージ

function doPost (e) {
  logging(e)//要る?
  let events = JSON.parse(e.postData.contents).events
  if (events == null) {
    return //エラー処理
  }
  //eventLogging(events) //webhookerrorの原因
  if(events[0].source.type !== 'user') {
    return //例外処理
  }
  talkLogging(events)

  let outputMessage = ERROR_MESSAGE //出力用メッセージ
  let replyToken = events[0].replyToken
  let userMessage = events[0].message.text
  let userId = events[0].source.userId
  if (userMessage.substring(0,2) === '登録') {
    let num = userMessage.substring(2,4)
    let name = userMessage.substring(4)
    outputMessage = register(userId,name,num)
  }
  if (userMessage === '表示') { //過去の検温を表示
    outputMessage = displayTemp(userId)
  } else if (userMessage.substring(0,4) === '検温状況') {　//検温状況の表示
    let num;
    if (userMessage.length === 4) { //全体の検温状況
      num = 1
    } else if (!isNaN(userMessage.substring(4,6))) { //期の検温状況
      num = userMessage.substring(4,6)
    }
    outputMessage = replyUnmeasuredTemp(num)
  } else if ((!isNaN(userMessage)) && userMessage>=30.0 && userMessage<=45.0){ //検温記録
    let temp = userMessage.substring(0,4)
    outputMessage = registerTemp(temp,userId)
    if (temp>=37.5) {
      emergency(userId,temp)
    }
  }
  replyMessage(replyToken,outputMessage)
  
}

function logging (e) {
  //let timeStamp = events[0].timestamp;
  //let date = new Date(timeStamp);
  SpreadsheetApp.openById(LOG_ID).getSheetByName('シート1').appendRow([e])
}
/*
function eventLogging (events) {
  SpreadsheetApp.openById(EVENTLOG_ID).getSheetByName('シート1').appendRow([events[0]])
}
*/

function talkLogging (events) {
  let userMessage = events[0].message.text
  let userId = events[0].source.userId
  let displayName = getDisplayName(userId)
  let timestamp = events[0].timestamp
  let date = new Date(timestamp)
  SpreadsheetApp.openById(TALKLOG_ID).getSheetByName('シート1').appendRow([date,displayName,userId,userMessage])
}

function displayTemp (userId) {
  let nameSheet = SpreadsheetApp.openById(NAME_ID).getSheetByName('シート1')
  let tempSheet = SpreadsheetApp.openById(TEMP_ID).getSheetByName('シート1')
  let lastRow = nameSheet.getLastRow()

  for (let i=2;i<=lastRow;++i) {
    if (nameSheet.getRange(i,1).getValue() == userId) {
      let name = nameSheet.getRange(i,2).getValue()
      let outputMessage= name+"さんの過去の検温状況をお伝えします！\n------------------------\n"
      let ej=2+dimDate()
      let sj=(ej-13<2?2:e-13)
      for (let j=sj;j<=ej;++j){
        let date = new Date(tempSheet.getRange(1,j).getValue());
        let temp = tempSheet.getRange(i,j).getValue()
        outputMessage += date.getFullYear()+'年'+(date.getMonth()+1)+'月'+date.getDate()+'日 : ';
        if (temp === '') {
          outputMessage += '未登録\n'
        } else {
          outputMessage += temp+'度\n'
        }
      }
      outputMessage += '------------------------\n'
      return outputMessage
    }
  }
  return 'お名前の登録が済んでいません！'
}

function replyUnmeasuredTemp (num) {
  let nameSheet = SpreadsheetApp.openById(NAME_ID).getSheetByName('シート1')
  let tempSheet = SpreadsheetApp.openById(TEMP_ID).getSheetByName('シート1')
  let lastRow = nameSheet.getLastRow()
  let j = 2 + dimDate()
  let flag = 1
  let outputMessage='検温未提出者をお知らせします！\n----------------------\n';
  if (num!=1) {
    for (let i=2;i<=lastRow;++i) {
      let name = nameSheet.getRange(i,2).getValue()
      let ki = nameSheet.getRange(i,3).getValue()
      let temp = tempSheet.getRange(i,j).getValue()
      if (ki == num && temp === "") {
        flag = 0
        outputMessage += '・'+name+'さん\n'
      } 
    }
    outputMessage += '----------------------'
    if (flag) {
      outputMessage = '全員検温を提出しました！'
    }
    return outputMessage
  }
  //num==1
  for (let k=68;k<=71;++k) {
    flag = 1
    outputMessage += '***'+k+'期***\n'
    let tmpMessage = '';
    for (let i=2;i<=lastRow;++i) {
      let name = nameSheet.getRange(i,2).getValue()
      let ki = nameSheet.getRange(i,3).getValue()
      let temp = tempSheet.getRange(i,j).getValue()
      if (ki == k && temp == '') {
        flag = 0
        tmpMessage += '・'+name+'さん\n'
      } 
    }
    if (flag) {
      tmpMessage = '全員検温を提出しました！\n'
    }
    outputMessage += tmpMessage + '----------------------'
    if(k<71){
      outputMessage += '\n'
    }
  }
  return outputMessage
}

function registerTemp (temp,userId) {
  let nameSheet = SpreadsheetApp.openById(NAME_ID).getSheetByName('シート1')
  let tempSheet = SpreadsheetApp.openById(TEMP_ID).getSheetByName('シート1')
  let lastRow = nameSheet.getLastRow()
  let i;
  for (i=2;i<=lastRow;++i) {
    let id = nameSheet.getRange(i,1).getValue()
    if (id == userId) {
      break
    }
  }
  if (i>lastRow) {
    return 'お名前が登録されていません！'
  }
  let name = nameSheet.getRange(i,2).getValue()
  let j = 2 + dimDate()
  let val = tempSheet.getRange(i,j).getValue()
  tempSheet.getRange(i,j).setValue(temp)
  if (val === ''){
    return name+'さんの本日の検温を'+temp+'度に登録しました！'
  }　else {
    return name+'さんの本日の検温を'+val+'度から'+temp+'度に変更しました！'
  }
}


//時間をトリガーとして、検温登録を済ませていない人に個別に通知が行く。
function reminder () {
  let nameSheet = SpreadsheetApp.openById(NAME_ID).getSheetByName('シート1')
  let tempSheet = SpreadsheetApp.openById(TEMP_ID).getSheetByName('シート1')
  let lastRow = nameSheet.getLastRow()
  let j = 2 + dimDate()
  for (let i=2;i<=lastRow;++i){
    let val = tempSheet.getRange(i,j).getValue()
    if (val === '') {
      let userId = nameSheet.getRange(i,1).getValue()
      let name = nameSheet.getRange(i,2).getValue()
      let message = name + 'さん、本日の検温登録をお願いします！'
      pushMessage(userId,message)
    }
  }
}

//高熱者が検温登録したのをトリガーとして、toに高熱者が出たと通知が行く
function emergency (to,userId,temp) {
  let nameSheet = SpreadsheetApp.openById(NAME_ID).getSheetByName('シート1')
  let lastRow = nameSheet.getLastRow()
  for (let i=2;i<=lastRow;++i) {
    let id = nameSheet.getRange(i,1).getValue()
    if (id == userId) {
      let name = nameSheet.getRange(i,2).getValue()
      let message = name + 'さんの本日の体温が' + temp + '度でしたので報告します！'
      pushMessage(to,message)
      return
    }
  }
  let message = '名前を登録していないのでどなたかわかりませんが'+temp+'度の方がいたので報告します！'
  pushMessage(to,message)
}


function register (userId,name,num) {
  let nameSheet = SpreadsheetApp.openById(NAME_ID).getSheetByName('シート1')
  let tempSheet = SpreadsheetApp.openById(TEMP_ID).getSheetByName('シート1')
  let lastRow = nameSheet.getLastRow()
  let i;
  for (i=2;i<=lastRow;++i) {
    let id = nameSheet.getRange(i,1).getValue()
    if (id == userId) {
      break
    }
  }
  if (i>lastRow) {
    nameSheet.getRange(i,1).setValue(userId)
    nameSheet.getRange(i,2).setValue(name)
    nameSheet.getRange(i,3).setValue(num)
    tempSheet.getRange(i,1).setValue(name)
    return name+'さんの情報を登録しました！'
  }
  nameSheet.getRange(i,2).setValue(name)
  nameSheet.getRange(i,3).setValue(num)
  return name+'さんの情報を上書きしました！'
}

function test2 () {
  emergency(MANAGER_USERID,USER_ID,37.8)
}
