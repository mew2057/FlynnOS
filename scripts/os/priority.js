Priority.prototype = new Scheduler;

function Priority()
{
    this.readyQueue = new PriorityMinQueue();
    this.startExecution  = false;
    this.name = "priority";

}

/**
 * Checks to see if the scheduler is ready enqueue a context switch. (useless for
 * non premptive implementations)
 */
Priority.prototype.isReady = function()
{
    if(this.startExecution)
    {
        this.startExecution = false;
        _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_IRQ, []));
        Scheduler.log("Initiating context switch");
    }
};

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
Priority.prototype.processNext = function(cpu, finished, terminated)
{
    var tempPCB = null;
    
    // If  break is set and this is hit from a break, set the break to false.
    // This probably won't matter in this case but I'm keeping it just to be safe.
    if (finished)
    {
        this.setBreak(false);
    }
    else if(this.checkBreak())
    {
        return;
    }
    
    // If the readyQueue has other pcbs perform the context switch.
    // else if the current process is finished toggle the processEnqueued field.
    if(!this.readyQueue.isEmpty())
    {
        if(cpu.pcb)
        {
            cpu.pcb.update(cpu);
        
            Scheduler.log("PID " + cpu.pcb.pid + (terminated ? " terminated": " is finished executing"));
        }
        
        tempPCB = this.readyQueue.remove();
        
        if(tempPCB.Base.toString().indexOf("@") !== -1)
        {
            if(cpu.pcb === null)
            {
                console.log("here");
                this.startInitialSwap(tempPCB,cpu);
            }
            else
            {
                this.startSwap(cpu.pcb, tempPCB, cpu);
            }
        }
        else
        {
            // Load the leading element in the queue to the cpu.
            cpu.setStateFromPCB(tempPCB);
            Scheduler.log("PID " + cpu.pcb.pid + " is now queued to execute");
        }
    }
    else if(finished)
    {
        Scheduler.log("PID " + cpu.pcb.pid + (terminated ? " terminated":" is" +
            " finished executing") + ", no remaining processes");

        cpu.pcb = null;    
        this.processEnqueued = false;
        
        // Redisplay the prompt when all processes are done.
        Scheduler.dropConsoleLine();

    }
};

/**
 * Schedules a process.
 * 
 * @param cpu The cpu at the time of invocation.
 * 
 * @param pcb The Process Control Block to be enqueued.
 */
Priority.prototype.scheduleProcess = function(cpu, pcb)
{
    // This should never be hit, but report the error to the console and
    // continue without doing anything else. 
    if(!pcb)
    {
        Scheduler.toConsole("No process found to schedule!");
        Scheduler.log("Process Scheduling failed.");
        return;    
    }
    
    // If the cpu is not executing, take advantage of the isReady call guaranteed
    // in the execution.
    if(cpu.pcb === null)
    {
        this.startExecution = true;
    }
    
    // This allows the cpu portion of the cycle to execute.
    this.processEnqueued = true;
    
    // Enqueue the pcb and notify.
    this.readyQueue.insert(pcb.priority, pcb);     
    
    Scheduler.log("PID " + pcb.pid + " enqueued");
};

/**
 * Removes the pcb with the supplied pid from the schedule.
 * 
 * @param cpu The cpu at the time of invocation.
 * 
 * @param pid The process identifier to remove from the schedule.
 */
Priority.prototype.removeFromSchedule = function(cpu, pid)
{
    //TODO
};

/**
 * Outputs the active process ids to a string.
 * 
 * @return The string containing active processes.
 */
Priority.prototype.activesToString = function()
{
    var pidString = this.readyQueue.toString();
    
    // Pull the executing cpu (if present).
    if(cpu.pcb)
    {
        pidString += cpu.pcb.pid;    
    }
    
    return pidString !== "" ? pidString : "No active processes.";
};

/**
 * Invokes a toString on the ready queue (implementation varies based on scheduler version)
 * 
 * @return a string containing the string versions of the ready queue pcbs.
 */
Priority.prototype.toString = function()
{
    return this.readyQueue.toString();
};

Priority.prototype.swapComplete = function(args, status)
{        
    args[2].setStateFromPCB(args[1]);
    
    Scheduler.log("PID " +  args[2].pcb.pid + " is now queued to execute");
};

Priority.prototype.findPage = function()
{
    var pcb = null;

    // I know this is technically not the way it should be done, but it's quick and dirty.
    for(var index in this.readyQueue.h)
    {
        for(var vIndex in  this.readyQueue.h[index].v)
        {
            if(this.readyQueue.h[index].v[vIndex].page.toString().indexOf("@") === -1)
            {
                pcb = this.readyQueue.h[index].v[vIndex];
                break;
            }
        }
        
        if(pcb !== null)
            break;
    }
    
    if(pcb === null)
    {
        pcb = _Residents.findPage();
    }
    console.log(pcb);
    
    return pcb;
};