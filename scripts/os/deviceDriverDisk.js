/* ----------------------------------
   DeviceDriverDisk.js
   
   Requires deviceDriver.js
   
   The Kernel Disk Device Driver.
   ---------------------------------- */


// Defines all the file id constants.
FileID.T = 4;
FileID.S = 8;
FileID.B = 8;
FileID.BSIZE = 64;

/**
 * A fileID class to make incrementing easier for file operations.
 */
function FileID()
{
    this.track  = 0;
    this.sector = 0;
    this.block  = 0;
}

/**
 * Increments the fileID by one and cascades any carries.
 * 
 */
FileID.prototype.increment = function()
{
    this.block++;
    
    if(this.block >= FileID.B)
    {
        this.block = 0;
        this.sector++;
        
        if(this.sector >= FileID.S)
        {
            this.sector = 0;
            this.track++;
            
            if(this.track >= FileID.T)
            {
                // Error goes here.
                return false;
            }
        }
    }
    
    return true;
};

/**
 * The toString functionalit of the FileID class.
 */
FileID.prototype.toString = function()
{
    return "FlynnOS:"+this.track + "," + this.sector + "," + this.block;
};

// File Block Constants
FileBlock.EMPTY    = "00";
FileBlock.OCCUPIED = "01"; 

/**
 * Defines the file block class that represents the contents of a single track, sector and block.
 * @param fileID The unique id for the file on the file system.
 */
function FileBlock(fileID)
{
    this.statusBit = FileBlock.EMPTY;    // Init to empty.
    this.nextID    = fileID || new FileID();
    this.data      = ["00", "00", "00", "00" ,"00",
                    "00", "00", "00", "00" ,"00",
                    "00", "00", "00", "00" ,"00",
                    "00", "00", "00", "00" ,"00",
                    "00", "00", "00", "00" ,"00",
                    "00", "00", "00", "00" ,"00",
                    "00", "00", "00", "00" ,"00",
                    "00", "00", "00", "00" ,"00",
                    "00", "00", "00", "00" ,"00",
                    "00", "00", "00", "00" ,"00",
                    "00", "00", "00", "00" ,"00",
                    "00", "00", "00", "00" ,"00"];
}

/**
 * Zeroes an array.
 * @param data the array to zero.
 */
FileBlock.zero = function(data)
{
    for (var index = 0; index < data.length; index++)
    {
        data[index] = FileBlock.EMPTY;
    }
};

DeviceDriverDisk.prototype = new DeviceDriver;  // "Inherit" from prototype DeviceDriver in deviceDriver.js.

/**
 * The actual device driver.
 */
function DeviceDriverDisk()                     // Add or override specific attributes and method pointers.
{
    // "subclass"-specific attributes.
    
    // Override the base method pointers.
    this.driverEntry = krnDiskDriverEntry;
    this.isr = krnDiskDispatch;
    // "Constructor" code.
}

DeviceDriverDisk.feedbackMessage={
    "CREATE":{
        0:{"message": "File Creation Failed: Handle and Data Allocation failure", "retVal":false},
        1:{"message": "File Creation Failed: Data Allocation failure", "retVal":false},
        2:{"message": "File Creation Failed: Handle Creation failure", "retVal":false},
        3:{"message": "File Creation Success", "retVal":true},
        "-1":{"message": "Bad File Name, your file has bad characters (Quite frankly I'm impressed)", "retVal":false},
        4:{"message": "Bad File Name, please ensure your file doesn't already exist", "retVal":false}
        },
    "WRITE":{
        0:{"message": "File Write Success", "retVal":true}, 
        1:{"message": "File Write Failed: Ran out of disk space", "retVal":false},
        2:{"message": "File Write Failed: File name not found", "retVal":true}    
    }
};

DeviceDriverDisk.prototype.log = function(msg)
{
    simLog(msg,LOGGER_SOURCE.DISK);
};

function krnDiskDriverEntry()
{
    this.status = "loaded";
}

/**
 * The ISR. Designed to handle all legal file ops.
 * @param params 0 - fs operation
 *               1 - fileName
 *               2 - data
 *               3 - callback function [invoking object, function, args]
 */
