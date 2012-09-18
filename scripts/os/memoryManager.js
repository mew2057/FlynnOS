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

/**
 * Returns the array that represents the memory.
 */
MemoryManager.prototype.dump = function()
{
    return this.core.memory;
};
