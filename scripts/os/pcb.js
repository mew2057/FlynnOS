/* ------------
   pcb.js
   
   Contains functions to represent Process Control Blocks in the simulation.
   ------------ */

/**
 * The Process Control Block function.
 */
function PCB()
{
    this.PC    = 0;     // Program Counter
    this.Acc   = 0;     // Accumulator
    this.Xreg  = 0;     // X register
    this.Yreg  = 0;     // Y register
    this.Zflag = 0;     // Z-ero flag 
    this.Base  = 0;     // Base of the program page in core memory. 
    this.Limit = 0;     // The Upper limit of the program page.
}

/**
 * Updates the mutable values of the PCB with the contents of a cpu.
 * @param cpu The cpu state to be mirrored in the PCB.
 */
PCB.prototype.update = function(cpu)
{
    this.PC = cpu.PC;
    this.Acc = cpu.Acc;
    this.Xreg = cpu.Xreg;
    this.Yreg = cpu.Yreg;
    this.Zflag = cpu.Zflag;
};

/**
 * The Process Control Block Collection...
 */
function ProcessControlBlockCollection()
{
    this.pcbs = [];  
}

/**
 * Retrieves the control block by process id.
 * @param pid The process id.
 * @return The pcb if found, null if not.
 */
ProcessControlBlockCollection.prototype.getBlock = function(pid)
{
    if(pid < this.pcbs.length)
    {
        return this.pcbs[pid];
    }
    else
    {
        return null;
    }
};

/**
 * Sets a block in the collection.
 * @param pcb The block that will be placed in the collection.
 * @param pid The location in the collection to place the PCB.
 */
ProcessControlBlockCollection.prototype.setBlock = function(pcb,pid)
{
    this.pcbs[pid] = pcb;  
};

/**
 * Pushes a pcb to the collection.
 * @param pcb The PCB to push.
 * @return The id of teh new PCB.
 */
ProcessControlBlockCollection.prototype.push = function(pcb)
{
    this.pcbs.push(pcb); 
    return this.pcbs.length-1;
};

/**
 * Retrieves the size of the collection.
 * @return The number of PCBs.
 */
ProcessControlBlockCollection.prototype.getSize = function()
{
    return this.pcbs.length;   
};

