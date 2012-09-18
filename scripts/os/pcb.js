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

ProcessControlBlockCollection.prototype.updateBlock = function(cpu,pid)
{
    this.pcbs[pid].PC = cpu.PC;
    this.pcbs[pid].Acc = cpu.Acc;
    this.pcbs[pid].Xreg = cpu.Xreg;
    this.pcbs[pid].Yreg = cpu.Yreg;
    this.pcbs[pid].Zflag = cpu.Zflag;
};



