/* ------------
   hostInstructions.js
   
   Requires globals.js, cpu.js, interrupt.js
   
   Routines for the Instruction Set of the cpu. Please note that philosophically
   this is "in" the CPU, but I separated it for clarity and readbility's sake.
   ------------ */
var ERROR = {
    "MEM"     : 0, 
    "OPERAND" : 1,
    "BRANCH"  : 2
    };

function instrLog (msg)
{
    simLog(msg, "H_INST");
}

function instrError (error, params)
{
    var msg = params[0] +"-";
    
    switch(error)
    {
        case ERROR.MEM:
            msg += "bad memory request at " + params[1];
            break;
        case ERROR.OPERAND:
            msg += "incorrect operand total";
            break;
        case ERROR.BRANCH:
            msg += "branch address may not exceed 256 or be under 0: " + params[1];

        default:
    }
    _KernelInterruptQueue.enqueue( new Interrupt(FAULT_IRQ, 
                new Array(INST_FAULT,msg)));
    instrLog(msg);
}



/**
 * LDA - LoaD the Accumulator: Loads the accumulator with either a constant 
 * (1 operand) or the contents of a memory location (2 operand). If too many 
 * operands are detected a minor fault is thrown.
 * 
 * @param hexValues The operand(s) of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostLoadAcc(hexValues,cpu)
{
    if (hexValues.length === 1) 
    {
        cpu.Acc = parseInt(hexValues[0],16);
        instrLog("LDA-Acc is now "  + cpu.Acc);
    }
    else if( hexValues.length === 2 )
    {
        var contents = _MemoryManager.retrieveContents(hexValues[1] + hexValues[0], cpu.pcb);
        
        if(contents !== null)
        {
            cpu.Acc = parseInt(contents,16);
            instrLog("LDA-Acc is now "  + cpu.Acc);
        }
        else
        {
            instrError(ERROR.MEM, ["LDA", hexValues[1] + hexValues[0]]);
        }
    }
    else
    {
        instrError(ERROR.OPERAND, ["LDA"]);
    }
}


/**
 * STA - Store The Accumulator: Stores the contents of the accumulator to a 
 * memory location specified in the operands.
 * 
 * @param hexValues The operands of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostStoreAcc(hexValues,cpu)
{
    if(_MemoryManager.store(hexValues[1] + 
        hexValues[0], [padZeros(cpu.Acc.toString(16),2)], cpu.pcb) === 0)
    {
        instrLog("STA-store at " + (hexValues[1] + hexValues[0]) + " succeeded");
    }
    else
    {
        instrError(ERROR.MEM, ["STA", hexValues[1] + hexValues[0]]);
    }
    
}

/**
 * ADC - ADd with Carry: Adds the contents of the Accumulator to the contents of
 * the memory position pointed to by the operand.
 * 
 * @param hexValues The operand(s) of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostAddWithCarry(hexValues,cpu)
{
    var memContents = _MemoryManager.retrieveContents(hexValues[1] +
        hexValues[0], cpu.pcb);
    
    if(memContents !== null)
    {
        //As this is implicitly two's complement this will suffice.
        cpu.Acc = (cpu.Acc + parseInt(memContents,16)) % 256;
        instrLog("ADC-Acc is now " +  cpu.Acc);
    }
    else
    {        
        instrError(ERROR.MEM, ["ADC", hexValues[1] + hexValues[0]]);
    }
}

/**
 * LDX - LoaD the X register: Loads the X register with either a constant 
 * (1 operand) or the contents of a memory location (2 operand). If too many 
 * operands are detected a minor fault is thrown.
 * 
 * @param hexValues The operand(s) of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostLoadX(hexValues,cpu)
{
    if (hexValues.length === 1) 
    {
        cpu.Xreg = parseInt(hexValues[0],16);
        instrLog("LDX-X register is now " + cpu.Xreg);
    }
    else if( hexValues.length === 2 )
    {
        var contents = _MemoryManager.retrieveContents(hexValues[1] + hexValues[0], cpu.pcb);
        
        if(contents !== null)        
        {
            cpu.Xreg =parseInt(contents,16);            
            instrLog("LDX-X register is now " + cpu.Xreg);
        }
        else
        {
            instrError(ERROR.MEM, ["LDX", hexValues[1] + hexValues[0]]);
        }
    }
    else
    {
        instrError(ERROR.OPERAND, ["LDX"]);
    }
}

/**
 * LDY - LoaD the Y register: Loads the Y register with either a constant 
 * (1 operand) or the contents of a memory location (2 operand). If too many 
 * operands are detected a minor fault is thrown.
 * 
 * @param hexValues The operand(s) of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostLoadY(hexValues,cpu)
{
    if (hexValues.length === 1) 
    {
        cpu.Yreg = parseInt(hexValues[0],16);
        instrLog("LDX-Y register is now " + cpu.Xreg);

    }
    else if( hexValues.length === 2 )
    {
        var contents = _MemoryManager.retrieveContents(hexValues[1] + hexValues[0], cpu.pcb);
        
        if(contents !== null)
        {
            cpu.Yreg = parseInt(contents,16);
            instrLog("LDX-Y register is now " + cpu.Xreg);
        }        
        else
        {   
            instrError(ERROR.MEM, ["LDY", hexValues[1] + hexValues[0]]);
        }
    }
    else
    {
        instrError(ERROR.OPERAND, ["LDY"]);
    }   
}

/**
 * NOP - No OPeration: Literally performs no operations.
 */
