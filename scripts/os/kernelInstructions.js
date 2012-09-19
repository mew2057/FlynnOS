// I separated this from kernel.js because it made things easier to read.
function krnLoadAcc(hexValues,cpu)
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


function krnStoreAcc(hexValues,cpu)
{
    _MemoryManager.store(hexValues[1] + hexValues[0], [padZeros(cpu.Acc.toString(16),2)]);
}

function krnAddWithCarry(hexValues,cpu)
{
    
    cpu.Acc = (cpu.Acc + _MemoryManager.retrieveContents(hexValues[1] + hexValues[0])) % 256;
}

function krnLoadX(hexValues,cpu)
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

function krnLoadY(hexValues,cpu)
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

function krnNOP(hexValues,cpu){}

function krnBreakProcess(hexValues,cpu)
{
    cpu.isExecuting = false;
}

function krnCompareX(hexValues,cpu)
{
    var toCompare = parseInt(_MemoryManager.retrieveContents(hexValues[1] + hexValues[0]), 16);
    
    cpu.Zflag = cpu.Xreg == toCompare?1:0;
    
}

function krnBranchNotEqual(branchAddress,cpu)
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

function krnIncrementByte(hexValues,cpu)
{
    var hexAddress = hexValues[1] + hexValues[0];
    
    var incrementedValue = ((parseInt(_MemoryManager.retrieveContents(hexAddress),
        16) + 1) % 256).toString(16);
        
    _MemoryManager.store(hexAddress,[padZeros(incrementedValue,2)]);
    
    
}

function krnSystemCall(hexValues,cpu)
{

    switch(cpu.Xreg)
    {
        case 1:
            _StdIn.advanceLine();
            _StdIn.putText(parseInt(cpu.Yreg,16));
            
            break;
        case 2:
            
            var outputChars = _MemoryManager.retrieveContentsToLimit(
                    cpu.Yreg.toString(16), "00");
            
            if(outputChars)
            {
                _StdIn.advanceLine();
                for(var index in outputChars)
                {
                    _StdIn.putText(String.fromCharCode(parseInt(outputChars[index],16)));
                }
            }
            else 
            {
                krnTrapError("String was not terminated, resulting in overflow!");
            }
            break;
        default:
            break;
    }
}

