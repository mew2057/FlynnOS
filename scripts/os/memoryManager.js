/* ------------
   memoryManager.js
   
   Requires globals.js
   
   A set of routines to handle memory management.
   ------------ */
   
/**
  * The Memory manager function that should handle all accesses to Core Memory.
  * 
  */
function MemoryManager(coreMem)
{
    this.core = coreMem;
    this.pageNum = 3;

    // pageSize === frameSize
    this.pageSize = this.core.frameSize;
    
    this.pagesInUse = new Array(this.pageNum);
    
    this.init = function()
    {
        for(var page = 0; page < this.pageNum; page ++)
        {
            //this.pages[page] = page;
            this.pagesInUse[page] = false;
        }
    };
}

MemoryManager.prototype.pageToOffset = function(pageNumber)
{
    return pageNumber * this.pageSize; 
};


MemoryManager.prototype.reclaimPage = function(page)
{
    if(page < this.pagesInUse.length)
    {
        //this.pages.push(page);
        this.pagesInUse[page] = false;
    }
};

MemoryManager.ERROR = {
    "BOUNDS"     :0,
    "STORE_OVER" :1,
    "FULL"       :2
    
};
MemoryManager.prototype.errorLog = function(errorCode, param)
{
    var msg = "";
    
    switch(errorCode)
    {
        case MemoryManager.ERROR.STORE_OVER:
            msg = "Memory Address overflow on store.";
            break;
        case MemoryManager.ERROR.BOUNDS:
            msg = "Memory access was not within page bounds: " + param;
            break;
        case MemoryManager.ERROR.FULL:
            msg = "No remaining space in memory";
            break;
        default:
    }
    
    this.log(msg);
    _KernelInterruptQueue.enqueue( new Interrupt(FAULT_IRQ, [MEM_FAULT,msg]));
};

MemoryManager.prototype.log = function(msg)
{
    simLog(msg,"O_MEM");
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
    var rc = -1;
    
    // If the address is already out of bounds notify the invoking function.
    if( intAddress >= limit)
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
    this.pagesInUse[page] = true;
    
    var baseAddress = this.pageToOffset(page);

    var returnCode =page != -1 ? this.store(baseAddress.toString(16),toStore): 1;
    var currentPCB = -1;
    
    switch (returnCode)
    {
        case 0:
            // Assigns the PID and gives the PCB a base and limit.
            currentPCB  = residents.createNewPCB([baseAddress, 
                (baseAddress + this.pageSize - 1)], page);
            break;
        case 1:
            this.errorLog(MemoryManager.ERROR.FULL);
            break;
    }

    return currentPCB;
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
   
    if(intAddress < pcb.Limit)
    {
       this.log(this.core.memory[intAddress] + " loaded from " + hexAddress);
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
 * @param pcb The process control block for the process that made the request.
 * 
 * @return null if out of bounds, the contents if found.
 */
MemoryManager.prototype.retrieveContentsToLimit = function(hexAddress, boundingValue, pcb)
{
    // Translate the hex address to int.
    var intAddress = parseInt(hexAddress,16) + pcb.Base;
    var contents = [];
    
    if(intAddress < pcb.Limit)
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
    
    if(intAddress < pcb.Limit)
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
 * Retrieves from coreMemory with a page offset This is a specialty method used by the canvasAnimations (not actually used in the OS).
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
