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

//XXX Where do I actually assign Process ID, is that a PCB collection related thing?
/**
 * Effectively a wrapper to the store routine that handles pcb creation and
 * storage error codes.
 * 
 * @param hexAddress The address to begin the storage at (please note this is 
 * soon to be deprecated).
 * 
 * @param toStore The verified program code to store in Core Memory.
 * @return A PCB initialized with key data relating to the loaded program. This 
 *          is null if any issues were detected.
 */
MemoryManager.prototype.storeProgram = function(hexAddress, toStore)
{
    
    var returnCode = this.store(hexAddress,toStore);
    var currentPCB = null;
    
    switch (returnCode)
    {
        case 0:
            currentPCB = new PCB();   
            currentPCB.Base = parseInt(hexAddress,16);
            currentPCB.Limit = currentPCB.Base + this.core.frameSize - 1;
            
            break;
        case 1:
            _KernelInterruptQueue.enqueue( new Interrupt(FAULT_IRQ, 
                new Array(MEM_FAULT,"Memory Address was out of bounds.")));
            break;
        case 2:
            _KernelInterruptQueue.enqueue( new Interrupt(FAULT_IRQ, 
                new Array(MEM_FAULT,"Memory Address overflow on program load.")));
            break;
    }

    return currentPCB;
};

//XXX Is there a way to condense this? It may not be worth it...

/**
 * Retrieves the contents of a memory cell.
 * @param hexAddress The address of the cell in hex.
 * @return null if out of bounds, the contents if found.
 */
MemoryManager.prototype.retrieveContents = function(hexAddress)
{
    return this.retrieveContentsDecimal(parseInt(hexAddress,16));
};

/**
 * Retrieves the contents of a memory cell, doesn't do address translation (only
 * should be used internally or for data output)..
 * @param decimalAddress The address of the cell in decimal.
 * @return null if out of bounds, the contents if found.
 */
MemoryManager.prototype.retrieveContentsDecimal = function(decimalAddress)
{
    // If the address is already out of bounds notify the invoking function.
    if( decimalAddress >= this.core.memory.length )
    {
        return null;
    }
    
    return this.core.memory[decimalAddress];
};

//TODO page faults!
/**
 * Retrieves an array from core memory begining on the hexAddress and ending with
 * the supplied bounding value (e.g. 00).
 * 
 * @param hexAddress The address of the starting cell in hex.
 * @param boundingValue The hex value that marks the delimiter in memory for 
 *  the collection.
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
