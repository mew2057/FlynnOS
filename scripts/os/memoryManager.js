/* ------------
   memoryManager.js
   
   Requires globals.js
   
   A set of routines to handle memory management.
   ------------ */
   
/**
  * The Memory manager function that should handle all accesses to Core Memory.
  * 
  * @param coreMem The core memory in "hardware" that this manager points to. 
  */
function MemoryManager(coreMem)
{
    this.core = coreMem;
    
    // This just formalizes the number of pages.
    this.pageNum = 3;

    // pageSize === frameSize
    this.pageSize = this.core.frameSize;
    
    // A set that keeps track of what pages currently have a pcb assigned to them.
    this.pagesInUse = new Array(this.pageNum);

    initMemDisplay(this);

    this.init = function()
    {
        for(var page = 0; page < this.pageNum; page ++)
        {
            this.pagesInUse[page] = false;
        }
    };
}

/**
 * Retruns the base address of the page (converts the PAGE TO the OFFSET).
 * 
 * @param pageNumber The page number you are requestin the base address for.
 */
MemoryManager.prototype.pageToOffset = function(pageNumber)
{
    return pageNumber * this.pageSize; 
};

/**
 * Reclaims the page by making it available in the pagesInUse set.
 * @param page The page number to save.
 */
MemoryManager.prototype.reclaimPage = function(page)
{
    if(page < this.pagesInUse.length)
    {
        this.pagesInUse[page] = false;
    }
    
    this.log("Page " + page + " has been reclaimed");
};

/**
 * Attempts to find a free page in the virtual memory, if present  update the 
 * supplied pcb to point to it.
 * 
 * @param pcb The pcb that takes in the useful data.
 * 
 * @param allocate Optional: Specifies whether or not the memory manager should 
 *      consider the page occupied defaults to false. 
 * 
 * @return {true,false} True if a free page was discovered.
 */
MemoryManager.prototype.findFreePage = function(pcb, allocate)
{
    // Try to find a free page.
    var firstFree = this.pagesInUse.indexOf(false);
    
    // If a page is free build up the pcb and return true.
    if(firstFree !== -1)
    {
        this.pagesInUse[firstFree] = allocate || false;
        pcb.page                   = firstFree;
        pcb.Base                   = this.pageSize*firstFree;
        pcb.Limit                  = pcb.Base + this.pageSize;
        
        return true;
    }
    
    // False is our return if not found.
    return false;
};

// Error enumeration (standardizes some frequent errors to error codes.
MemoryManager.ERROR = {
    "BOUNDS"     : 0,
    "STORE_OVER" : 1,
    "FULL"       : 2,
    "FS"         : 3
};

/**
 * An error logger tailored for the MemoryManager.
 * 
 * @param errorCode Defines the general message.
 * 
 * @param param Localized data for the error.
 */
MemoryManager.prototype.errorLog = function(errorCode, param)
{
    var msg = "";
    
    switch(errorCode)
    {
        case MemoryManager.ERROR.STORE_OVER:
            msg = "Memory Address overflow on store";
            break;
        case MemoryManager.ERROR.BOUNDS:
            msg = "Memory access was not within page bounds: " + param;
            break;
        case MemoryManager.ERROR.FULL:
            msg = "No remaining space in memory";
            break;
        case MemoryManager.ERROR.FS:
            msg = "File System Error when writing pid: " + param + " to swap space";
            break;
        default:
    }
    
    this.log(msg);
    _KernelInterruptQueue.enqueue(new Interrupt(FAULT_IRQ, [MEM_FAULT,msg]));
};

/**
 * A general logger for the MemoryManager, this ensures that the source is
 * constant: "O_MEM".
 * 
 * @param msg The message to send along.
 */
MemoryManager.prototype.log = function(msg)
{
    simLog(msg,LOGGER_SOURCE.MEM);
};

/**
 * A routine for storing data in Core Memory. 
 * 
 * @param hexAddress The hexadecimal address of the  memory location to store 
 *      the data.
 * 
 * @param toStore The data to store in the core memory.
 * 
 * @return 0 - Success.
 *         1 - Address out of bounds.
 *         2 - Memory overflow.
 */
