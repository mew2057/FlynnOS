/* ------------
   CoreMemory.js
   
   Requires globals.js
   
   The function for the hardware simulation's core Memory.
   ------------ */
 //XXX What else needs to be here?
/**
 * The core memory function definition...
 */
function CoreMemory()
{
    this.pages = 1;
    this.pageSize = 256; // This is the default page size.
    this.memory = new Array(this.pages*this.pageSize);
 
    this.init = function()
    {
       for (var index =0 ; index < this.memory.length; index ++)
        {
            this.memory[index] = "00";   
        }
    };
}


