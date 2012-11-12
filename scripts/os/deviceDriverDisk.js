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


FileBlock.EMPTY = "00";
FileBlock.OCC   = "01";

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
    //do something
}

function DiskStringToHex(toConvert)
{
    var charArray = toConvert.split('');
    
    for (var index = 0; index < charArray.length; index++)
    {
        charArray[index] = padZeros(charArray[index].charCodeAt(0).toString(16),2);
    }
    
    charArray[index] = "00";
    
    return charArray;
}

function DiskRetrieveTSB (tsb)
{
    var contents = localStorage["FlynnOS:"+tsb.track + "," + tsb.sector + "," + tsb.block];
    
    if(contents)
        return JSON.parse(contents);
        
    return null;
}

function DiskWriteToTSB (tsb, block)
{
    localStorage["FlynnOS:"+tsb.track + "," + tsb.sector + "," + tsb.block] = JSON.stringify(block);
}

function DiskCompareFileName (fileName, data)
{
    var retVal = true;
    for (var index=0; index <  fileName.length; index++)
    {
        retVal = (retVal && fileName[index] === data[index]);
        
        if(!retVal)
            break;
    }
    return retVal;
}

function DiskFindFile (fileName)
{
    if(fileName.length > FileID.BSIZE)
    {
        //error 
        return;
    }
    
    var fileChars = DiskStringToHex(fileName);
    
    var newID = new FileID();
    var block = null;
    
    // Jump the MBR.
    newID.increment();
    
    while (newID.track < 1)
    {        
        block = DiskRetrieveTSB(newID);
        
        if (DiskCompareFileName(fileChars,block.data))
        {
            break;
        }
        newID.increment();
    }
    
    if( newID.track === 1)
        newID = null;
    
    return newID;    
}

function DiskFindFreeFile ()
{
    var newID = new FileID();
    var block = null;
    
    // Jump the MBR.
    newID.increment();
    
    while (newID.track < 1)
    {        
        block = DiskRetrieveTSB(newID);
        
        if (block.statusBit === "00")
        {
            break;
        }
        newID.increment();
    }
     
    if( newID.track === 1)
        newID = null;
    
    return newID;
}

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
        newID.increment();
        
    }while (newID.increment());
    
    return found?newID:null;
}



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
    
    DiskCreateFile("test");
    console.log(localStorage);
    console.log(DiskFindFile("test"));
    DiskWriteFile("test","Testing 12345678910 hello hello hello Testing 12345678910 h");
    console.log(localStorage);
    DiskDelete("test");
    console.log(localStorage);
    
    DiskCreateFile("tes");
     console.log(DiskFindFile("tes"));
    DiskWriteFile("tes","Testing 12345678910 hello hello hello Testing 123456789");
    console.log(localStorage);


    
}

function DiskCreateFile (fileName)
{
    // TODO size chacking.
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

function DiskWriteFile (fileName, data)
{
    // TODO file overflow.
    var dataChars = DiskStringToHex(data);
    var fileHandle = DiskRetrieveTSB(DiskFindFile(fileName));
    
    console.log(fileHandle);
    
    var content = DiskRetrieveTSB(fileHandle.nextID);
    
    for (var index = 0; index < FileID.BSIZE - 4; index ++)
    {
        content.data[index] = dataChars[index];
    }
    
    
   DiskWriteToTSB(fileHandle.nextID, content);
}

function DiskReadFile (fileName)
{
    
}

function DiskDelete (fileName)
{   
    // TODO chains
    var clearID          = DiskFindFile(fileName);
    var fileHandle       = DiskRetrieveTSB(clearID);
    fileHandle.statusBit = FileBlock.EMPTY;
    
    DiskWriteToTSB(clearID, fileHandle);
    
    var fileContent      = null;
    clearID              = fileHandle.nextID;
    
    do{
        fileContent           = DiskRetrieveTSB(clearID);
        fileContent.statusBit = FileBlock.EMPTY;
        DiskWriteToTSB (clearID, fileContent);
        
        clearID               = fileContent.nextID;
    }while(clearID.track !== 0 && clearID.sector !== 0 && clearID.block != 0);
}


