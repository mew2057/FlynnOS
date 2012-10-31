/* ------------
   Scheduler.js
   
   The process scheduler. Defines a default scheduler and round robin.
   ------------ */
function Scheduler()
{
    this.processEnqueued = false;
}

Scheduler.log = function (msg)
{
    simLog(msg, "O_SCH");
};

Scheduler.prototype.isReady = function(){};
Scheduler.prototype.processNext = function(cpu, finished){};
Scheduler.prototype.scheduleProcess = function(cpu, pcb){};
Scheduler.prototype.removeFromSchedule = function(cpu, pid){};
Scheduler.prototype.activesToString = function(){};
Scheduler.prototype.toString = function(){};
Scheduler.prototype.getReadyQueue = function(){};

// Round Robin Currently an issue with quantum of 3 and 1
//-------------------------------
RoundRobin.prototype = new Scheduler;

RoundRobin.DEFAULT_QUANTUM = 6;

function RoundRobin ()
{
    // The number of cycles that a process has focus in the scheduler.
    // Defaults to 6.
    this.quantum = RoundRobin.DEFAULT_QUANTUM;
    this.tick = 1;
    this.readyQueue = [];
}

RoundRobin.prototype.resetQuantum = function()
{
    this.quantum.setQuantum(RoundRobin.DEFAULT_QUANTUM);

};

RoundRobin.prototype.setQuantum = function(quant)
{
    this.quantum = quant;
    Scheduler.log("quantum is now " + this.quantum);
    return true;

};
RoundRobin.prototype.isReady = function()
{    
    if(this.tick++ >= this.quantum)
    {
        _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_IRQ, []));
        Scheduler.log("Initiating context switch");
    }
};

RoundRobin.prototype.processNext = function(cpu, finished, terminated)
{
    if (finished )
    {
        _Break = false;
    }
    else if(_Break)
    {
        return;
    }
            
    if(this.readyQueue.length >  0)
    {
        
        if(!finished && cpu.pcb)
        {
            cpu.pcb.update(cpu);
            this.readyQueue.push(cpu.pcb);
        }
        else if (finished)
        {
            Scheduler.log(" pid " + cpu.pcb.pid + (terminated ? " terminated": " is finished executing"));
        }
        
        var pcb = this.readyQueue.shift();
        
        cpu.setStateFromPCB(pcb);
        
        Scheduler.log("pid " + cpu.pcb.pid + " is now queued to execute");
    }
    else if(finished)
    {
        Scheduler.log(" pid " + cpu.pcb.pid + (terminated ? " terminated":" is finished executing"));
        cpu.pcb = null;    
        this.processEnqueued = false;
    }
    
    this.tick = 1;
};

RoundRobin.prototype.scheduleProcess = function(cpu, pcb)
{
    if(!pcb)
    {
        //TODO error notification.
        return;    
    }
    
    if(cpu.pcb === null)
    {
        this.tick = this.quantum;
    }
    
    this.processEnqueued = true;
    
    this.readyQueue.push(pcb);  
};

RoundRobin.prototype.removeFromSchedule = function(cpu, pid)
{
    // I think I can make this slicker, but it's easier to take advantage of 
    // the Break IRQ so CPU executing processes can stop in a consistent manner.
    if(cpu.pcb && cpu.pcb.pid === pid)
    {
        _KernelInterruptQueue.enqueue(new Interrupt(BRK_IRQ, new Array(cpu,true)));
        _StdIn.putText("PID: " + pid + " Terminated.");
        
        // Set the break flag to clear out any other context switches.
        _Break = true;
        this.processEnqueued = this.readyQueue.length > 0;
    
    }
    else
    {
        for(var index = 0; index < this.readyQueue.length; index ++)
        {
            if(this.readyQueue[index].pid === pid)
            {
                _MemoryManager.reclaimPage(this.readyQueue[index].page);
                
                _Terminated.enqueue(this.readyQueue[index]);
                this.readyQueue.splice(index,1);
                
                _StdIn.putText("PID: " + pid + " Terminated.");
                Scheduler.log("pid " + pid + " killed" );
                break;
            }
        }
        
        this.processEnqueued = this.readyQueue.length > 0 || cpu.pcb !== null;
    }
    
};

RoundRobin.prototype.activesToString = function(cpu)
{
    var pidString = "";
    
    for (var resident = 0; resident < this.readyQueue.length; resident++)
    {
        pidString += this.readyQueue[resident].pid + " ";
    }
    
    if(cpu.pcb)
    {
        pidString += cpu.pcb.pid;    
    }
    
    return pidString != "" ? pidString : "No active processes.";
};

RoundRobin.prototype.toString = function()
{
    var retVal = "";
    for (var i in this.readyQueue)
    {
        retVal += this.readyQueue[i];
    }
    return retVal;
};

//-------------------------------

