/* ------------
   CoreMemory.js
   
   Requires globals.js
   
   The function for the hardware simulation's core Memory.
   ------------ */
/**
 * The core memory function definition.
 */
function CoreMemory()
{
    this.frameNum = 3;
    this.frameSize = 256; // This is the default page size.
    
    this.memory = new Array(this.frameNum*this.frameSize);
 
    this.init = function()
    {
       for (var index =0 ; index < this.memory.length; index ++)
        {
            this.memory[index] = "00";   
        }
    };
}

