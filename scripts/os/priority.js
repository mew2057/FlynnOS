/* ------------
   priority.js
   
   A min type priority queue driven scheduler for flynnos. May or may not be a 
   blatant rewrite of the round robin...
   ------------ */
   
Priority.prototype = new Scheduler;

function Priority()
{
    this.readyQueue = new PriorityMinQueue();
    
    // This kicks off the execution for this type of scheduler.
    this.startExecution  = false;
    
    // ...
    this.name = "priority";
    
    // The Ignore Queue circumvents me having to completely rebuild my ready queue on a kill command.
    this.ignoreQueue = [];
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
        
        // If the pid is on the ignore queue, it needs to be... ignored...
        while(tempPCB !== null && this.ignoreQueue.indexOf(tempPCB.pid) !== -1)
        {
            Scheduler.log("PID " + tempPCB.pid + " terminated");
            
            this.ignoreQueue.splice(this.ignoreQueue.indexOf(tempPCB.pid),1);
            
            tempPCB = this.readyQueue.remove();
        }
        
        // Since this needs to account for the potential termination of all ready processes do a null check first.
        if(tempPCB !== null && tempPCB.Base.toString().indexOf("@") !== -1)
        {
            if(cpu.pcb === null)
            {
                this.startInitialSwap(tempPCB,cpu);
            }
            else
            {
                this.startSwap(cpu.pcb, tempPCB, cpu);
            }
        }
        else if (tempPCB !== null)
        {
            // Load the leading element in the queue to the cpu.
            cpu.setStateFromPCB(tempPCB);
            Scheduler.log("PID " + cpu.pcb.pid + " is now queued to execute");
        }
        else
        {
            cpu.pcb = null;    
            this.processEnqueued = false;
            Scheduler.log("All processes have been killed");
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
        this.processEnqueued = !this.readyQueue.isEmpty();
    }
    else
    {
        var found = false;
        
        /*
         * This is ugly, and not terribly OOP, but it is guaranteed in my OS and 
         * it makes this scheculer way easier to handle for kills.
         * Effectively this processes the whole ready queue searching for the pid
         * in all the sub queues (since I use a "bucket" implementation for the ready queue)
        */
        for(var index in this.readyQueue.h)
        {
            for(var vIndex in  this.readyQueue.h[index].v)
            {
                if(this.readyQueue.h[index].v[vIndex].pid === pid)
                {
                    // Reclaim the now defunct page.
                    this.reclaimPCB(this.readyQueue.h[index].v[vIndex]);
                    
                    // Delete the swap file if present.
                    if(this.readyQueue.h[index].v[vIndex].Base.toString().indexOf("@") !== -1)
                    {
                        krnDiskDelete(this.readyQueue.h[index].v[vIndex].Base,[])
                    }
                    
                    // Make sure to tell the scheduler that the pid is "bad"
                    this.ignoreQueue.push(pid);
                    
                    // Output the details.
                    Scheduler.toConsole("PID: " + pid + " queued for terminatation.");
                    Scheduler.log("PID " + pid + " queued for termination" );
                    
                    found = true;
                    break;
                }
            }
        }
        
        // If it wasn't found let the user know, else modify the processEnqueued state.
        if(!found)
        {
            Scheduler.toConsole("PID: " + pid + "  not found!");
            Scheduler.log("PID " + pid + " not found to terminate" );
        }
    }
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
Priority.prototype.swapComplete = function(args, status)
{        
    args[2].setStateFromPCB(args[1]);
    
    Scheduler.log("PID " +  args[2].pcb.pid + " is now queued to execute");
};

/**
 * Finds a pcb that has a usable memory page in either the ready queue (implementation specific)
 * or the resident's list.
 * 
 * @return A pcb with a memory page {1-3}. If null is returned there are far worse problems...
 */
Priority.prototype.findPage = function()
{
    var pcb = null;

    // See the kill command for a brief overview of how this loop works.
    for(var index in this.readyQueue.h)
    {
        for(var vIndex in  this.readyQueue.h[index].v)
        {
            // If it's not a swapped page, consider it fair game to swap with.
            if(this.readyQueue.h[index].v[vIndex].page.toString().indexOf("@") === -1)
            {
                pcb = this.readyQueue.h[index].v[vIndex];
                break;
            }
        }
        
        // Stop searching if we found our solution.
        if(pcb !== null)
            break;
    }
    
    // If it's still null go to the residents for help 
    // (There is literally no feasible manner in which this should fail after this...)
    if(pcb === null)
    {
        pcb = _Residents.findPage();
    }
        
    return pcb;
};