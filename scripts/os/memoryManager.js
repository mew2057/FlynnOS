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
    
    // The page set containg pages in and out of use.
    this.pageSet = new Array(this.pageNum);
    
    this.init = function()
    {
        for(var page = 0; page < this.pageSet; page ++)
        {
            this.pageSet[page] = false;
        }
    };
}

/**
 * A routine for storing data in Core Memory. 
 * 
 * @param hexAddress The hexadecimal address of the  memory location to store 
 *      the data.
 * @param toStore The data to store in the core memory.
 * 
 * @return 0 - Success.
 *         1 - Address out of bounds.
 *         2 - Memory overflow.
 */
MemoryManager.prototype.store = function(hexAddress, toStore)
{
    // Translate the hex address to int.
    var intAddress = parseInt(hexAddress,16);
    
    // If the address is already out of bounds notify the invoking function.
    if( intAddress >= this.core.memory.length )
    {
        return 1;
    }
    else if(toStore.length + intAddress > this.core.memory.length)
    {
        return 2;   
    }
    
    for (var storeIndex = 0; storeIndex < toStore.length; storeIndex ++)
    {
        this.core.memory[storeIndex + intAddress] = toStore[storeIndex];   
    }
    
    return 0;
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
MemoryManager.prototype.storeProgram = function(hexAddress, toStore, residents)
{
    
    var returnCode = this.store(hexAddress,toStore);
    var currentPCB = -1;
    
    switch (returnCode)
    {
        case 0:
            // Assigns the PID and gives the PCB a base and limit.
            currentPCB  = residents.createNewPCB([parseInt(hexAddress,16), 
                this.pageSize - 1]);
            
            break;
        case 1:
            // Doesn't stop the CPU but notifies the user of a detected errror.
            _KernelInterruptQueue.enqueue( new Interrupt(FAULT_IRQ, 
                new Array(MEM_FAULT,"Memory Address was out of bounds.")));
            break;
        case 2:
            // Doesn't stop the CPU but notifies the user of a detected errror.
            _KernelInterruptQueue.enqueue( new Interrupt(FAULT_IRQ, 
                new Array(MEM_FAULT,"Memory Address overflow on program load.")));
            break;
    }

    return currentPCB;
};

// TODO in project 3 add more paging support.

/**
 * Retrieves the contents of a memory cell.
 * 
 * @param hexAddress The address of the cell in hex.
 * 
 * @param offset The offset of the final address.
 * 
 * @return null if out of bounds, the contents if found.
 */
MemoryManager.prototype.retrieveContents = function(hexAddress,offset)
{
    var intAddress = parseInt(hexAddress,16);
    var intOffset = offset?parseInt(offset,16):0;
    
    // If the address is already out of bounds notify the invoking function.
    if( intAddress >= this.core.memory.length )
    {
        return null;
    }
    
    return this.core.memory[intAddress + intOffset];
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
 * @return null if out of bounds, the contents if found.
 */
MemoryManager.prototype.retrieveContentsToLimit = function(hexAddress,boundingValue)
{
    // Translate the hex address to int.
    var intAddress = parseInt(hexAddress,16);
    var contents = [];
    
    do {
        contents.push(this.core.memory[intAddress++]);
    }while(intAddress < this.core.memory.length && contents[contents.length-1] != boundingValue);
    
    if(contents[contents.length-1] != boundingValue)
    {
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
 * @return The contents from the starting cell numBytes on.
 */
MemoryManager.prototype.retrieveContentsFromAddress = function(hexAddress,numBytes)
{
    // Translate the hex address to int.
    var intAddress = parseInt(hexAddress,16);
    var offset = 0;
    var contents = [];
    
    do {
        contents.push(this.core.memory[intAddress + offset]);
        offset++;
    }while(intAddress + offset < this.core.memory.length && 
        offset !=numBytes);
    
    if(intAddress + offset >= this.core.memory.length)
    {
        contents = null;
    }
    
    return contents;
};

/**
 * Retrieves from coreMemory with a page offset.
 * 
 * @param hexAddress The logical hexAddress.
 * 
 * @param page The page the logical address reside on.
 * 
 * @return The contents of the page offset cell. Null if not found.
 */
MemoryManager.prototype.retrieveFromPage = function(hexAddress, page)
{
    var pageOffset = this.pageSize * page;
    
    return this.retrieveContents(hexAddress, pageOffset.toString(16));    
};
