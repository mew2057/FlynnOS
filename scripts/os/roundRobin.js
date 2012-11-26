/* ------------
   roundRobin.js
   
   The process scheduler. Defines a round robin scheduler.
   Please forgive the rudimentary Quantum Leap references.
   ------------ */
RoundRobin.prototype = new Scheduler;

// The default amount of time it takes for Dr. Beckett to hopefully make the leap that brings him back home.
// Oh wait that's Quamtum Leap, this is the default time between context switches in round robin.
RoundRobin.DEFAULT_QUANTUM = 6;

/**
 * The Round Robin function, inherits from the base scheduler class.
 */
function RoundRobin ()
{
    // The number of cycles that a process has focus in the scheduler.
    // Defaults to 6.
    this.quantum = RoundRobin.DEFAULT_QUANTUM;
    
    // The difference in time since the process has been enqueued.
    this.tick = 1;
    
    // Contains the enqueued processes.
    this.readyQueue = [];
    
    this.name = "rr";

}

/**
 * Sets the quantum to the default.
 */
RoundRobin.prototype.resetQuantum = function()
{
    this.quantum.setQuantum(RoundRobin.DEFAULT_QUANTUM);

};

/**
 * Sets the scheduler quantum to the supplied quantum.
 * @quant The new Quantum.
 */
RoundRobin.prototype.setQuantum = function(quant)
{
    // Vets the supplied quantum to ensure it is a non negative, non zero integer.
    if(!isNaN(quant) && quant > 0 && quant % 1 === 0 )
    {
        this.quantum = quant;
        Scheduler.log("Quantum is now " + this.quantum);
        Scheduler.toConsole("Quantum:" + this.quantum);
    }
    else
    {
        Scheduler.toConsole("The supplied quanta is not a valid positive integer greater than 0.");
        Scheduler.log("Quantum failed to be set");
    }
};

/**
 * A quantum gettor.
 * 
 * @return The quantum number.
 */
RoundRobin.prototype.getQuantum = function()
{
    return this.quantum;    
};


/**
 * Checks to see if the scheduler is ready enqueue a context switch and logs 
 * that the context switch is enqueued. 
 */
RoundRobin.prototype.isReady = function()
{
    // If the tick exceeds or equals the quantum and the readyQueue is non zero 
    // it's time to do a switch.
    if(this.tick++ >= this.quantum)
    {
        if(this.readyQueue.length > 0)
        {
            _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_IRQ, []));
            Scheduler.log("Initiating context switch");
        }
        else
        {
            this.tick = 1;    
        }
    }
};

/**
 * Enqueues the next process on the scheduler queue. If none are found toggle
 * the processEnqueued flag to prevent unnecessary cycles in the CPU.
 * 
 * @param cpu The cpu state at the time of invocation.
 * @param finished If set to true this will NOT enqueue the executing process to 
 *  the ready queue.
 * @param terminated If set the process has been killed by the user do something different.
 */
