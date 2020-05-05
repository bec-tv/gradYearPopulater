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

console.log(`Requesting results from ${url} from saved search ${savedSearch}`)

fetch(`${url}shows/search/advanced/${savedSearch}`)
	.then(res => res.json())
	.then(json => {
		var shows = json.savedShowSearch.results;
		var effective_limit = Math.min(limit, shows.length);
		console.log(`Got ${shows.length} shows, populating grad year for first ${effective_limit} results`);
  
    console.log('showID,eventDate,beginGrade,endGrade,beginClass,endClass,title')

  	for(var i = 0; i < effective_limit; i++) {
      getShow(shows[i])
      .then((show) => {
        if(show.eventDate === null)
          console.log(`Show ${show.id} has no EventDate!, skipping!`);
        else
        {
          var result = computeGradYears(show);

          console.log(`show ${show.id} - "${show.title}" finished:`);
          console.log(result);

          //console.log(`${show.id},${result.date},${result.beginGrade},${result.endGrade},${result.beginClass},${result.endClass},"${show.title}"`);
        }
      });
      //console.log(show);
      //.then((show) => getGrades(show.id, show.customFields));
  	}
  });

const getShow = showID => {
  return fetch(`${url}shows/${showID}`)
  .then((res) => { return res.json(); })
  .then((json) => { return json.show; })
  .then((show) => {
    //update Date to be a real Date object not just a date-y string
    show.eventDate = new Date(show.eventDate);

    console.log(show);

    return show;
  });
  
};

const computeGradYears = show => {
  var result = null;
  var beginGrade = 0;
  var endGrade = 0;
  var customFields = show.customFields

  customFields.forEach(item => {
    if(item.showField == process.env.BEGINING_GRADE)
      beginGrade = item.value;
    else if(item.showField == process.env.END_GRADE)
      endGrade = item.value;
  });

  if(beginGrade > 0 && endGrade > 0)
  {
    var eventYear = show.eventDate.getFullYear();
    var schoolYearOffset = show.eventDate.getMonth() >= 7 ? 1 : 0;
    var beginYearsTillGrad = 12 - beginGrade;
    var endYearsTillGrad = 12 - endGrade;

    result = {
      showID: show.id,
      date: show.eventDate,
      beginGrade: beginGrade,
      endGrade: endGrade,
      beginClass: eventYear + schoolYearOffset + beginYearsTillGrad,
      endClass: eventYear + schoolYearOffset + endYearsTillGrad,
    };
  }

  return result;
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