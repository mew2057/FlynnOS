/* ------------
   pcb.js
   
   Contains functions to represent Process Control Blocks in the simulation.
   Additionally, contains the ResidentList data structure.
   ------------ */

/**
 * The Process Control Block function.
 */
function PCB()
{
    this.pid   = 0;     // The Process IDentifier.
    this.PC    = 0;     // Program Counter
    this.Acc   = 0;     // Accumulator
    this.Xreg  = 0;     // X register
    this.Yreg  = 0;     // Y register
    this.Zflag = 0;     // Z-ero flag 
    this.page  = 0;     // The page of the program.
    this.Base  = 0;     // Base of the program page in core memory. 
    this.Limit = 0;     // The Upper limit of the program page.
}

/**
 * Updates the mutable values of the PCB with the contents of a cpu.
 * 
 * @param cpu The cpu state to be mirrored in the PCB.
 */
PCB.prototype.update = function(cpu)
{
    this.PC    = cpu.PC;
    this.Acc   = cpu.Acc;
    this.Xreg  = cpu.Xreg;
    this.Yreg  = cpu.Yreg;
    this.Zflag = cpu.Zflag;
};

/**
 * Clears out the per execution details of a process (eg PC,Acc...)
 */
PCB.prototype.clearCPUDetails = function()
{
    this.PC    = 0;
    this.Acc   = 0;
    this.Xreg  = 0;
    this.Yreg  = 0;
    this.Zflag = 0;
};

/**
 * The toString function, enough said.
 * 
 * @return An html formatted string of the pcb contents.
 */
PCB.prototype.toString = function()
{
    var retVal ="";
    
    retVal += "<tr><td>" + this.pid + "</td>";
    retVal += "<td>" + padZeros(this.PC.toString(16),2).toUpperCase() + "</td>";
    retVal += "<td>" + padZeros(this.Acc.toString(16),2).toUpperCase() + "</td>";
    retVal += "<td>" + padZeros(this.Xreg.toString(16),2).toUpperCase() + "</td>";
    retVal += "<td>" + padZeros(this.Yreg.toString(16),2).toUpperCase() + "</td>";
    retVal += "<td>" + this.Zflag + "</td>";
    retVal += "<td>" + padZeros(this.Base.toString(16),2).toUpperCase() + "</td>";
    retVal += "<td>" + padZeros(this.Limit.toString(16),2).toUpperCase() + "</td></tr>";      
    return retVal;
};

/**
 * The Process Control Block Collection. This structure manages pcb creation.
 * The only way to add to it is to create a new process control block through
 * createNewPCB. Editing existing pcbs is allowed through getBlock.
 */
function ResidentList()
{
    // The collection of resident PCBs.
    this.residents = [];

    // Manages pids.
    this.leadPID = 0;
}

/**
 * The size gettor for the ResidentList class.
 * @return The number of residents on the list.
 */
ResidentList.prototype.getSize = function()
{
    return this.residents.length;
};

/**
 * Finds the pcb with the supplied pid.
 * 
 * @param pid The Process IDentifier.
 * 
 * @return the location of the process ID.
 */
ResidentList.prototype.indexOfPID = function(pid)
{
    var retVal = -1;
    
    for(var index in this.residents)
    {
        if(this.residents[index].pid == pid)
        {
            retVal = index;
            break;
        }
    }

    return retVal;
};
    

/**
 * Creates a new Process Control Block and assigns a Process ID.
 * 
 * @param params 0: Base
 *               1: Limit offset.
 * 
 * @return The Process ID.
 */
ResidentList.prototype.createNewPCB = function(params, page)
{
    // Create a new PCB and load the pid into it.
    var pcb = new PCB();
    pcb.pid = this.leadPID++;
    pcb.page = page;
    // If params are supplied load the base and limt in.
    if(params)
    {
        pcb.Base = params[0];
        pcb.Limit = params[1];
    }
    
    // Push the new pcb onto the collection.
    this.residents.push(pcb);

    return pcb.pid;
};

/**
 * Retrieves the control block by process id.
 * 
 * @param pid The process id.
 * 
 * @return The pcb if found, null if not.
 */
ResidentList.prototype.getBlock = function(pid)
{
    var pcbIndex = this.indexOfPID(pid);
    var retVal = null;
    
    if(pcbIndex > -1)
    {
        retVal =  this.residents[pcbIndex];
    }
    
    return retVal;
};

/**
 * Retrieves the control block by process id and removes the ProcessControlBlock
 * from the resident list.
 * 
 * @param pid The process id.
 * 
 * @return The pcb if found, null if not.
 */
ResidentList.prototype.popBlock = function(pid)
{
    var pcbIndex =  this.indexOfPID(pid);
    var retVal = null;

    if(pcbIndex > -1)
    {
        retVal =  this.residents[pcbIndex];
        this.residents.splice(pcbIndex,1);
    }
    else if(!pid)
    {
        retVal = this.residents.shift();
    }
    
    return retVal;
    
};

/**
 * Outputs the contents of the residents list in an ordered manner.
 * @return An html formated string.
 */
ResidentList.prototype.toString = function()
{
    var retVal="";
    
    for(var index = 0; index < this.residents.length;index++)
    {
        retVal += this.residents[index].toString();
        
    }
    return retVal;
};

