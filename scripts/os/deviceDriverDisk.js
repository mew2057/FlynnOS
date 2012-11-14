/* ----------------------------------
   DeviceDriverDisk.js
   
   Requires deviceDriver.js
   
   The Kernel Disk Device Driver.
   ---------------------------------- */
   
FileID.T = 4;
FileID.S = 8;
FileID.B = 8;
FileID.BSIZE = 64;

function FileID()
{
    this.track  = 0;
    this.sector = 0;
    this.block  = 0;
}
FileID.create = function(t, s, b)
{
    var newBlock = new FileID();
    
    if (t  < FileID.T)
        newBlock.track  = t;
    
    if (s < FileID.S)
        newBlock.sector = s;
        
    if (b < FileID.B)
        newBlock.block  = b;
};

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

FileID.prototype.toString = function()
{
    return "FlynnOS:"+this.track + "," + this.sector + "," + this.block;
};

FileID.prototype.toStore = function()
{
    return padZeros(this.track.toString(16), 2) + 
        " " + padZeros(this.sector.toString(16), 2) + 
        " " + padZeros(this.block.toString(16), 2) + " ";
};


FileBlock.EMPTY   = "00";
FileBlock.OCC     = "01";

function FileBlock(fileID)
{
    this.statusBit = FileBlock.EMPTY;    // Init to empty.
    this.nextID    = fileID ? fileID : new FileID();
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

FileBlock.zero = function(data)
{
    for (var index = 0; index < data.length; index++)
    {
        data[index] = "00";
    }
};

DeviceDriverDisk.prototype = new DeviceDriver;  // "Inherit" from prototype DeviceDriver in deviceDriver.js.

function DeviceDriverDisk()                     // Add or override specific attributes and method pointers.
{
    // "subclass"-specific attributes.
    
    // Override the base method pointers.
    this.driverEntry = krnDiskDriverEntry;
    this.isr = krnDiskDispatch;
    // "Constructor" code.
}

function krnDiskDriverEntry()
{
    this.status = "loaded";
}

function krnDiskDispatch(params)
{
    switch(params[0])
    {
        case "create":
            DiskCreateFile(params[1]); // Assumes that the filename is a string.
            break;
        case "write":
            // params 1 - filename (string)
            // params 2 - data (string or array of hex digits)
            DiskWriteFile(params[1], params[2]);    
            break;
        case "read":
            // TODO place this data somewhere worthwhile.
            DiskReadFile(params[1],params[2]);
            break;
        case "delete":
            DiskDelete(params[1]);
            break;
        case "format":
            DiskFormat();
            break;    
        default:
            break;

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
    // Make the string into an array.
    var charArray = toConvert.split('');
    
    // convert to the hex char codes.
    for (var index = 0; index < charArray.length; index++)
    {
        charArray[index] = padZeros(charArray[index].charCodeAt(0).toString(16),2);
    }
    
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
        //error 
        return;
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
    // XXX match this to DiskFindFreeFile?
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
    }while (newID.increment());
    
    return found?newID:null;
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
    
    tempFile.statusBit = FileBlock.OCC;
    DiskWriteToTSB(newID,tempFile);
    tempFile.statusBit = FileBlock.EMPTY;

    while(newID.increment())
    {
        DiskWriteToTSB(newID,tempFile);
    }
    
    /*
    DiskCreateFile("test");
    console.log(localStorage);
    console.log(DiskFindFile("test"));
    DiskWriteFile("test","Testing 12345678910 hello hello hello Testing 12345678910 hello");
    console.log(DiskReadFile("test"));
    DiskWriteFile("test","Yo dawg");
    console.log(localStorage);
    DiskDelete("test");
    console.log(localStorage);
    DiskCreateFile("tes");
    console.log(DiskFindFile("tes"));
    DiskWriteFile("tes","Testing 12345678910 hello hello hello Testing 123456789");
    console.log(localStorage);
    */
}

/**
 * Creates a file on the file system and allocates its first block on the "HDD"
 * @param fileName The name of the new file.
 */
function DiskCreateFile (fileName)
{
    // TODO size chacking, already existing check.
    var fileDescriptor    = new FileBlock();
    var contentDescriptor = new FileBlock();
    var fileHandle = DiskFindFreeFile();
    var contentID  = DiskFindFreeSpace();
    var fileChars = DiskStringToHex(fileName);
    
    
    if(fileHandle !== null && contentID !== null)
    {
        fileDescriptor.nextID       = contentID;
        fileDescriptor.statusBit    = FileBlock.OCC;
        
        for ( var index = 0, length = fileChars.length > FileID.BSIZE? FileID.BSIZE : fileChars.length; index < length;index++)
        {
            fileDescriptor.data[index] = fileChars[index];
        }
    
        contentDescriptor.statusBit = FileBlock.OCC;
        
        DiskWriteToTSB(contentID,contentDescriptor);
        
        DiskWriteToTSB(fileHandle,fileDescriptor);
    }
}

/**
 * Write the supplied data to the specified filename.
 * 
 * @param fileName A string containing the user defined filename.
 * 
 * @param data Either a string or array of Hex character codes (this is for the 
 *      sake of making swap simpler).
 *
 */
function DiskWriteFile (fileName, data)
{
    var dataChars  = typeof data === "string" ? DiskStringToHex(data) : data;
    var fileHandle = DiskRetrieveTSB(DiskFindFile(fileName));
    var currentID  = fileHandle.nextID;
    var content    = DiskRetrieveTSB(fileHandle.nextID);
    
    content.data[0] = dataChars[0];
     
    for (var index = 1; index < dataChars.length; index ++)
    {
        if( (index + 4) % 64 === 0 && 
            content.nextID.track === 0  && 
            content.nextID.sector === 0 && 
            content.nextID.block === 0)
        {
            content.nextID = DiskFindFreeSpace();
            
            DiskWriteToTSB(currentID, content);
            
            currentID = content.nextID;     
            
            content = DiskRetrieveTSB(currentID);
            
            content.statusBit = FileBlock.OCC;
        }
        else if ( (index + 4) % 64 === 0)
        {
           DiskWriteToTSB(currentID, content);
            
            currentID = content.nextID;     
            
            content = DiskRetrieveTSB(currentID);
            
            content.statusBit = FileBlock.OCC;   
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
}

function DiskReadFile (fileName, literal)
{
    var currentID      = DiskFindFile(fileName);
    var currentContent = DiskRetrieveTSB(currentID);
    var aggregateValues = [];
    
    currentID          = currentContent.nextID;
    
    while (currentID.track !== 0 || currentID.sector !== 0 ||  currentID.block !== 0)
    {
        currentContent = DiskRetrieveTSB(currentID);
        
        aggregateValues = aggregateValues.concat(currentContent.data);
        
        currentID      = currentContent.nextID;
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

function DiskConvertFromHex(chars)
{
    var str         = "";
    
    for (var index in chars)
    {
        str+= String.fromCharCode("0x" + chars[index]);
        
        if(chars[index] === "00")
            break;
    }
    
    return str;
}

function DiskDelete (fileName)
{   
   DiskDeleteID(DiskFindFile(fileName));
}

function DiskDeleteID(tsb)
{
    var currentID        = tsb;
    var fileHandle       = DiskRetrieveTSB(currentID);
    var fileContent      = null;
    
    fileHandle.statusBit = FileBlock.EMPTY;
    
    FileBlock.zero(fileHandle.data);
    
    DiskWriteToTSB(currentID, fileHandle);    
    currentID = fileHandle.nextID;
    
    while(currentID.track !== 0 || currentID.sector !== 0 ||  currentID.block !== 0)
    {
        fileContent           = DiskRetrieveTSB(currentID);
        fileContent.statusBit = FileBlock.EMPTY;
        FileBlock.zero(fileContent.data);        
        DiskWriteToTSB (currentID, fileContent);
        currentID              = fileContent.nextID;
    }
}