function krnDiskDispatch(params)
{
    var results = "";
    var response = {"message": "", "retVal":""};
    
    switch(params[0])
    {
        case FS_OPS.CREATE:
            results = DiskCreateFile(params[1]); // Assumes that the filename is a string.   
            
            response.retVal = true;
            
            if(results < 0)
            {
                results *= -1;
                response.message += DeviceDriverDisk.feedbackMessage.CREATE["-1"].message;
                response.retVal = DeviceDriverDisk.feedbackMessage.CREATE["-1"].retVal;
            }
            
            if(results > 3)
            {
                results -= 4;
                response.message += response.message === "" ?  "" : "; ";
                response.message += DeviceDriverDisk.feedbackMessage.CREATE["4"].message;
                response.retVal = response.retVal && DeviceDriverDisk.feedbackMessage.CREATE["4"].retVal;
            }
            
            response.message = (response.message === "" ?  "" : "; ") + response.message;
            response.message = DeviceDriverDisk.feedbackMessage.CREATE[results].message + response.message;
            response.retVal = response.retVal && DeviceDriverDisk.feedbackMessage.CREATE[results].retVal;
            
            
            break;
        case FS_OPS.READ:
            results = DiskReadFile(params[1],params[2]);
            
            if(results === null)
            {
                response.message = "File \"" + params[1] + "\" not found!";
                response.retVal  = null;
            }
            else
            {
                response.message = results.toString();
                response.retVal  = results; 
            }
            
            break;
            
        case FS_OPS.WRITE:
            // params 1 - filename (string)
            // params 2 - data (string or array of hex digits)
            
            results = DiskWriteFile(params[1], params[2]);   
            response = DeviceDriverDisk.feedbackMessage.WRITE[results];
            
            break;      
            
        case FS_OPS.DELETE:
            
            results = DiskDelete(params[1]);
            
            response.retVal = results;
            
            if(results)
            {
                response.message = "Deletion of \"" + params[1] + "\" was a success!";
            }
            else
            {
                response.message = "Deletion of \"" + params[1] + "\" failed!";
            }
            break;
            
        case FS_OPS.FORMAT:
            results = DiskFormat();
            
            if(results)
            {
                response = {"message":"Disk Format was successful!", "retVal":true};
            }
            else
            {
                response = {"message":"Disk Format was unsuccessful!", "retVal":false};
            }
            
            break;    
            
        case FS_OPS.LS:
            results = DiskList();
            
            for(var index in results)
            {
                response.message+=results[index] + " ";
            }
            
            response.retVal = results;
            
            break;
            
        default:
            break;
    }
    
    this.log(FS_OPS.OPS[params[0]] + " : " + response.message);
    
    if (params[3] && Array.isArray(params[3]) )
    {
        params[3][1].call(params[3][0], params[3][2], response.retVal);
    }    
    else if(params[3])
    {
        params[3].call(null,response.message);
    }
    else{
        this.log("No callback specified.");
    }
    
}

// ----------------------- Helper functions -----------------------------------
/**
 * Converts a string to an array containing hexadecimal values for storage.
 * 
 * @param toConvert The string in question to convert to hexadecimal.
 * 
 * @return A null terminated character array (think cstring but with hex).
 */
function DiskStringToHex(toConvert)
{
    // Make the string into an array of hex strings.
    var charArray = toConvert.split('');
    
    // convert to the hex char codes.
    for (var index = 0; index < charArray.length; index++)
    {
        charArray[index] = padZeros(charArray[index].charCodeAt(0).toString(16),2);
    }
    
    // If it doesn't exactly fill the block null terminate the string.
    // As index is exactly the length we don't need to get the length from the array.
    if(index % 60 !== 0)
        charArray[index] = "00";
    
    return charArray;
}

/**
 * The actual accessor for the HDD, ensures a consistent data formatting even in 
 * the case of reclaimed FileIDs (what I call the TSB object).
 * 
 * @param tsb A FileID object that points to the desired location.
 * 
 * @return null if address was bad. 
 *          a FileBlock if address was good.
 */
function DiskRetrieveTSB (tsb)
{
    // Note the FlynnOS prefix ensures that my filesystem doesn't collide with any other keys.
    var contents = localStorage["FlynnOS:"+tsb.track + "," + tsb.sector + "," +     
        tsb.block];
    
    if(contents)
        return JSON.parse(contents);
        
    return null;
}

