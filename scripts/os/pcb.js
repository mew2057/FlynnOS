function PCB()
{
    this.PC    = 0;     // Program Counter
    this.Acc   = 0;     // Accumulator
    this.Xreg  = 0;     // X register
    this.Yreg  = 0;     // Y register
    this.Zflag = 0;     // Z-ero flag 
    this.Base  = 0;     // Base of the program page in core memory. 
    this.Limit = 0;     // The Upper limit of the program page.
}
PCB.prototype.update = function(cpu)
{
    this.PC = cpu.PC;
    this.Acc = cpu.Acc;
    this.Xreg = cpu.Xreg;
    this.Yreg = cpu.Yreg;
    this.Zflag = cpu.Zflag;
};

// This has no functionality that really sets it apart aside from philosophy.
function ProcessControlBlockCollection()
{
    this.pcbs = [];  
}

ProcessControlBlockCollection.prototype.getBlock = function(pid)
{
    if(pid < this.pcbs.length)
    {
        return this.pcbs[pid];
    }
    else
    {
        return null;
    }
};

ProcessControlBlockCollection.prototype.setBlock = function(pcb,pid)
{
    this.pcbs[pid] = pcb;  
};

