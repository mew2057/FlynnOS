function MemoryManager(pages)
{
    this.pageSize = 256; // This is the default page size.
    this.core = new CoreMemory(this.pageSize * pages);
    
}

/**
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
 * @param trapPointer - A pointer to the prefered trap or error handling mechanism.
 */
MemoryManager.prototype.storeProgram = function(hexAddress, toStore, trapPointer)
{
    
    var returnCode = this.store(hexAddress,toStore);
    var currentPCB =null;
    
    switch (returnCode)
    {
        case 0:
            currentPCB = new PCB();   
            currentPCB.Base = parseInt(hexAddress,16);
            currentPCB.Limit = currentPCB.Base + this.pageSize - 1;              
            
            break;
        case 1:
            trapPointer("Memory Address was out of bounds!");
            break;
        case 2:
            trapPointer("Memory Address overflow on program load!");
            break;
    }

    return currentPCB;
};

MemoryManager.prototype.updateDisplay = function()
{
    $("#memDiv").text("");
    
    $("#memDiv").append("0x" + padZeros("",4) + ": ");
    
    for (var index = 0; index < this.core.memory.length; index ++)
    {
        if(index === 0 || index % 5 !== 0)
        {
            $("#memDiv").append(this.core.memory[index].toUpperCase() + " ");
        }
        else
        {
            $("#memDiv").append("<br/>0x" + padZeros(index.toString(16),4)+ ": " 
                + this.core.memory[index].toUpperCase() +" ");
        }
    }
    
};

/**
 * Retrieves the contents of a memory cell.
 * @return null if out of bounds, the contents if found.
 */
MemoryManager.prototype.retrieveContents = function(hexAddress)
{
    // Translate the hex address to int.
    var intAddress = parseInt(hexAddress,16);
    
    // If the address is already out of bounds notify the invoking function.
    if( intAddress >= this.core.memory.length )
    {
        return null;
    }
    
    return this.core.memory[intAddress];
};
//TODO page faults!
/**
 * Retrieves the contents of a memory cell.
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
 * Returns the array that represents the memory.
 */
MemoryManager.prototype.dump = function()
{
    return this.core.memory;
};