/**
 * The writer to the file system. Ensures a consistent fileID pattern.
 * 
 * @param tsb A FileID object that points to the desired location.
 * 
 * @param block The block that needs to be written to the file system.
 * 
 */
function DiskWriteToTSB (tsb, block)
{
    // TODO should there be a check here?
    localStorage["FlynnOS:"+tsb.track + "," + tsb.sector + "," + tsb.block] 
        = JSON.stringify(block);
}

/**
 * Used in the FindFile function, compares the fileName being sought against the 
 * contents of the file directory.
 * 
 * @param fileName The file name you wish to verify.
 * 
 * @param data The data that you want to check for the file name.
 * 
 * @return True if the fileName is a match, false otehrwise.
 */
function DiskCompareFileName (fileName, data)
{
    var retVal = true;
    
    // Check the data for only as long as the filename is.
    for (var index=0; index <  fileName.length; index++)
    {
        retVal = (retVal && fileName[index] === data[index]);
        
        if(!retVal)
            break;
    }
    return retVal;
}

/**
 * Attempts to find the file on the file system with a matching name.
 * 
 * @param fileName The file name to seek out.
 * 
 * @return The location of the file as a FileID, null if not found.
 */
function DiskFindFile (fileName)
{
    // If the fileName exceeds the block size it doesn't exist.
    if(fileName.length > FileID.BSIZE - 4)
    { 
        return null;
    }
    
    // Make the fileName a hexarray and set up the place holders.
    var fileChars = DiskStringToHex(fileName);    
    var newID = new FileID();
    var block = null;
    
    // Jump the MBR.
    newID.increment();
    
    // Seek it out and break out when the file is found or at the end of the track.
    while (newID.track < 1)
    {        
        block = DiskRetrieveTSB(newID);
        
        if (DiskCompareFileName(fileChars,block.data))
        {
            break;
        }
        newID.increment();
    }
    
    // sets the newID to null if the file wasn't discovered.
    if( newID.track === 1)
        newID = null;
    
    return newID;    
}

/**
 * Searches for the first file with the status bit set to "00" in the file system.
 * 
 * @return null if the directory space is full.
 */
function DiskFindFreeFile ()
{
    // Placeholder variables.
    var newID = new FileID();
    var block = null;
    
    // Jump the MBR.
    newID.increment();
    
    // Search for the first empty file.
    while (newID.track < 1)
    {        
        block = DiskRetrieveTSB(newID);
        
        if (block.statusBit === "00")
        {
            break;
        }
        newID.increment();
    }
     
     
    // If true then no empty file space is present (at least for the handle).
    if( newID.track === 1)
        newID = null;
    
    return newID;
}

/**
 * Finds the first free data location on the file system.
 * @return null if the free space was not present, the id if found.
 */
function DiskFindFreeSpace ()
{
    var newID = new FileID();
    var block = null;    
    var found = false;
    
    newID.track = 1;
    
    do
    {        
        block = DiskRetrieveTSB(newID);
        
        if (block.statusBit === "00")
        {
            found = true;
            break;
        }
    }while(newID.increment());
    
    return found?newID:null;
}

/**
 * Converts the hex character array to human readable characters.
 * @param chars The hex character array that is null terminated (hopefully...)
 * @return A string containing the converted array.
 */
function DiskConvertFromHex(chars)
{
    var str  = "";
    
    for (var index in chars)
    {
        str+= String.fromCharCode("0x" + chars[index]);
        
        if(chars[index] === "00")
            break;
    }
    
    return str;
}
// ----------------------- End helper functions --------------------------------


/**
 * The file system formatter. Zeroes out the entire file system in accordance to the 
 * base formatting for the file system.
 */
function DiskFormat ()
{
    var newID = new FileID();
    
    var tempFile = new FileBlock();
    
    tempFile.statusBit = FileBlock.OCCUPIED;
    DiskWriteToTSB(newID,tempFile);
    tempFile.statusBit = FileBlock.EMPTY;

    while(newID.increment())
    {
        DiskWriteToTSB(newID,tempFile);
    }
    
    // I see no forseeable manner in which this can fail that wouldn't crash the OS as well.
    return true;
}

