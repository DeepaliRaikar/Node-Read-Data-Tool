// @Author: Krushna Narsale

// Command to run >> node build.js l1-u1-u2-u3 OR node build.js l1-u[1-3]
// Above command will generate production build for Level 1 (l1) - Unit 1 (u1) & Unit 2(u2) & Unit 3(u3)

// define keys are follows;
// n - Nursery
// l - Level
// u - Unit
// c - Checkpoint

// Global Variables
var courses = {
  levels: [],
  byId: {},
  remainingLevels: [],
  copyToDist: []
};

var selected_level = null;
var selected_unit = null;
var selected_file = null;
var relative_path = "../../01_Client_Inputs/Prepare_Data/"; //relative path where the excel files are placed.

/*

file_location is the Relative path with the selected file name i.e. relative_path+filename. For example ../../01_Client_Inputs/Prepare_Data/level_1_unit_1.xlsx.
It changes depending on the input we give for file selection. i.e. l1-u1, l1-u1-u3.
*/
var file_location = null;
var curLevel = 0;
var curUnit = 0;
var fs;
var arr;
var data;
var rl;

// Importing node fileStram(fs)
fs = require("fs");
// include XLSX to read an excel worksheet.
var XLSX = require('xlsx');
// include striptags library to discard the additional HTML tags which are not required.
var striptags = require('striptags');
// Accessing arguments that was passed in command.
arr = process.argv;

// Removing first two unwanted values.
// Rest are the required parameters. Example = ["n-u1-u2-u3-u4", "l1-u1-u2-u3-u4"]
arr.splice(0, 2);

if (arr.length <= 0) {
  var readline = require("readline");

  rl = readline.createInterface({input: process.stdin, output: process.stdout});

  rl.question("\n-----------------------------------------------------------\n\nUse below SINGLE character keywords while passing input(s).\n\n  n = Nursery\n  l = Level\n  u = Unit\n  c = Checkpoint\n\nBelow are some sample inputs for referance.\n\n  1. For SINGLE Level SINGLE Unit    - l1-u1\n  2. For SINGLE Level MULTIPLE Units - l1-u1-u2-u3 OR l1-u[1-3]\n  3. For MULTIPLE Levels             - l1-u1-c1 l2-u1-u2\n\n-----------------------------------------------------------\nEnter your input: ", function(answer) {
    answer = answer.replace(/\]\u001b\[D/g, "").split(" ");
    arr = answer;
    // console.log(arr);
    // Initializing from here....
    getCoursesData();
  });
} else {
  getCoursesData();
}

// Iterating throw accessed parameters array.
function getCoursesData() {
  for (var i = 0; i < arr.length; i++) {
    data = arr[i].toLowerCase().trim();
    replaceBrackets();
    arr[i] = data;
    data = data.split("-");
    var level = data.splice(0, 1)[0];
    var units = data;

    data = "";

    // Finding actual key of level & units.
    level = findId(level);
    units.map(function(unitStr, ind) {
      units[ind] = findId(unitStr);
    });

    // Recording level & it's units
    courses.levels.push(level);
    courses.byId[level] = units;
  }

  // console.log("Courses :", courses);
  // updateSelectedLevel(courses.levels[0]);
  getLevelData();
}



// Reading Level config file
function getLevelData() {
  if (courses.levels.length > 0 && curLevel < courses.levels.length) {
    selected_level = courses.levels[curLevel];
    getUnitData();
  } else {
    // console.log("\nConfig files modified successfully!!! Removing unnecessary files from other config please wait.\n");
    // curLevel = 0;
    // removeUnits(courses.levels);
  }
}

// Reading Unit config file
function getUnitData() {
  if (courses.byId[selected_level].length > 0 && curUnit < courses.byId[selected_level].length) {
    selected_unit = courses.byId[selected_level][curUnit];

        // console.log(selected_level + " : " + selected_unit + " Config File saved!");
        selected_file = selected_level+"_"+selected_unit+".xlsx";
        file_location = relative_path+selected_file;
        checkFileExist(file_location);
        curUnit++;
        getUnitData();
  } else {
    curUnit = 0;
    selected_unit = null;
    curLevel++;
    getLevelData();
    if (rl != undefined) {
      rl.close();
    }
  }
}


