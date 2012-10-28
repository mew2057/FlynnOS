/* ------------
   Scheduler.js
   
   The process scheduler. Defines a default scheduler and round robin.
   ------------ */
function Scheduler()
{
    
}

Scheduler.prototype.isReady = function(){};
Scheduler.prototype.processNext = function(cpu,readyQueue, finished){};
Scheduler.prototype.scheduleProcess = function(cpu, readyQueue, pcb){};
Scheduler.prototype.removeFromSchedule = function(cpu, readyQueue, pid){};



// Round Robin
//-------------------------------
RoundRobin.prototype = new Scheduler;

RoundRobin.DEFAULT_QUANTUM = 6;

function RoundRobin ()
{
    // The number of cycles that a process has focus in the scheduler.
    // Defaults to 6.
    this.quantum = RoundRobin.DEFAULT_QUANTUM;
    this.scheduleQueue = [];
    this.tick = 0;
}

RoundRobin.prototype.resetQuantum = function()
{
    this.quantum.setQuantum(RoundRobin.DEFAULT_QUANTUM);

};

RoundRobin.prototype.setQuantum = function(quant)
{
    this.quantum = quant;
    krnTrace(" quantum is now " + this.quantum);

};

RoundRobin.prototype.isReady = function()
{    
    if(this.tick++ >= this.quantum)
    {
        _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_IRQ, []));
    }
};

RoundRobin.prototype.processNext = function(cpu, readyQueue, finished)
{
    
    if(readyQueue.getSize() >  0)
    {
        if(!finished && cpu.pcb)
        {
            cpu.pcb.update(cpu);
            readyQueue.enqueue(cpu.pcb);
        }
        
        cpu.setStateFromPCB(readyQueue.dequeue());
        
        krnTrace(" pid " + cpu.pcb.pid + " is now scheduled to execute");

    }
    else if(finished)
    {
        krnTrace(" pid " + cpu.pcb.pid + " is finished executing");
        cpu.pcb = null;    
    }
    
    this.tick = 0;
};

RoundRobin.prototype.scheduleProcess = function(cpu, readyQueue, pcb)
{
    if(!pcb)
    {
        //TODO error notification.
        return;    
    }
    if(cpu.pcb === null)
    {
        this.tick == this.quantum;
    }
    
    readyQueue.enqueue(pcb);  
};

Scheduler.prototype.removeFromSchedule = function(cpu, readyQueue, pid)
{
    if(cpu.pcb && cpu.pcb.pid === pid)
    {
        _KernelInterruptQueue.enqueue(new Interrupt(BRK_IRQ, new Array(cpu,true)));
    }
    else
    {
        for(var index = 0; index < readyQueue.q.length; index ++)
        {
            if(readyQueue.q[index])
            {
                readyQueue.q.slice(index,1);
                _StdIn.putText("PID:" + pid + " Removed from ready queue.");
                break;
            }
        }
        
    }
    
    
};


//-------------------------------

