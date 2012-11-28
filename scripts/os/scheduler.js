/* ------------
   scheduler.js
   
   The process scheduler. Defines a default scheduler.
   ------------ */
/**
 * The Scheduler function, defines the processEqueued field, which is used in all
 * forms of the scheduler to ensure consistency.
 */
function Scheduler()
{
    this.processEnqueued = false;
    this.breakFlag = false;
    this.name = "default";
}

//------------------------------

/**
 * A logger that's guaranteed in all implementations of the Scheduler.
 * 
 * @param msg The message to output to the logger.
 */
Scheduler.log = function (msg)
{
    simLog(msg, LOGGER_SOURCE.SCH);
};

/**
 * A console output that's guaranteed in all implementations of the Scheduler.
 * I opted for this, as if I wish to ever apply a general formatting to the output
 * I can implement it in a single place.
 * 
 * @param msg The message to output to the console.
 */
Scheduler.toConsole = function(msg)
{
    _StdIn.putText(msg);
};

/**
 * Beautifies the output when the process execution is done.
 */
Scheduler.dropConsoleLine = function()
{
    _OsShell.drop();
};

//------------------------------

/**
 * Reclaims the page in memory and adds the pcb to the terminated queue.
 * 
 * @param pcb The process control block that for whatever reason is no longer required in memory.
 */
Scheduler.prototype.reclaimPCB = function(pcb)
{
    _MemoryManager.reclaimPage(pcb.page);                
    _Terminated.enqueue(pcb);
};

/**
 * Checks the break flag.
 * 
 * @return the state of the flag (true or false)
 */
Scheduler.prototype.checkBreak = function()
{
    return this.BreakFlag;
};

/**
 * Sets the value of the break flag.
 * @param isBreaking The new state of the flag.
 */
Scheduler.prototype.setBreak = function(isBreaking)
{
    this.BreakFlag = isBreaking;
};

/**
 * Breaks the execution (I love verbose names) of the currently executing process.
 * @param cpu The cpu state at time of invocation.
 */
Scheduler.prototype.breakExecution = function(cpu)
{
    this.setBreak(true);
    
    cpu.pcb.update(cpu);
    
    // Reclaims the page and places the pcb in the terminated queue
    this.reclaimPCB(cpu.pcb);
    
    // Raise the next interrupt and prevent other scheduling interrupts.    
    _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_IRQ, [true]));

};

//------------------------------


// The psuedo interface (more like an abstract class) for the schedulers.
/**
 * Checks to see if the scheduler is ready enqueue a context switch. (useless for
 * non premptive implementations)
 */
Scheduler.prototype.isReady = function(){};

/**
 * Enqueues the next process on the scheduler queue. If none are found toggle
 * the processEnqueued flag to prevent unnecessary cycles in the CPU.
 * 
 * @param cpu The cpu state at the time of invocation.
 * 
 * @param finished If set to true this will NOT enqueue the executing process to 
 *  the ready queue.
 * 
 * @param terminated If set the process has been killed by the user do something different.
 */
Scheduler.prototype.processNext = function(cpu, finished, terminated){};

/**
 * Schedules a process.
 * 
 * @param cpu The cpu at the time of invocation.
 * 
 * @param pcb The Process Control Block to be enqueued.
 */
Scheduler.prototype.scheduleProcess = function(cpu, pcb){};

/**
 * Removes the pcb with the supplied pid from the schedule.
 * 
 * @param cpu The cpu at the time of invocation.
 * 
 * @param pid The process identifier to remove from the schedule.
 */
Scheduler.prototype.removeFromSchedule = function(cpu, pid){};

/**
 * Outputs the active process ids to a string.
 * 
 * @return The string containing active processes.
 */
Scheduler.prototype.activesToString = function(){};

/**
 * Invokes a toString on the ready queue (implementation varies based on scheduler version)
 * 
 * @return a string containing the string versions of the ready queue pcbs.
 */
