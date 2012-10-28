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

// Round Robin
//-------------------------------
RoundRobin.prototype = new Scheduler;

RoundRobin.DEFAULT_QUANTUM = 6;

function RoundRobin ()
{
    // The number of cycles that a process has focus in the scheduler.
    // Defaults to 6.
    this.quantum = RoundRobin.DEFAULT_QUANTUM;
    this.tick = 0;
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

};
RoundRobin.prototype.isReady = function()
{    
    if(this.tick++ >= this.quantum)
    {
        _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_IRQ, []));
    }
};

RoundRobin.prototype.processNext = function(cpu, finished)
{
    
    if(this.readyQueue.length >  0)
    {
        if(!finished && cpu.pcb)
        {
            cpu.pcb.update(cpu);
            this.readyQueue.push(cpu.pcb);
        }
        var pcb = this.readyQueue.shift();

        cpu.setStateFromPCB(pcb);
        
        Scheduler.log("pid " + cpu.pcb.pid + " is now executing");
    }
    else if(finished)
    {
        Scheduler.log(" pid " + cpu.pcb.pid + " is finished executing");
        cpu.pcb = null;    
        this.processEnqueued = false;
    }
    
    this.tick = 0;
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
    if(cpu.pcb && cpu.pcb.pid === pid)
    {
        _KernelInterruptQueue.enqueue(new Interrupt(BRK_IRQ, new Array(cpu,true)));
        this.processEnqueued = this.readyQueue.length > 0;
    }
    else
    {
        for(var index = 0; index < this.readyQueue.length; index ++)
        {
            if(this.readyQueue[index])
            {
                this.readyQueue.slice(index,1);
                _StdIn.putText("PID:" + pid + " Removed from ready queue.");
                Scheduler.log("pid " + pid + " killed" );
                break;
            }
        }
        
        this.processEnqueued = this.readyQueue.length > 0 || cpu.pcb != null;
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

