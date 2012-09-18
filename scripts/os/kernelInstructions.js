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
    _MemoryManager.store(hexValues[1] + hexValues[0], _CPU.Acc);
}

function krnAddWithCarry(hexValues)
{
    _CPU.Acc = (_CPU.Acc + _MemoryManager.retrieveContents(hexValues[1] + hexValues[0])) % 256;
}

function krnLoadX(hexValues)
{
    alert(hexValues.length);
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

function krnCompareX()
{
    
}

function krnBranchNotEqual()
{

}

function krnIncrementByte()
{
    
}

function krnSystemCall()
{
    
}