Scheduler.prototype.toString = function(){};

/**
 * The kickoff for swapping when the starting pcb exists in memor or the cpu is non null.
 * 
 * @param pcbMem The pcb that resides in memory.
 * @param pcbFs The pcb that resides on the file system.
 * @param cpu The cpu state at time of invocation.
 */
Scheduler.prototype.startSwap = function(pcbMem, pcbFs, cpu)
{
    Scheduler.log("Starting swap");

    krnDiskRead(pcbFs.Base, true, [this, this.swapOut, [pcbMem, pcbFs, cpu, true]]);
};

/**
 * Rolls the process out of memory and begins the roll in from the file system.
 * 
 * @param args 0 - The PCB that is being swapped out.
 *             1 - The PCB on the fs.
 *             2 - The cpu at the time of swap invocation.
 *             3 - {true, false} specifies whether or not the pcb should be readded to the queue (only matters with preemption).
 * 
 * @param fsData An array containing the program that is currently swapped out.
 */
Scheduler.prototype.swapOut = function(args, fsData)
{
    // Set up the temporary variables.
    var toDisk = null;
    var tempBase = 0;
    var pcbActive = _MemoryManager.pagesInUse[args[0].page];
    
    // If the process in memory is real (it actually resides there) get it so it may be placed on the file system.
    if(pcbActive)
    {
        toDisk = _MemoryManager.retrieveContentsFromAddress(0,_MemoryManager.pageSize, args[0]);
    }
    
    // Set the temporary base so as to not lose the file location.
    tempBase = args[1].Base;
    
    // If a free page isn't available (and the pcb wasn't changed to reflect that)
    // copy the memory based pcb address data into the swapped pcb.
    if(!_MemoryManager.findFreePage(args[1]))
    {
        args[1].Base = args[0].Base;
        args[1].Limit = args[0].Limit;
        args[1].page = args[0].page;
    }
    
    // Roll in the swapped out process.
    _MemoryManager.store(0, fsData.slice(0,_MemoryManager.pageSize), args[1]);
    
    if(toDisk !== null)
    {
        args[0].Base = tempBase;
        args[0].page = -1;
        
        // Roll out the memory process.
        krnDiskWrite(args[0].Base, toDisk, [this, this.swapComplete, args]);
    }
    else
    {
        // Kill the file since we won't be needing it as the in memory process is done.
        krnDiskDelete(tempBase,[this, this.swapComplete, args])
    }
};

/**
 * Initializes a pcb from the file system if it has no preceeding in memory process.
 * 
 * @param pcbFs The pcb that references the process on the file system.
 * 
 * @param cpu The state of the cpu at the time of invocation.
 */
Scheduler.prototype.startInitialSwap = function(pcbFs, cpu)
{
    // Init a "fake" pcb.
    var tempPCB = new PCB();

    // Find the page it will live on.
    if(!_MemoryManager.findFreePage(tempPCB, false))
    {
        tempPCB = this.findPage();
    }

    Scheduler.log("Starting initial swap");

    // Execute a swap as normal with a "fake" process.
    krnDiskRead(pcbFs.Base, true, [this, this.swapOut, [tempPCB, pcbFs, cpu, false]]);
};

/**
 * The callback that defines the behavior of the scheduler when finishing a swap.
 *
 * @param args 0 - The PCB that is being swapped out.
 *             1 - The PCB on the fs.
 *             2 - The cpu at the time of swap invocation.
 *             3 - {true, false} specifies whether or not the pcb should be readded to the queue (only matters with preemption).
 * 
 * @param status The response from the File System operation.
 */
Scheduler.prototype.swapComplete = function(args, status){};

/**
 * Finds a pcb that has a usable memory page in either the ready queue (implementation specific)
 * or the resident's list.
 * 
 * @return A pcb with a memory page {1-3}. If null is returned there are far worse problems...
 */
Scheduler.prototype.findPage = function(){};
