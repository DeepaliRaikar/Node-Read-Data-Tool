SEE Content Update is used to update the prepare data and the other text on the screen by running one single command.

Steps are to update are as follows:

- Locate the Scholastic/04_Tech/Development on your system.
- Git bash in the Development folder and run the command "node see_content_update.js".
- You can update single/multiple units from single/multiple levels in the similar way we select for creating a build.

      Below are some sample inputs for reference.

        1. For SINGLE Level SINGLE Unit    - l1-u1
        2. For SINGLE Level MULTIPLE Units - l1-u1-u2-u3 OR l1-u[1-3]
        3. For MULTIPLE Levels             - l1-u1-c1 l2-u1-u2


The data is updated to the data.js using the Prepare mode excel sheet provided by the client.
The excel files must be present in the folder "Scholastic/01_Client_Inputs/Prepare_Data".
The name for the excel sheet should be given with the level and the unit name.
  Example:
    - For Level 1 Unit 1 - level_1_unit_1.xlsx
    - For Level 1 Unit 2 - level_1_unit_2.xlsx
    - For Level 2 Unit 1 - level_2_unit_1.xlsx


The Data file will be updated only if :
  - the excel sheet of file name with the above named convention is present in the "Prepare_Data" folder.

    else

    It will give the following error message in the bash window if the excel file for the selected unit is not present in the folder.
        Example:
          - l2-u2 (If file does not exist for level 2 unit 2) error message will look like:
                "File does not exist../../01_Client_Inputs/Prepare_Data/level_2_unit_2.xlsx".

  - the data.js is present for every screen.

    else

    It will give the following error message in the bash window if the data.js for a specific screen in the selected unit is not present in the courses folder.
        Example:
          - l1-u1 (If data.js is missing for level_1 > unit_1 > week_2 > writing > screen_1 ) error message will look like:
                "Data.js file missing for ./src/courses/level_1/unit_1/week_2/writing/screen_1/data.js".



Functions Used

- checkFileExist(file_location)
  This function checks if the given file is present in the location. If the file exists it makes a call to the next function "writeToDataFile()".
    file_location - the file name with its file_location
    example : ../../01_Client_Inputs/Prepare_Data/level_2_unit_3.xlsx

- writeToDataFile()
  This is the function which has the actual functionality for prepareData tool.