/**
 * Creates a file on the file system and allocates its first block on the "HDD"
 * @param fileName The name of the new file.
 * @return 0 - both file handle creation and data allocation failed.
 *         1 - good file handle creation bad data allocation.
 *         2 - good data allocation bad file handle creation.
 *         3 - everything worked out.
 *         >3 - bad fileName. 
 *         <0 - file already exists.
 */
function DiskCreateFile (fileName)
{
    var retCode = 0;
    
    // Make the blocks
    var fileDescriptor    = new FileBlock();
    var contentDescriptor = new FileBlock();
    
    // Check for an available file.
    var fileHandle = DiskFindFreeFile();
    retCode += fileHandle === null ? 0 : 1;
    
    // Check for available file data space.
    var contentID  = DiskFindFreeSpace();
    retCode += contentID === null ? 0 : 2;
    
    // Do a check of the file name.
    var fileChars = DiskStringToHex(fileName);
    retCode += (fileChars !== null && fileChars.length <= FileID.BSIZE-4) ? 0 : 4;
    
    // Checks
    if(DiskFindFile(fileName) !== null)
        retCode *= -1;
    
    
    // RetCode 3 indicates a valid file.
    if(retCode === 3)
    {
        // Set up the file block that will contain the file name and a chain to the file.
        fileDescriptor.nextID       = contentID;
        fileDescriptor.statusBit    = FileBlock.OCCUPIED;
        
        // Add the name to the file block
        for ( var index = 0, length = fileChars.length > FileID.BSIZE? FileID.BSIZE : fileChars.length; 
            index < length;
            index++)
        {
            fileDescriptor.data[index] = fileChars[index];
        }
    
        // Set the data status bit.
        contentDescriptor.statusBit = FileBlock.OCCUPIED;
        
        // Writes the prepared blocks to the actual file system.
        DiskWriteToTSB(contentID,contentDescriptor);
        DiskWriteToTSB(fileHandle,fileDescriptor);
    }
    
    return retCode;
}

/**
 * Reads the specified file from the file system if found.
 * By supplying the literal field as true function returns an array of the 
 * whole chain of hex digits. If literal is not set the hex is decoded as a null 
 * terminated string.
 * 
 * @param fileName The max 60 character fileName that is to be read.
 * @param literal  Optional - Specifies whether this should return the exact 
 *                  contents (e.g. array of hex codes when set true) or the 
 *                  decoded null terminated ascii string.
 * @return literal === true - An array of hex values.
 *         literal === false or undefined - A string.
 *         badFileName - null.
 */
function DiskReadFile (fileName, literal)
{
    var currentID      = DiskFindFile(fileName);
    
    // If the ID is null here it is assumed the file wasn't found.
    if(currentID === null)
        return null;
        
    // Get the first content block and start the  aggregation variable out.
    var currentContent  = DiskRetrieveTSB(currentID);
    var aggregateValues = [];    
    currentID           = currentContent.nextID;
    
    // Until the chain ends aggregate the file contents.
    while (currentID.track !== 0 || currentID.sector !== 0 ||  currentID.block !== 0)
    {
        currentContent  = DiskRetrieveTSB(currentID);
        
        aggregateValues = aggregateValues.concat(currentContent.data);
        
        currentID       = currentContent.nextID;
    }
    
    // Literal is to be used for code, otherwise assume a null terminated and encoded string.
    if(literal === true)
    {
        return aggregateValues;
    }
    else
    {
        return DiskConvertFromHex(aggregateValues);
    }
}

/**
 * Write the supplied data to the specified filename. This is an overwrite!
 * 
 * @param fileName A string containing the user defined filename.
 * 
 * @param data Either a string or array of Hex character codes (this is for the 
 *      sake of making swap simpler).
 * 
 *  @return 0 - write was complete.
 *          1 - write ran out of space.
 *          2 - file not found.
 *
 */