MemoryManager.prototype.store = function(hexAddress, toStore, pcb)
{
    // Translate the hex address to int.
    var intAddress = pcb ? parseInt(hexAddress,16)  + pcb.Base : parseInt(hexAddress,16);
    var limit = pcb ? pcb.Limit : intAddress + this.pageSize;
    var base  = pcb ? pcb.Base  : intAddress;
    var rc = -1;
    
    // Working on improving the bounds checking.
    // If the address is already out of bounds notify the invoking function.
    if( limit > this.core.limitAddress ||
        base < this.core.baseAddress   ||
        intAddress >= limit            ||
        intAddress < base) 
    {
        // Doesn't stop the CPU but notifies the user of a detected errror.
        this.errorLog(MemoryManager.ERROR.BOUNDS, hexAddress);

    }
    else if(toStore.length + intAddress > limit)
    {
        // Doesn't stop the CPU but notifies the user of a detected errror.
        this.errorLog(MemoryManager.ERROR.STORE_OVER);
    }
    else
    {
        for (var storeIndex = 0; storeIndex < toStore.length; storeIndex ++)
        {
            this.core.memory[storeIndex + intAddress] = toStore[storeIndex];   
        }
        rc = 0;
        this.log("Store success");
        // Updates the memory display only when a change to the memory occurs.
        // This is the only way memory may be changed so it's perfect for reducing the
        // the redraw calls.
        updateMemDisplay(this,pcb?pcb.page:null);
    }
    
    return rc;
};

/**
 * Effectively a wrapper to the store routine that handles pcb creation and
 * storage error codes.
 * 
 * @param hexAddress The address to begin the storage at (please note this is 
 * soon to be deprecated).
 * 
 * @param toStore The verified program code to store in Core Memory.
 * 
 * @param residents A collection of resident process control blocks.
 * 
 * @return The ID of the process control block  in pbcs. -1 if pcb creation 
 * failed
 */
MemoryManager.prototype.storeProgram = function(toStore, residents)
{
    var page = this.pagesInUse.indexOf(false);
    
    var baseAddress = this.pageToOffset(page);

    var returnCode = page != -1 ? this.store(baseAddress.toString(16),toStore) : 1;
    var currentPCB = -1;
    
    switch (returnCode)
    {
        case 0:
            // Assigns the PID and gives the PCB a base and limit.
            currentPCB  = residents.createNewPCB([baseAddress, 
                (baseAddress + this.pageSize)], page);
            
            this.pagesInUse[page] = true;
            changeTabDisplay(page);
            break;
        case 1:
            currentPCB = this.createProgramFS(toStore,residents);
           // this.errorLog(MemoryManager.ERROR.FULL);
            break;
    }

    return currentPCB;
};

MemoryManager.prototype.createProgramFS = function(toStore, residents)
{
    var currentPCB  = residents.getBlock(residents.createNewPCB(["@S",0], -1));
    currentPCB.Base = "@S"+currentPCB.pid;
    
    krnDiskCreate(currentPCB.Base, [this, this.storeProgramFS, [currentPCB, toStore]]);
    
    return currentPCB.pid;
};
MemoryManager.prototype.storeProgramFS = function(args, creationStatus)
{
    if(creationStatus)
        krnDiskWrite(args[0].Base, args[1],[]);
    else
        this.errorLog(MemoryManager.ERROR.FS, args[0].pid);
};
/**
 * Retrieves the contents of a memory cell.
 * 
 * @param hexAddress The address of the cell in hex.
 * 
 * @param pcb The process control block for the process that made the request.
 * 
 * @return null if out of bounds, the contents if found.
 */
