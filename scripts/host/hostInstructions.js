// I separated this from cpu.js because it made things easier to read.

function hostLoadAcc(hexValues,cpu)
{
    if (hexValues.length === 1) 
    {
        cpu.Acc = parseInt(hexValues[0],16);
    }
    else if( hexValues.length === 2 )
    {
        cpu.Acc = _MemoryManager.retrieveContents(hexValues[1] + hexValues[0]);
    }
    else
    {
        //Trap?
    }    
}


function hostStoreAcc(hexValues,cpu)
{
    _MemoryManager.store(hexValues[1] + hexValues[0], [padZeros(cpu.Acc.toString(16),2)]);
}

function hostAddWithCarry(hexValues,cpu)
{
    
    cpu.Acc = (cpu.Acc + _MemoryManager.retrieveContents(hexValues[1] + hexValues[0])) % 256;
}

function hostLoadX(hexValues,cpu)
{
    if (hexValues.length === 1) 
    {
        cpu.Xreg = parseInt(hexValues[0],16);
    }
    else if( hexValues.length === 2 )
    {
        
        cpu.Xreg = _MemoryManager.retrieveContents(hexValues[1] + hexValues[0]);
    }
    else
    {
        //Trap?
    }   
}

function hostLoadY(hexValues,cpu)
{
    if (hexValues.length === 1) 
    {
        cpu.Yreg = parseInt(hexValues[0],16);
    }
    else if( hexValues.length === 2 )
    {
        cpu.Yreg = _MemoryManager.retrieveContents(hexValues[1] + hexValues[0]);
    }
    else
    {
        //Trap?
    }   
}

function hostNOP(hexValues,cpu){}

function hostBreakProcess(hexValues,cpu)
{
    cpu.isExecuting = false;
}

function hostCompareX(hexValues,cpu)
{
    var toCompare = parseInt(_MemoryManager.retrieveContents(hexValues[1] + hexValues[0]), 16);
    
    cpu.Zflag = cpu.Xreg == toCompare?1:0;
    
}

function hostBranchNotEqual(branchAddress,cpu)
{
    if(cpu.Zflag == 0)
    {
        if(128 & parseInt(branchAddress[0],16))
        {
            cpu.PC -= (256 - parseInt(branchAddress[0],16));
        }
        else
        {
            cpu.PC += parseInt(branchAddress[0],16);
        }
    }
}

function hostIncrementByte(hexValues,cpu)
{
    var hexAddress = hexValues[1] + hexValues[0];
    
    var incrementedValue = ((parseInt(_MemoryManager.retrieveContents(hexAddress),
        16) + 1) % 256).toString(16);
        
    _MemoryManager.store(hexAddress,[padZeros(incrementedValue,2)]);
    
    
}
//Interupt
function hostSystemCall(hexValues,cpu)
{
   _KernelInterruptQueue.enqueue( new Interrupt(SYSTEM_IRQ, new Array(cpu)) );
}