function DiskWriteFile (fileName, data)
{
    // Check to see which type of data we're dealing with and react acordingly.
    var dataChars  = typeof data === "string" ? DiskStringToHex(data) : data;
    
    // Convert the file name and check to see if it is valid.
    var hexName    = DiskFindFile(fileName);

    if(hexName === null)
    {
        return 2;
    }
    
    // If all was good start building.
    var fileHandle = DiskRetrieveTSB(hexName);
    var currentID  = fileHandle.nextID;
    var content    = DiskRetrieveTSB(fileHandle.nextID);
    
    if(dataChars[0])
        content.data[0] = dataChars[0];
    else
        content.data[0] = "00";

    // Iterate over the data length and write to the file, allocating new blocks as needed.
    for (var index = 1; index < dataChars.length; index ++)
    {
        if( index  % 60 === 0 && 
            content.nextID.track === 0  && 
            content.nextID.sector === 0 && 
            content.nextID.block === 0)
        {
            content.nextID = DiskFindFreeSpace();
            
            if(content.nextID  === null)
            {
                return 1;
            }
            
            DiskWriteToTSB(currentID, content);
            
            currentID = content.nextID;     
            
            content = DiskRetrieveTSB(currentID);
            
            content.statusBit = FileBlock.OCCUPIED;
            
            DiskWriteToTSB(currentID, content);
        }
        else if ( index % 60 === 0)
        {
           DiskWriteToTSB(currentID, content);
            
            currentID = content.nextID;     
            
            content = DiskRetrieveTSB(currentID);
            
            content.statusBit = FileBlock.OCCUPIED;   
        }
        content.data[index % 60] = dataChars[index];
    }

    // Clear out the remaining data in the block.
    for (var clearIndex = index % 60; clearIndex < 60;clearIndex++)
    {
        content.data[clearIndex] = "00";
    }
    
    // Destroy any remaining chains of data.
    if(content.nextID.track !== 0 || content.nextID.sector !== 0 ||  content.nextID.block !== 0)
    {

        DiskDeleteID(content.nextID);
        
        // Zero the nextID.
        content.nextID = new FileID();
    }    
    
    DiskWriteToTSB(currentID, content);
    
    return 0;
}

/**
 * Deletes the supplied file.
 * 
 * @param fileName The file string that doesn't exceed 60 characters.
 * 
 * @return true - file found
 *         false - file not found.
 */
function DiskDelete (fileName)
{   
    var hexName = DiskFindFile(fileName);
    
    if(hexName !== null)
    {
        DiskDeleteID(hexName);
        return true;
    }
    else
    {
        // TODO add a failure message!
        return false;
    }
}

/**
 * Deletes the supplied track, sector block.
 * 
 * @param tsb The Track, Sector and Block to delete.
 * 
 */
function DiskDeleteID(tsb)
{
    // Do the priming work,
    var currentID        = tsb;
    var tempID           = currentID;
    var fileHandle       = DiskRetrieveTSB(currentID);
    var fileContent      = null;
    
    // Clear out the file handle's file block.
    fileHandle.statusBit = FileBlock.EMPTY;
    FileBlock.zero(fileHandle.data);    
    tempID = fileHandle.nextID;
    fileHandle.nextID = new FileID();
    
    // Write back the changes.
    DiskWriteToTSB(currentID, fileHandle);    
    
    currentID = tempID;

    // While the tsb isn't all zeros continue to delelte the chain.
    while(currentID.track !== 0 || currentID.sector !== 0 ||  currentID.block !== 0)
    {
        // Retrieve the content from the fs then set it as empty.
        fileContent           = DiskRetrieveTSB(currentID);
        fileContent.statusBit = FileBlock.EMPTY;
        
        // Zero the data (for simplicity's sake not realism sake)
        FileBlock.zero(fileContent.data);    
        
        // Save the next ID and then zero it on the fileContent block.
        tempID                = fileContent.nextID;
        fileContent.nextID    = new FileID();
        
        // Write the wiped TSB then move onto the next id.
        DiskWriteToTSB (currentID, fileContent);
        currentID             = tempID;
    }
}

/**
 * The ls functionality. Aggregates all of the filenames that exist on the file system.
 * @return An array containing all of the filenames in the file system.
 */ 
function DiskList()
{
    // Placeholder variables.
    var searchID = new FileID();
    var block = null;
    var fileList = [];
    
    // Jump the MBR.
    searchID.increment();
    
    // Search for the first empty file.
    while (searchID.track < 1)
    {        
        block = DiskRetrieveTSB(searchID);
        
        if (block.statusBit === "01")
        {
            fileList.push(DiskConvertFromHex(block.data));
        }
        searchID.increment();
    }
    
    return fileList;
}
