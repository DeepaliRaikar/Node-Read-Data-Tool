/*
  ========== DEVELOPER INSTRUCTIONS ==========
  1. Please check the excel headings and the headings written in the code.
  2. Values are computed as per the required output for Level, Screen, Main section, Unit. This computation may vary if any change is made in the excel file.
  3. New headings reference may need to be added to discard/add the column data to prepareData.
*/

// include file system module
var fs = require('fs');
// include XLSX to read an excel worksheet
var XLSX = require('xlsx');
var striptags = require('striptags');
var workbook = XLSX.readFile('L1U2_Teaching Guide for Prepare Mode_Updated_FINAL.xlsx');

var sheet_name_list = workbook.SheetNames;
var row_data = [" "];
var replace_string = "";
var final_result = "";

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
sheet_name_list.forEach(function(worksheet_name) {
    var worksheet = workbook.Sheets[worksheet_name];
    worksheet['!rowBreaks'];
    var headers = {};
    var data = [];
    var week = "";

    //Replace all '-' to '_' from the worksheet name and convert to lowercase.
    worksheet_name = worksheet_name.replace('-', '_').toLowerCase();

    // Since each worksheet is for a single week, store each worksheet name to week as you iterate.
    //week = worksheet_name;

    // Iterate through each cell in the worksheet.
    for(cell_address in worksheet) {
        if(cell_address[0] === '!') continue;
        //parse out the column, row, and value.
        var col = cell_address.substring(0,1);
        var row = parseInt(cell_address.substring(1));
        // worksheet[cell_address].h ('.h' returns the cell data along with the HTML tags). We require this since we want to apply styling too for the data.
        var value = worksheet[cell_address].h;
        var format_value = value;

        //Split the cell data using '•' as delimiter to display data as unordered list.
        if(format_value != undefined && JSON.stringify(format_value).includes("•")){
          var cell_data_list = {};
          var formatted_cell_data_list = "";
          cell_data_list = format_value.split("•");
          cell_data_list.shift();
          cell_data_list.forEach(function(el){
            formatted_cell_data_list += "<li>"+el.trim()+"</li>";
          });
          // &#x000d;&#x000a; is HTML character code for <br/>, replace HTML character code with a tag for better styling and computation.
          formatted_cell_data_list = formatted_cell_data_list.replace(/&#x000d;&#x000a;/g, "<br/>");
          formatted_cell_data_list = formatted_cell_data_list.replace(/&#10;/g, "<br/>");

          //Remove extra <br/> which breaks the text alignment.
          formatted_cell_data_list = formatted_cell_data_list.replace(/<br\/><\/li>/g, "</li>");

          if(formatted_cell_data_list.includes("<br/>")){
            formatted_cell_data_list = formatted_cell_data_list.replace("<br/>", "</li>");
            formatted_cell_data_list = formatted_cell_data_list.replace(new RegExp("</li>"+'$'), "");
          }
          if(formatted_cell_data_list.includes('<span style=\"text-decoration: underline;font-size:10pt;\"></li>')){
            formatted_cell_data_list = formatted_cell_data_list.replace('<span style=\"text-decoration: underline;font-size:10pt;\"></li>', "</li><span style=\"text-decoration: underline;\">");
          }

          formatted_cell_data_list = formatted_cell_data_list.replace(/<\/li>(?!.*<\/li>)/, '</li>');
          value = formatted_cell_data_list.trim();
        }

        //store header names.
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
      var relative_path = "";
      row_data.shift();
      row_data.push(data[data_count-1]);
      var regex_video_data = /\*{1,}/g;

      // Store the Level, unit, section name and screen number to use it in the relative path.
      if(row_data[0]["Video"] == undefined || regex_video_data.test(row_data[0]["Video"])){
        row_data[0]["Video"] = [{}];
      }

      if(row_data[0]["TOC Text"].includes(".")){
        var toc_title_text = row_data[0]["TOC Text"].split(".");
        row_data[0]["TOC Text"] = "<b>"+toc_title_text.pop()+"</b>";
        row_data[0]["TOC Text"] = row_data[0]["TOC Text"].replace("</span>","");
      }
      if(row_data[0]["Teacher Language"] == undefined){
        row_data[0]["Teacher Language"] = "";
      }else{
        row_data[0]["Teacher Language"] = "<i>"+row_data[0]["Teacher Language"]+"</i>";
      }
      //Considering Level value to be 'level_1', 'level_2' etc.
      var level_name = row_data[0]["Level"].toLowerCase();
      // var level = level_name.substring(0,1);
      // level_name = level_name.replace(level, "level_");

      //Considering unit value to be 'unit_1', 'unit_2' etc.
      var unit_name = row_data[0]["Unit"].toLowerCase();
      // var unit = unit_name.substring(0,1);
      // unit_name = unit_name.replace(unit, "unit_");

      week = row_data[0]["Week"].toLowerCase();

      // Store the Section name to use it in the relative path.
      var section_name = row_data[0]["Component"].replace('-', '_').toLowerCase();
      var teaching_time = "("+row_data[0]["Teaching Time"]+")";

      //Store the Screen number to use it in the relative path.   //Considering Screen value to be '1/5', '2/5' etc.
      // var screen_num = row_data[0]["Screen"].split("/",1);
        //Store the Screen number to use it in the relative path.   //Considering Screen value to be 'screen_1', 'screen_2' etc.
      var screen_num = row_data[0]["Screen"].toLowerCase();
      var instruction_text = "";
      if(row_data[0]["Instruction Text"] != undefined){
        instruction_text = row_data[0]["Instruction Text"];
      }else{
        instruction_text = "No instructions";
      }

      var tocTitle_key = "tocTitle",
          learningObjectives_key = "learningObjectives",
          teachingProcedure_key = "teachingProcedure",
          teacherLanguage_key = "teacherLanguage",
          teachingTime_key = "teachingTime",
          videoData_key = "videoData",
          icon_key = "icon",
          gameActivity_key = "gameActivity";
          // itext_key = "itext";

      /* Relative path of the data.js looks something like this - level_name/unit_name/week/section_name/screen_num/data.js
       i.e. level_1/unit_1/week_1/phonics/screen_1/data.js */
      relative_path += "./"+level_name+"/"+unit_name+"/"+week+"/"+section_name+"/"+screen_num+"/";

      /* fs.existsSync(path){
             Do something if the file exists
         } */
      if (fs.existsSync(relative_path+"data.js")) {
          var file = fs.readFileSync(relative_path+'data.js', "utf8");

          //An array created to check for all the variations of 'instructionText' keyword used in the data files.
          var itext_keyword = ['itext:', 'itext :', '"itext":', '"itext" :', 'instText:', 'instText :', '"instText":', '"instText" :', 'instructionText:', 'instructionText :', '"instructionText":', '"instructionText" :', 'bottomInstruction:', 'bottomInstruction :', '"bottomInstruction":', '"bottomInstruction" :', 'itextNext:'];

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
             "<b>": "<span class='boldStyle'>",
             "</b>": "</span>",
             "<i>": "<span class='italicStyle'>",
             "</i>": "</span>",
             "<br/></li>": "</li>",
             "font-size:10pt;": ""
          };
          var removeObjectProperties = function(obj, props) {
              for(var i = 0; i < props.length; i++) {
                  if(obj.hasOwnProperty(props[i])) {
                      delete obj[props[i]];
                  }
              }
          };

          // Discard the columns which are not required.
          removeObjectProperties(row_data[0], ["Component", "Week", "Screen", "Level", "Unit", "Instruction Text", "Game Activity (Yes/No)"]);

          // Stringify row_data
          screen_data = JSON.stringify(row_data, null, 2).substr(1).slice(0, -1).trim()+",";

          //Use striptags() to remove non-required tags.
          screen_data = striptags(screen_data, ['b', 'i', 'ul', 'li', 'br', 'span']);

          //Replace string function using mapObj array.
          screen_data = screen_data.replace(/TOC Text|Learning Objectives|Teaching Procedure|Teacher Language|Teaching Time|Video|Icon|<b>|<\/b>|<i>|<\/i>|<br\/><\/li>|font-size:10pt;/gi, function(matched){
            return mapObj[matched];
          });

          screen_data = screen_data.replace(/&#x000d;&#x000a;/g, "<br/>");
          screen_data = screen_data.replace(/&#10;/g, "<br/>");
          screen_data = screen_data.replace(/<\/span><\/span>/g, "</span>");
          screen_data += "";
          replace_string = screen_data;

          replace_string = replace_string.replace(new RegExp("},"+'$'), "");

          // Fetch the string to be replaced from '"prepareData":' to '"},"'.
          var string_to_replace = getFromBetween.get(file,'"prepareData":','},');

          // Replace and update the string
          result = file.replace(string_to_replace, replace_string);
          // result = result.replace("&#x000d;&#x000a;", "<br/>");

          // result = result.replace("&#x000d;&#x000a;", "<br/>");
          var final_instruction_text = "";
          for(var i = 0; i < itext_keyword.length - 1; i++) {
            if(result.includes(itext_keyword[i])){
              var keyword_to_replace = getFromBetween.get(result,itext_keyword[i],'",');
              instruction_text = instruction_text.replace(/"/g, "&quot;");
              final_instruction_text = '"'+instruction_text;
              final_instruction_text = final_instruction_text.replace(/<b>|<\/b>|<i>|<\/i>/gi, function(matched){
                return mapObj[matched];
              });
              break;
            }
          }
          final_result = result.replace(keyword_to_replace, final_instruction_text);
          // Update in the data file.

          fs.writeFile(relative_path+'data.js', final_result, 'utf8', function (err) {
            if (err) return console.log(err);
          });

      }else{
        console.log("Data.js file missing for "+relative_path);
      }
    }
});