MemoryManager.prototype.retrieveContents = function(hexAddress,pcb)
{
   var intAddress = parseInt(hexAddress,16) + pcb.Base;
   
   // verifies the intAddress is within the bounds and the hexAddress was non negative.
    if(intAddress >= pcb.Base                && 
       intAddress <  pcb.Limit               && 
       pcb.Limit  <= this.core.limitAddress  && 
       pcb.Base   >= this.core.baseAddress)
    {
       this.log(this.core.memory[intAddress] + " loaded from " + hexAddress);
       // All other retrievals are always predicated by a retrieve contents.
       // This changes the page of memory presently being displayed.
       changeTabDisplay(pcb.page);

       return this.core.memory[intAddress];
    }
    else
    {
        this.errorLog(MemoryManager.ERROR.BOUNDS, hexAddress);
        return null;
    }
};

/**
 * Retrieves an array from core memory begining on the hexAddress and ending with
 * the supplied bounding value (e.g. 00).
 * 
 * @param hexAddress The address of the starting cell in hex.
 * 
 * @param boundingValue The hex value that marks the delimiter in memory for 
 *  the collection.
 * 
 * @param pcb The process control block for the process that made the request.
 * 
 * @return null if out of bounds, the contents if found.
 */
MemoryManager.prototype.retrieveContentsToLimit = function(hexAddress, boundingValue, pcb)
{
    // Translate the hex address to int.
    var intAddress = parseInt(hexAddress,16) + pcb.Base;
    var contents = [];
    
    // verifies the intAddress is within the bounds and the hexAddress was non negative.
    if(intAddress >= pcb.Base                && 
       intAddress <  pcb.Limit               && 
       pcb.Limit  <= this.core.limitAddress  && 
       pcb.Base   >= this.core.baseAddress)
    {
        do {
            contents.push(this.core.memory[intAddress++]);
        }while(intAddress < pcb.Limit && contents[contents.length-1] != boundingValue);
        
        if(intAddress > pcb.Limit || contents.length === 0 || 
            contents[contents.length-1] != boundingValue)
        {
            this.errorLog(MemoryManager.ERROR.BOUNDS, intAddress.toString(16));
            contents = null;
        }
        else
        {
           this.log("Retrieve to character success.");
        }
    }
    else
    {
        this.errorLog(MemoryManager.ERROR.BOUNDS, intAddress.toString(16));
        contents = null;
    }
    
    return contents;
};

/**
 * Retrieves numBytes cells from core memory and returns it as an array.
 * 
 * @param hexAddress The address of the starting cell in hex.
 * 
 * @param nuymBytes The number of cells that the returned array should contain.
 * 
 * @param pcb The process control block for the process that made the request.
 * 
 * @return The contents from the starting cell numBytes on.
 */
MemoryManager.prototype.retrieveContentsFromAddress = function(hexAddress, numBytes, pcb)
{
    // Translate the hex address to int.
    var intAddress = parseInt(hexAddress,16) + pcb.Base;
    var contents = [];
    
    // verifies the intAddress is within the bounds and the hexAddress was non negative.
    if(intAddress >= pcb.Base                && 
       intAddress <  pcb.Limit               && 
       pcb.Limit  <= this.core.limitAddress  && 
       pcb.Base   >= this.core.baseAddress)
    {
        for(var index = 0; index < numBytes && intAddress < pcb.Limit;index++)
        {
            contents.push(this.core.memory[intAddress++]);
        }
        
        if(intAddress > pcb.Limit || contents.length === 0)
        {
            contents = null;
            this.errorLog(MemoryManager.ERROR.BOUNDS,hexAddress);
        }
        else
        {
            this.log("Retrieve from address success.");
        }
    }
    else
    {
        this.errorLog(MemoryManager.ERROR.BOUNDS, intAddress.toString(16));
        contents = null;
    }
    
    return contents;
};

/**
 * Retrieves from coreMemory with a page offset This is a specialty method used by the canvasAnimations 
 * (not actually used in the OS, actually a helper for quick output in the display).
 * 
 * @param hexAddress The logical hexAddress.
 * 
 * @param page The page the logical address reside on.
 * 
 * @return The contents of the page offset cell. Null if not found.
 */
MemoryManager.prototype.retrieveFromPage = function(hexAddress, page)
{    
    var intAddress = parseInt(hexAddress,16) + this.pageSize * page;
    
    return intAddress >= this.core.memory.limitAddress ? "@@" : this.core.memory[intAddress];
};
