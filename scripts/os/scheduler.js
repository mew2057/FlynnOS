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

Scheduler.prototype.startSwap = function(pcbOut, pcbIn, queue,cpu){
    krnDiskRead(pcbIn.Base, true, [this, this.swapOut, [pcbOut, pcbIn, queue, cpu]])
};

Scheduler.prototype.swapOut = function(pcbs, fsData)
{
    var toDisk = _MemoryManager.retrieveContentsFromAddress(0,_MemoryManager.pageSize, pcbs[0]);
    
    var tempBase = pcbs[0].Base;
    pcbs[0].Base = pcbs[1].Base;
    
    pcbs[1].Base = tempBase;
    pcbs[1].Limit = pcbs[0].Limit;
    pcbs[1].page = pcbs[0].page;
    pcbs[0].page = -1;

    _MemoryManager.store(0, fsData.slice(0,_MemoryManager.pageSize), pcbs[1])
    
    krnDiskWrite(pcbs[0].Base, toDisk, [this, this.swapComplete, pcbs]);
};

Scheduler.prototype.swapComplete = function(args, status){};