RoundRobin.prototype.processNext = function(cpu, finished, terminated)
{
    var tempPCB = null;
    // If  break is set and this is hit from a break, set the break to false.
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
    if(this.readyQueue.length >  0)
    {
        
        // If the cpu has an executing process and is not finished then the pcb 
        // state must be saved and returned to the ready queue.
        // Else if the executing process is done, log that it is done executing.
        if(!finished && cpu.pcb)
        {
            cpu.pcb.update(cpu);
            this.readyQueue.push(cpu.pcb);
        }
        else if (finished)
        {
            Scheduler.log("PID " + cpu.pcb.pid + (terminated ? " terminated": " is finished executing"));
        }
        
        tempPCB = this.readyQueue.shift();
        
        if(tempPCB.Base.toString().indexOf("@") !== -1)
        {
            if(!finished && cpu.pcb)
                this.readyQueue.pop();
            
            if(cpu.pcb === null)
            {
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
    
    // Reset the tick, Dr. Beckett is fixing a different life now.
    this.tick = 1;
};

/**
 * Schedules a process.
 * 
 * @param cpu The cpu at the time of invocation.
 * @param pcb The Process Control Block to be enqueued.
 */
RoundRobin.prototype.scheduleProcess = function(cpu, pcb)
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
    // in the execution and fake that the quantum expired. Al might get mad at this, 
    // but he's just a hologram so who really cares.
    if(cpu.pcb === null)
    {
        this.tick = this.quantum;
    }
    
    // This allows the cpu portion of the cycle to execute.
    this.processEnqueued = true;
    
    // Enqueue the pcb and notify.
    this.readyQueue.push(pcb);      
    Scheduler.log("PID " + pcb.pid + " enqueued");
};

/**
 * Removes the pcb with the supplied pid from the schedule.
 * 
 * @param cpu The cpu at the time of invocation.
 * 
 * @param pid The process identifier to remove from the schedule.
 */
RoundRobin.prototype.removeFromSchedule = function(cpu, pid)
{
    // If the pid is present in the cpu emulate a break.
    // Else check to see if the pid is on the ready queue.
    if(cpu.pcb && cpu.pcb.pid === pid)
    {
        // I opt for this methodology, as it prevents unnecessary context switches inherently.
        // A break interrupt is enqueued as it ensures consistent handling.
        _KernelInterruptQueue.enqueue(new Interrupt(BRK_IRQ, new Array(cpu,true)));
        
        // I output this here in an effort to reduce circumstantial code in the processNext function.
        Scheduler.toConsole("PID: " + pid + " Terminated.");
        
        // Set the break flag to clear out any other context switches.
         this.setBreak(true);
        
        // Ensures the processEnqueued field is properly changed.
        this.processEnqueued = this.readyQueue.length > 0;
    
    }
    else
    {
        // Iterate over the ready queue and deal with one that matches the 
        for(var index = 0, length = this.readyQueue.length; index < length; index ++)
        {
            if(this.readyQueue[index].pid === pid)
            {
                // Reclaim the now defunct page.
                this.reclaimPCB(this.readyQueue[index]);
                
                if(this.readyQueue[index].Base.toString().indexOf("@") !== -1)
                {
                    krnDiskDelete(this.readyQueue[index].Base,[])
                }
                
                // Remove the element from the readyQueue.
                this.readyQueue.splice(index,1);
                
                // Output the details.
                Scheduler.toConsole("PID: " + pid + " terminated.");
                Scheduler.log("PID " + pid + " terminated" );
                
                
                break;
            }
        }
        // If it wasn't found let the user know, else modify the processEnqueued state.
        if( index >= length)
        {
            Scheduler.toConsole("PID: " + pid + "  not found!");
            Scheduler.log("PID " + pid + " not found to terminate" );
        }
        else
        {
            this.processEnqueued = this.readyQueue.length > 0 || cpu.pcb !== null;
        }
    }
    
};

/**
 * Outputs the active process ids to a string.
 * 
 * @return The string containing active processes.
 */
RoundRobin.prototype.activesToString = function(cpu)
{
    var pidString = "";
    
    // Aggregate executing pids.
    for (var resident = 0; resident < this.readyQueue.length; resident++)
    {
        pidString += this.readyQueue[resident].pid + " ";
    }
    
    // Pull the executing cpu (if present).
    if(cpu.pcb)
    {
        pidString += cpu.pcb.pid;    
    }
    
    return pidString !== "" ? pidString : "No active processes.";
};


/**
 * The toString for the readyQueue in teh scheduler.
 * 
 * @return A string of the ready queue contents.
 */
RoundRobin.prototype.toString = function()
{
    var retVal = "";
    
    // Just iterates over the queue.
    for (var i in this.readyQueue)
    {
        retVal += this.readyQueue[i];
    }
    
    return retVal;
};

RoundRobin.prototype.swapComplete = function(args, status)
{
    // If the pcb has a page of -1 it exists on the HDD else the page is dead.
    if(args[0].page === -1 && args[3])
        this.readyQueue.push(args[0]);
        
    args[2].setStateFromPCB(args[1]);
    
    Scheduler.log("PID " +  args[2].pcb.pid + " is now queued to execute");
};

RoundRobin.prototype.findPage = function()
{
    var pcb = null;
    for(var index in this.readyQueue)
    {
        if(this.readyQueue[index].page.toString().indexOf("@") === -1)
        {
            pcb = this.readyQueue[index];
            break;
        }
    }
    
    if(pcb === null)
    {
        pcb = _Residents.findPage();
    }
    
    return pcb;
};