function hostNOP(){instrLog("NOP");}

/**
 * CPX - ComPare X register: Compares the contents of the X register with the 
 * contents of the supplied memory address and loads the result of the boolean
 * expression into the Z flag.
 * 
 * @param hexValues The operand(s) of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostCompareX(hexValues,cpu)
{
    var toCompare =_MemoryManager.retrieveContents(hexValues[1] + hexValues[0], cpu.pcb);
    
    toCompare = toCompare !== null ? parseInt(toCompare, 16) : null;
    
    if(toCompare !== null)
    {
        cpu.Zflag = cpu.Xreg == toCompare? 1 : 0;
        instrLog("CPX-Z flag is now " + cpu.Zflag);
    }
    else
    {
        instrError(ERROR.MEM, ["CPX", hexValues[1] + hexValues[0]]);
    }
}

/**
 * BNE - Branch Not Equal: Branches the number of bytes specified in the operand
 * as a two's complement integer if the Z flag is NOT set. The branched address 
 * is relative to the current Program Counter value. 
 * 
 * I feel it is necessary to note that I consider the supplied operand a two's 
 * compliment number meaning a user may only jump half the page size with one branch.
 * 
 * @param hexValues The operand(s) of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostBranchNotEqual(hexValues,cpu)
{
    if(cpu.Zflag === 0)
    {
        var branchAddress = parseInt(hexValues[0],16);
        
        /*
         * As the leading bit carries the sign of the number in two's complement
         * And our CPU is 8bit 128 and a bitwise or will extract the important bit.
         * If the leading bit is 1 then the result is truthy and it is necessary
         * to do some work.
         */
        if(128 & branchAddress)
        {
            cpu.PC -= (256 - branchAddress);
        }
        else
        {
            cpu.PC += branchAddress;
        }
        
        // Make sure the PC doesn't exceed the page size.
        if(cpu.PC < 0 || cpu.PC > _MemoryManager.pageSize)
        {
            instrError(ERROR.BRANCH, ["BNE", hexValues[0]]);
        }
        else
        {
            instrLog("BNE-new PC " + cpu.PC);
        }
    }
    else
    {
        instrLog("BNE-no branch");
    }
}

/**
 * INC - INCrement byte: Increments the contents of the memory address at operand
 * by one.
 * 
 * @param hexValues The operand(s) of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostIncrementByte(hexValues,cpu)
{
    var hexAddress = hexValues[1] + hexValues[0];
    
    var contents = parseInt(_MemoryManager.retrieveContents(hexAddress, cpu.pcb),16);
    
    if(contents === null)
    {
        // It is assumed that the storage will succeed as the memory address 
        // has already been tested.
        instrError(ERROR.MEM, ["INC", hexValues[1] + hexValues[0]]);

    }
    else
    {
        var incrementedValue = (( contents + 1) % 256).toString(16);       
        _MemoryManager.store(hexAddress,[padZeros(incrementedValue,2)],cpu.pcb);
        
        instrLog("INC-" + hexAddress+ " incremented to " + incrementedValue);
    }
}

/**
 * BRK - BReak: Breaks the execution of the process.
 * 
 * @param hexValues N/A
 * @param cpu The cpu that this instruction addresses.
 */
function hostBreakProcess(hexValues,cpu)
{
    _KernelInterruptQueue.enqueue(new Interrupt(BRK_IRQ, new Array(cpu)));
    instrLog("BRK-Interrupt fired");
}

/**
 * SYS - SYStem call: Raises a System Call interrupt for the kernel to process.
 * Xreg == 1 : Prints the contents of the Y register.
 * Xreg == 2 : Prints the contents of memory from the address in the Y register
 *              to the first occurrence of 00 in the core memory as a String.
 * 
 * @param hexValues The operand(s) of the instruction.
 * @param cpu The cpu that this instruction addresses.
 */
function hostSystemCall(hexValues,cpu)
{
    _KernelInterruptQueue.enqueue(new Interrupt(SYSTEM_IRQ, new Array(cpu.Xreg, 
        cpu.Yreg)));
    instrLog("SYS-Interrupt fired");

}

