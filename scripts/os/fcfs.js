/* ------------
   fcfs.js
   
   Effectively this scheduler is RoundRobinLite.
   ------------ */
FCFS.prototype = new RoundRobin;

function FCFS (){
    this.name = "fcfs";
}

/**
 * First come first serve is literally Round Robin without the tick. Using the 
 * trick I used to kick off Round Robin Scheduling I can kick off fcfs as well.
 */
FCFS.prototype.isReady = function()
{
    if(this.tick === this.quantum)
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