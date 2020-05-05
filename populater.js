//vodCreator (c) 2020 Brandon McKenzie / BEC-TV

const fetch = require("node-fetch");
const dotenv = require("dotenv");

var result = dotenv.config();

if(result.error) {
  console.log("FATAL ERROR\n\nFailed to load .env file with required setting.  Please see README for details");
  return 0;
}

const url = `${process.env.URL || ""}/CablecastAPI/v1/`;
const credentials = process.env.CREDENTIALS || "";
const savedSearch = process.env.SAVEDSEARCH;
const limit = process.env.LIMIT || 10;

if (process.env.VERBOSE === true)
  console.log("WARNING: Verbose mode is active!");

console.log(`Requesting results from ${url} from saved search ${savedSearch}`)

fetch(`${url}shows/search/advanced/${savedSearch}`)
	.then(res => res.json())
	.then(json => {
		var shows = json.savedShowSearch.results;
		var effective_limit = Math.min(limit, shows.length);
		console.log(`Got ${shows.length} shows, populating grad year for first ${effective_limit} results`);
  
    //console.log('showID,eventDate,beginGrade,endGrade,beginClass,endClass,title')

  	for(var i = 0; i < effective_limit; i++) {
      getShow(shows[i])
      .then((show) => {
        if(show.eventDate === null)
          console.log(`Show ${show.id} has no EventDate!, skipping!`);
        else
        {
          var updatedShow = computeGradYears(show);

          console.log(`show ${show.id} - "${show.title}" finished:`);

          if(process.env.VERBOSE == 'true')
            console.log(updatedShow);

          updateCablecast(updatedShow);

          //console.log(`${show.id},${show.eventDate},${result.beginGrade},${result.endGrade},${result.beginClass},${result.endClass},"${show.title}"`);
        }
      });
  	}
  });

const getShow = showID => {
  return fetch(`${url}shows/${showID}`)
  .then((res) => { return res.json(); })
  .then((json) => { return json.show; })
  .then((show) => {
    return show;
  });
};

const eventDate = show => new Date(show.eventDate);
const beginGrade = show => getCustomField(show, process.env.BEGINING_GRADE).value;
const endGrade = show => getCustomField(show, process.env.END_GRADE).value;
const beginClass = show => getCustomField(show, process.env.BEGINING_CLASS).value;
const endClass = show => getCustomField(show, process.env.END_CLASS).value;

const getCustomField = (show, showFieldId) => show.customFields.find(e => e.showField == showFieldId);

const computeGradYears = show => {
  var begin = beginGrade(show);
  var end = endGrade(show);
  var date = eventDate(show);

  var customFields = show.customFields;

  if(begin > 0 && end > 0)
  {
    var eventYear = date.getFullYear();
    var schoolYearOffset = date.getMonth() >= 7 ? 1 : 0;
    var beginYearsTillGrad = 12 - begin;
    var endYearsTillGrad = 12 - end;

    var beginClass = eventYear + schoolYearOffset + beginYearsTillGrad;
    var endClass = eventYear + schoolYearOffset + endYearsTillGrad;

    //update the appropriate custom fields
    getCustomField(show, process.env.BEGINING_CLASS).value = beginClass.toString();
    getCustomField(show, process.env.END_CLASS).value = endClass.toString();
  }
  else
    console.log(`ERROR: Failed to process show ${show.id}.  Couldn't get beginGrade or endGrade`);

  return show;
};

const updateCablecast = show =>
{
  var result = new Object();
  result.Show = show;

  if(process.env.DRY_RUN != false) {
    fetch(`${url}shows/${show.id}`, {
      method: 'put',
      body: JSON.stringify(result),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.CREDENTIALS).toString('base64')}`},
    })
    .then(res => res.json())
    .then(json => {
      if(process.env.VERBOSE == 'true')
        console.log(json);

      postSuccessToSlack(show);
    });
  }
};

const postSuccessToSlack = show =>
{
  console.log("Posting success message to Slack...");

  var message = `Updated *Grad Year* fields for show <${process.env.URL}/Cablecast/app/index.html#/shows/${show.id}/edit|${show.id}>.  EventDate=${eventDate(show).toLocaleDateString()}, Grades=[${beginGrade(show)}-${endGrade(show)}] Classes=[${beginClass(show)}-${endClass(show)}]`;

  postToSlack(message);
}

const postToSlack = message =>
{
  if(!process.env.SLACK_WEBHOOK) {
    console.log("Webhook undefined, skipping slack notification");
    return;
  }

  var messageBody = {
    username: "gradYearPopulater",
    text: message,
    icon_emoji: ":mortar_board:"
  };

  fetch(process.env.SLACK_WEBHOOK, {
      method: 'post',
      body: JSON.stringify(messageBody),
      headers: {'Content-Type': 'application/json'}})
    .then(res => {
      var showResponse = (process.env.VERBOSE == 'true');

      if(res.status != 200) {
        console.log("ERROR: Unsuccessful response from Slack Webhook");
        showResponse = true;
      }

      if(showResponse)
        console.log(res);
    });
};

/*
---- VBScript to calcualte grad years from old ClassSalute plugin ---

Validate = Request.QueryString("Validate")
If Validate = "true" then
  set conn = Server.CreateObject("ADODB.Connection")
  conn.open "Provider=SQLOLEDB.1;Integrated Security=SSPI;Persist Security Info=False;Initial Catalog=Cablecast40;Data Source=(local);Use Procedure for Prepare=1;Auto Translate=True;Packet Size=4096;Use Encryption for Data=False;Tag with column collation when possible=False"
  Server.ScriptTimeout = 100000000
  set rs = server.CreateObject("ADODB.Recordset")
  
  rs.Open "SELECT * FROM shows WHERE LocationID=22;", conn
  Do while not rs.eof
    If rs("Custom4") = "" and rs("Custom5") = "" then
      Sgrade = ("Custom3")
      If not sgrade = "" then
        If not sgrade = "0" then
          If isnumeric(sgrade) = true then
            x = 12 - Sgrade
          End If
        End If
      End If
    if month(rs("eventdate")) >= 7 then
      q = 1
      else
      q = 0
    end if
    gradyear = x + year(rs("eventdate")) + q
      response.Write rs("Title") & " " & rs("EventDate") & " " & gradyear & "<br>"
    End If
    rs.movenext
  Loop

  */