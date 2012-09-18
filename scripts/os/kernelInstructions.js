// I separated this from kernel.js because it made things easier to read.
function krnLoadAcc(hexValues)
{
    if (hexValues.length === 1) 
    {
        _CPU.Acc = parseInt(hexValues[0],16);
    }
    else if( hexValues.length === 2 )
    {
        _CPU.Acc = _MemoryManager.retrieveContents(hexValues[1] + hexValues[0]);
    }
    else
    {
        //Trap?
    }    
}


function krnStoreAcc(hexValues)
{
    _MemoryManager.store(hexValues[1] + hexValues[0], [padZeros(_CPU.Acc.toString(16),2)]);
}

function krnAddWithCarry(hexValues)
{
    
    _CPU.Acc = (_CPU.Acc + _MemoryManager.retrieveContents(hexValues[1] + hexValues[0])) % 256;
}

function krnLoadX(hexValues)
{
    if (hexValues.length === 1) 
    {
        _CPU.Xreg = parseInt(hexValues[0],16);
    }
    else if( hexValues.length === 2 )
    {
        
        _CPU.Xreg = _MemoryManager.retrieveContents(hexValues[1] + hexValues[0]);
    }
    else
    {
        //Trap?
    }   
}

function krnLoadY(hexValues)
{
    if (hexValues.length === 1) 
    {
        _CPU.Yreg = parseInt(hexValues[0],16);
    }
    else if( hexValues.length === 2 )
    {
        _CPU.Yreg = _MemoryManager.retrieveContents(hexValues[1] + hexValues[0]);
    }
    else
    {
        //Trap?
    }   
}

function krnNOP()
{    
}

function krnBreakProcess()
{
    
}

function krnCompareX(hexValues)
{
    var toCompare = parseInt(_MemoryManager.retrieveContents(hexValues[1] + hexValues[0]), 16);
    
    _CPU.Zflag = _CPU.Xreg == toCompare?1:0;
    
}

function krnBranchNotEqual(branchAddress)
{
    if(_CPU.Zflag == 0)
    {
        if(128 & parseInt(branchAddress,16))
        {
            _CPU.PC -= (256 - parseInt(branchAddress,16));
        }
        else
        {
            _CPU.PC += parseInt(branchAddress,16);
        }
    }
}

function krnIncrementByte(hexValues)
{
    var hexAddress = hexValues[1] + hexValues[0];
    
    var incrementedValue = ((parseInt(_MemoryManager.retrieveContents(hexAddress),
        16) + 1) % 256).toString(16);
        
    _MemoryManager.store(hexAddress,[padZeros(incrementedValue,2)]);
    
    
}

function krnSystemCall()
{

    switch(_CPU.Xreg)
    {
        case 1:
            _StdIn.putText(parseInt(_CPU.Yreg,16));
            break;
        case 2:
            
            var outputChars = _MemoryManager.retrieveContentsToLimit(
                    _CPU.Yreg.toString(16), "00");
            
            if(outputChars)
            {
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