function checkFileExist(file_location){
  if (fs.existsSync(file_location)) {
    console.log("File exist"+file_location);
    writeToDataFile();
  }else{
    console.log("File does not exist"+file_location);
  }
}

function writeToDataFile(){
  // This is the name of the worksheet for which prepare data tool is currently run for.
  var workbook = XLSX.readFile(file_location);

  // This returns all the worksheets present in the excel file.
  var sheet_name_list = workbook.SheetNames;

  // This array stores individual row data from the excel file, as XLSX reads row wise data
  var row_data = [" "];

  // This is the data from the excel file that needs to be replaced in data.js
  var replace_string = "";

  // This is a temporary variable taken to store the replace data
  var final_result = "";

  /* This contains functions which are used to get data between given two strings.
     Remove data between given two strings.
     Get all results between the given strings.
  */
  var getFromBetween = {
      results:[],
      string:"",
      getFromBetween:function (sub1,sub2) {
          if(this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return false;
          var SP = this.string.indexOf(sub1)+sub1.length;
          var string1 = this.string.substr(0,SP);
          var string2 = this.string.substr(SP);
          var TP = string1.length + string2.indexOf(sub2);
          return this.string.substring(SP,TP);
      },
      removeFromBetween:function (sub1,sub2) {
          if(this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return false;
          var removal = sub1+this.getFromBetween(sub1,sub2)+sub2;
          this.string = this.string.replace(removal,"");
      },

      getAllResults:function (sub1,sub2) {
          // first check to see if we do have both substrings
          if(this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return;

          // find one result
          var result = this.getFromBetween(sub1,sub2);
          // push it to the results array
          this.results.push(result);
          // remove the most recently found one from the string
          this.removeFromBetween(sub1,sub2);

          // if there's more substrings
          if(this.string.indexOf(sub1) > -1 && this.string.indexOf(sub2) > -1) {
              this.getAllResults(sub1,sub2);
          }
          else return;
      },
      get:function (string,sub1,sub2) {
          this.results = [];
          this.string = string;
          this.getAllResults(sub1,sub2);
          return this.results;
      }
  };

  // Iterates through the number of worksheets present in the given excel file.
  sheet_name_list.forEach(function(worksheet_name) {
      // This stores the current worksheet name from the data being fetched.
      var worksheet = workbook.Sheets[worksheet_name];
      worksheet['!rowBreaks'];

      //This is an array which is used to store the headings from the excel file i.e. TOC Text, Teacher Language, Teaching Procedure etc.
      var headers = {};

      // Array that stores cell wise data
      var data = [];

      var week = "";

      //Replace all '-' to '_' from the worksheet name and convert to lowercase.
      worksheet_name = worksheet_name.replace('-', '_').toLowerCase();

      // Since each worksheet is for a single week, store each worksheet name to week as you iterate.
      //week = worksheet_name;

      // Iterate through each cell in the worksheet. @cell_address is every cell in the excel sheet we read data row wise.
      for(cell_address in worksheet) {
          // @data_file_relative_path is used later to store the relative file path for the data.js file for the current screen to write the prepareData to.
          var data_file_relative_path = "";
          // Ignore the first blank cell from the excel sheet and i.e. the cell before Column A and Row 1.
          if(cell_address[0] === '!') continue;
          //parse out the column, row, and value.

          // Fetch the column number for the current cell.
          var col = cell_address.substring(0,1);

          // Fetch the row number for the current cell.
          var row = parseInt(cell_address.substring(1));

          // worksheet[cell_address].h ('.h' returns the cell data along with the HTML tags). We require these since we want to apply styling too for the data.
          var value = worksheet[cell_address].h;

          // A temporary variable that stores the cell data.
          var format_value = value;

          // If the cell data contains '•' than Split the cell data using '•' as delimiter to display data as unordered list.
          if(format_value != undefined && JSON.stringify(format_value).includes("•")){

            // cell_data_list is an array taken to store the result of the split result.
            var cell_data_list = {};

            // formatted_cell_data_list is a temporary variable taken to store the modified cell_data_list data .
            var formatted_cell_data_list = "";

            // Split the data from format_value and store the result to cell_data_list.
            cell_data_list = format_value.split("•");

            // cell_data_list.shift() is used to remove the first blank cell from the array.
            cell_data_list.shift();

            /* Use forEach function to wrap each cell_data_list item in an '<li></li>' tag.
               trim() is used to remove the extra blank spaces around the cell_data_list item.
            */
            cell_data_list.forEach(function(el){
              formatted_cell_data_list += "<li>"+el.trim()+"</li>";
            });


            // &#x000d;&#x000a; and &#10; is HTML character code for <br/>, replace HTML character code with a tag for better styling and computation.
            formatted_cell_data_list = formatted_cell_data_list.replace(/&#x000d;&#x000a;/g, "<br/>");
            formatted_cell_data_list = formatted_cell_data_list.replace(/&#10;/g, "<br/>");

            //Remove extra <br/> which breaks the text alignment.
            // Here formatted_cell_data_list.replace(/<br\/><\/li>/g, "</li>"); replaces "<br\/><\/li>"  with "</li>" by removing the extra <br/> which breaks the styling.
            formatted_cell_data_list = formatted_cell_data_list.replace(/<br\/><\/li>/g, "</li>");

            /*
              In some cases, there is an additional text after the bulletted list like a note or additional instructions for the teacher which is not a part of the bulleted list.
              hence to identify the end of the bulleted list a breakline is used as the end of an <li> tag and the end tag is replaced with a blank.

            */

            /*
              EXAMPLE:

              "<li>Point to a picture on the board and have students say the word. Then tap the picture to make it disappear.</li>
              <li>Continue with all the words on the board.</li>
              <li>Tap <span class='boldStyle'>RESET</span> to show more pictures.<br/>
              Play a Game: Timed Relay (2 Teams)<br/>Tap the TIMER in the toolbar to enable the timer. Divide the class into two teams. One team plays at a time. When you start the timer, students in one team take turns to run to the board, say a word and tap the picture. Record the time it takes to finish, then invite the next team to play. Compare times and decide the winning team.
              Tap RESET and play again.</li>"
              =================================================================================================================================

              In this example, the text starting from '<span style=\"text-decoration: underline;\">Play a Game:' to 'Tap <span class='boldStyle'>RESET</span>and play again.'
              isn't a part of the <li> item. So in this case, to close the <li> tag in its proper place we replace the first '<br/>' with '</li>'  and the ending '</li>' with a blank space.

              Going forward with the next if condition, XLSX also adds font size in the styling which is not required by our tool.
              If any <span> contains font size style remove it using required replace statement.
            */
            if(formatted_cell_data_list.includes("<br/>")){
              formatted_cell_data_list = formatted_cell_data_list.replace("<br/>", "</li>");
              formatted_cell_data_list = formatted_cell_data_list.replace(new RegExp("</li>"+'$'), "");
            }
            if(formatted_cell_data_list.includes('<span style=\"text-decoration: underline;font-size:10pt;\"></li>')){
              formatted_cell_data_list = formatted_cell_data_list.replace('<span style=\"text-decoration: underline;font-size:10pt;\"></li>', "</li><span style=\"text-decoration: underline;\">");
            }

            /*
              In some cases there was an additional '</li>' getting appended before the actual end of the <li> item. To handle this the following line of code is used.

              formatted_cell_data_list = formatted_cell_data_list.replace(/<\/li>(?!.*<\/li>)/, '</li>');

              EXAMPLE:

              "<li>Have students listen and repeat the sentences on each page (point to the words as students read them).</li>
              <li>Tap the text to hear the words again.</li>
              <li>Tap the SPEAKER to hear </li> the sentence again.</li>"
              =================================================================================================================================

              In this example for the last point there are 2 </li>, so to handle this scenario we use a regex to replace any text wrapped inside same tags, into only one tag at the end.
            */
            formatted_cell_data_list = formatted_cell_data_list.replace(/<\/li>(?!.*<\/li>)/, '</li>');
            value = formatted_cell_data_list.trim();
          }

          //store header names if the row being traversed is the first row.
          if(row == 1) {
              headers[col] = value;
              continue;
          }
          if(!data[row]) data[row]={};
          data[row][headers[col]] = value;
      }
      //drop those first two rows which are empty.
      data.shift();
      data.shift();

      for(var data_count = 1; data_count <= data.length; data_count++){
        // Since @row_data is used to store 1 row data at a time, every time we reach the next row in the @data multi-dimensional array, remove the existing row_data using shift() and append the new data using push()
        row_data.shift();
        row_data.push(data[data_count-1]);

        /* Regex - /\*{1,}/g;
          This regex is used to match any string which has the value "*" one or more times.
        */
        var regex_video_data = /\*{1,}/g;

        // Replace the video column with '[{}]' if there is no value given or if it matches with the regex for one or more "*".
        if(row_data[0]["Video"] == undefined || regex_video_data.test(row_data[0]["Video"])){
          row_data[0]["Video"] = [{}];
        }

        // Set Teacher Language column value to blank if nothing is provided in the column else wrap the given content into <i>...</i> to make it italics as per the styling given in the excel.
        if(row_data[0]["Teacher Language"] == undefined){
          row_data[0]["Teacher Language"] = "";
        }else{
          row_data[0]["Teacher Language"] = "<i>"+row_data[0]["Teacher Language"]+"</i>";
        }
        //Considering Level value to be 'level_1', 'level_2' etc convert the level value to lowercase match the same with the folder naming convention.
        var level_name = row_data[0]["Level"].toLowerCase();
        // var level = level_name.substring(0,1);
        // level_name = level_name.replace(level, "level_");

        //Considering unit value to be 'unit_1', 'unit_2' etc convert the unit to lowercase match the same with the folder naming convention.
        var unit_name = row_data[0]["Unit"].toLowerCase();
        // var unit = unit_name.substring(0,1);
        // unit_name = unit_name.replace(unit, "unit_");

        //Considering unit value to be 'week_1', 'week_2' etc convert the week to lowercase match the same with the folder naming convention.
        week = row_data[0]["Week"].toLowerCase();

        // Store the Section name to use it in the relative path, replace the '-' with '_' and convert to lowercase to match the folder naming convention.
        var section_name = row_data[0]["Component"].replace('-', '_').toLowerCase();

        /*
          Teaching time is used to display in the dom structure like "Teaching Procedure (15 mins)". This is appended to the DOM from the prepareInfoView.js located at
          Scholastic/04_Tech/Development/src/common_core/shell/js/view/prepareInfoView.js
        */
        var teaching_time = "("+row_data[0]["Teaching Time"]+")";

        //Store the Screen number to use it in the relative path. Considering Screen value to be 'screen_1', 'screen_2' etc.
        var screen_num = row_data[0]["Screen"].toLowerCase();

        var instruction_text = "";
        if(row_data[0]["Instruction Text"] != undefined){
          instruction_text = row_data[0]["Instruction Text"];
        }else{
          instruction_text = "No instructions";
        }

        // Define the keys which are to be used in prepareData object.
        var tocTitle_key = "tocTitle",
            learningObjectives_key = "learningObjectives",
            teachingProcedure_key = "teachingProcedure",
            teacherLanguage_key = "teacherLanguage",
            teachingTime_key = "teachingTime",
            videoData_key = "videoData",
            icon_key = "icon",
            gameActivity_key = "gameActivity";
            answer_key = "answerKey";
            // itext_key = "itext";

        /*
          Relative path of the data.js looks something like this - level_name/unit_name/week/section_name/screen_num/data.js
          i.e. level_1/unit_1/week_1/phonics/screen_1/data.js
         */
        data_file_relative_path = "./src/courses/"+level_name+"/"+unit_name+"/"+week+"/"+section_name+"/"+screen_num+"/data.js";

        /* fs.existsSync(path){
               Do something if the file exists
           } */
        if (fs.existsSync(data_file_relative_path)) {
            var file = fs.readFileSync(data_file_relative_path, "utf8");

            //An array created to check for all the variations of 'instructionText' keyword used in the data files.
            var itext_keyword = ['itext:', 'itext :', '"itext":', '"itext" :', 'instText:', 'instText :', '"instText":', '"instText" :', 'instructionText:', 'instructionText :', '"instructionText":', '"instructionText" :', 'bottomInstruction:', 'bottomInstruction :', '"bottomInstruction":', '"bottomInstruction" :', 'itextNext:'];


            //An array created to check for all the variations of 'prepareData' keyword used in the data files.
            var prepareData_keyword = ['"prepareData":', '"prepareData" :', 'prepareData:', 'prepareData :'];

            // The data to be replaced from data.js is stored in @string_to_replace.
            var string_to_replace = "";

            //
            var final_instruction_text = "";


            //mapObj array is used to easily replace the required string data from the data. Add more words at the end for replacing more strings.
            var mapObj = {
               "TOC Text":tocTitle_key,
               "Learning Objectives":learningObjectives_key,
               "Teaching Procedure":teachingProcedure_key,
               "Teacher Language":teacherLanguage_key,
               "Video":videoData_key,
               "Icon":icon_key,
               "Teaching Time":teachingTime_key,
               "Game Activity (Yes/No)":gameActivity_key,
               "Answer Key":answer_key,
               "<b>": "<span class='boldStyle'>",
               "</b>": "</span>",
               "<i>": "<span class='italicStyle'>",
               "</i>": "</span>",
               "<br/></li>": "</li>",
               "font-size:10pt;": ""
            };

            // A function used to remove keys from the data which are not to be added to the prepareData object.
            var removeObjectProperties = function(obj, props) {
                for(var i = 0; i < props.length; i++) {
                    if(obj.hasOwnProperty(props[i])) {
                        delete obj[props[i]];
                    }
                }
            };

            // Discard the columns which are not required in prepareData.
            removeObjectProperties(row_data[0], ["Component", "Week", "Screen", "Level", "Unit", "Instruction Text", "Game Activity (Yes/No)"]);

            // Stringify row_data
            screen_data = JSON.stringify(row_data, null, 2).substr(1).slice(0, -1).trim()+",";

            //Use striptags() to keep only the required HTML tags and remove the others.
            screen_data = striptags(screen_data, ['b', 'i', 'ul', 'li', 'br', 'span']);

            //Replace string function using mapObj array.
            screen_data = screen_data.replace(/TOC Text|Learning Objectives|Teaching Procedure|Teacher Language|Teaching Time|Video|Icon|Answer Key|<b>|<\/b>|<i>|<\/i>|<br\/><\/li>|font-size:10pt;/gi, function(matched){
              return mapObj[matched];
            });

            // &#x000d;&#x000a; and &#10; is HTML character code for <br/>, replace HTML character code with a tag for better styling and computation.
            screen_data = screen_data.replace(/&#x000d;&#x000a;/g, "<br/>");
            screen_data = screen_data.replace(/&#10;/g, "<br/>");
            screen_data = screen_data.replace(/&#x000a;/g, "<br/>");

            /* Since we use <span> for text styling i.e. bold, italics and underline we do not discard span tags, which sometimes does not close every span
              at proper place due to nested <span>. To handle this, multiple double </span> is replaced with one </span>.

               Note: Depends on the code genterated by XLSX.
            */
            screen_data = screen_data.replace(/<\/span><\/span>/g, "</span>");

            /*
              If there is any  <br/> before </span>, than swap the tags. Any <br/> before </span> sometimes breaks the css position of the elements in the DOM.
            */
            if(screen_data.includes("<br/></span>")){
              screen_data = screen_data.replace("<br/></span>", "</span><br/>");
            }
            screen_data += "";
            replace_string = screen_data;

            /*
            Iterate through prepareData_keyword array if there is any variation used for prepareData keyword and fetch the data to be replaced in the data.js
            We fetch the content between the strings '"prepareData": ' and its closing '},' from data.js.

            for(var i = 0; i < prepareData_keyword.length - 1; i++) {
              ...
            }

            From the excel data we get the data in the following form:

            {
              "tocTitle": "Let&apos;s Think About the Story",
              "learningObjectives": "<li>Think critically about the text (problem solving)</li>",
              "teachingProcedure": "<li>Have students sit at their desks with their Activity Books open to the page shown on the board.</li>
              <li>Tap the PEN in the toolbar to enable the writing function on the board.</li>
              "teachingTime": "5 mins",
              "videoData": [
                {}
              ],
              "teacherLanguage": ""
            },

            Since we alreay have a "}," using getFromBetween.get(), replace the ending "}," from the excel data to blank.

            */
            replace_string = replace_string.replace(new RegExp("},"+'$'), "");

            for(var i = 0; i < prepareData_keyword.length - 1; i++) {
              if(file.includes(prepareData_keyword[i])){
                string_to_replace = getFromBetween.get(file,prepareData_keyword[i],'},');
                break;
              }
            }


            // Replace and update the string in the data.js
            result = file.replace(string_to_replace, replace_string);

            /*
              Iterate through itext_keyword array if there is any variation used for instructionText keyword and fetch the data to be replaced in the data.js

            */
            for(var i = 0; i < itext_keyword.length - 1; i++) {
              if(result.includes(itext_keyword[i])){

                var keyword_to_replace = getFromBetween.get(result,itext_keyword[i],'",');

                // If there are more than one instructionText with same value, store to @keyword_to_replace.
                if (keyword_to_replace.length > 1) {
                  keyword_to_replace = keyword_to_replace[0];
                }
                instruction_text = instruction_text.replace(/"/g, "&quot;");
                final_instruction_text = '"'+instruction_text;
                final_instruction_text = final_instruction_text.replace(/<b>|<\/b>|<i>|<\/i>/gi, function(matched){
                  return mapObj[matched];
                });
                break;
              }
            }
            // A replaceAll() added to a String type to replace the multiple values in the data.
            String.prototype.replaceAll = function(target, replacement) {
              return this.split(target).join(replacement);
            };

            // Replace all instructionText value with the instruction text we get from excel.
            final_result = result.replaceAll(keyword_to_replace, final_instruction_text);

            // Update in the data file.
            fs.writeFile(data_file_relative_path, final_result, 'utf8', function (err) {
              if (err) return console.log(err);
              else{
                // console.log("File write successful to "+data_file_relative_path+"\r\n");
              }
            });

        }else{
          console.log("\r\n\r\n Data.js file missing for "+data_file_relative_path);
        }
      }
  });
}



// Used to capitalized first character of string.
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Replace @data between @start and @end index string with Provided text i.e. @what
function replaceBetween(data, start, end, what) {
  return data.substring(0, start) + what + data.substring(end);
}

// Replace [8-10] text
function replaceBrackets() {
  var regex = /[^[\]]+(?=])/g;
  var match = regex.exec(data);
  // debugger;
  if (match != null) {
    var temp = match[0].split("-");
    var unitKey = match.input.charAt(match.index - 2);
    var joinUnits = "";

    var start = match.index - 2;
    var end = match.index + match[0].length + 1;

    for (var i = Number(temp[0]); i <= Number(temp[1]); i++) {
      var a = (i === Number(temp[1]))
        ? ""
        : "-";
      joinUnits += unitKey + i + a;
    }
    data = replaceBetween(data, start, end, joinUnits);
    replaceBrackets();
  }
}

// Replacing key with actual content Ex: "u1" with "unit_1"
function findId(str) {
  var obj = {
    n: "nursery",
    l: "level_",
    u: "unit_",
    c: "checkpoint_"
  };
  var k = str[0];
  var re = new RegExp(k, "g");
  return str.replace(re, obj[k]);
}

// @path: File location with name to read.
function readFile($path, callback) {
  fs.readFile($path, "utf8", function(err, data) {
    if (err === null) {
      callback(JSON.parse(JSON.stringify(data)));
    } else {
      console.log("Error!!! File not found at " + $path);
    }
  });
}

// @path: File location with name to write/create.
// @content: Content to add in file
function createFile($path, $content, callback) {
  fs.writeFile($path, $content, function() {
    callback();
  });
}
